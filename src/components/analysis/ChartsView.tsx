import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Card, Text, Portal, Modal, Button, IconButton, Divider, Chip } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';
import { useData } from '../../context/DataContext';
import { calculateFrequency, calculateBonusBallFrequency, calculateAdvancedStats } from '../../api/analysis';
import { ChartConfig, ChartData } from 'react-native-chart-kit/dist/HelperTypes';
import { LottoDraw } from '../../types';
import { Picker } from '@react-native-picker/picker';

// Chart configuration
const chartConfig = {
    backgroundColor: '#6200ee',
    backgroundGradientFrom: '#6a11cb',
    backgroundGradientTo: '#2575fc',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
        borderRadius: 16,
    },
    propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#ffa726',
    },
};

interface ExpandableChartProps {
    title: string;
    chartData: ChartData;
    chartConfig: ChartConfig;
    onExpand: () => void;
    width: number;
}

// A reusable component for a chart card that can be expanded
const ExpandableChartCard: React.FC<ExpandableChartProps> = ({ title, chartData, chartConfig, onExpand, width }) => (


    <Card style={styles.card}>
        <Card.Title title={title} />
        <Card.Content>
            <View style={styles.chartContainer}>
                <TouchableOpacity onPress={onExpand} style={styles.expandButton}>
                    <IconButton icon="fullscreen" size={20} />
                </TouchableOpacity>

                <BarChart
                    data={chartData}
                    width={width - 48} // Adjusted for card padding
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    verticalLabelRotation={30}
                    style={styles.chartStyle}
                />
            </View>
            {/* <Button mode="outlined" onPress={onExpand} style={styles.expandButton}>
                View Full Screen
            </Button> */}
        </Card.Content>
    </Card>

);


export default function ChartsView() {
    const { draws } = useData();

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedChart, setSelectedChart] = useState<{ title: string; data: ChartData } | null>(null);

    // Use the useWindowDimensions hook for automatic updates on rotation
    const { width, height } = useWindowDimensions();

    const isLandscape = width > height;

    const openModal = (title: string, data: ChartData) => {
        setSelectedChart({ title, data });
        setModalVisible(true);
    };

    const closeModal = () => setModalVisible(false);

    const [selectedCount, setSelectedCount] = useState('all');

    // Generate dropdown options based on available data
    const dropdownOptions = useMemo(() => {
        const options = [
            { label: 'All Results', value: 'all' },
            { label: 'Latest 25', value: 25 },
            { label: 'Latest 50', value: 50 },
            { label: 'Latest 75', value: 75 },
            { label: 'Latest 100', value: 100 },
            { label: 'Latest 125', value: 125 },
            { label: 'Latest 150', value: 150 },
            { label: 'Latest 200', value: 200 },
            { label: 'Latest 250', value: 250 },
            { label: 'Latest 300', value: 300 },
            { label: 'Latest 500', value: 500 },
            { label: 'Latest 750', value: 750 },
        ];

        // Only show options that have enough data
        return options.filter(option =>
            option.value === 'all' || draws.length >= Number(option.value)
        );
    }, [draws.length]);

    const filteredDraws = useMemo(() => {
        if (selectedCount === 'all') return draws;
        return draws.slice(0, Number(selectedCount));
    }, [draws, selectedCount]);

    const totalDrawsText = selectedCount === 'all'
        ? `All ${draws.length} results`
        : `Latest ${filteredDraws.length} of ${draws.length} results. From ${filteredDraws[0].Date} to ${filteredDraws[filteredDraws.length - 1].Date}`;


    // Memoize the data calculation for the main numbers chart
    const mainNumbersChartData = useMemo(() => {
        const frequency = calculateFrequency(filteredDraws);
        const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]).slice(0, 15);
        return {
            labels: sorted.map(item => item[0]),
            datasets: [{ data: sorted.map(item => item[1]) }],
        };
    }, [filteredDraws]);

    // Memoize the data calculation for the bonus ball chart
    const bonusBallChartData = useMemo(() => {
        const frequency = calculateBonusBallFrequency(filteredDraws);
        const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
        return {
            labels: sorted.map(item => item[0]),
            datasets: [{ data: sorted.map(item => item[1]) }],
        };
    }, [filteredDraws]);


    // Advanced Statistical Calculations
    const advancedStats = useMemo(() => {

        return calculateAdvancedStats(filteredDraws);

    }, [filteredDraws]);

    // Frequency Analysis
    const frequencyData = useMemo(() => {
        const frequency = calculateFrequency(filteredDraws);
        const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);

        // Calculate expected frequency (assuming uniform distribution)
        const totalNumbers = filteredDraws.length * 6;
        const expectedFreq = totalNumbers / 59;

        // Chi-square test preparation
        const chiSquare = sorted.reduce((acc, [num, observed]) => {
            return acc + Math.pow(observed - expectedFreq, 2) / expectedFreq;
        }, 0);

        return {
            top15: {
                labels: sorted.slice(0, 15).map(item => item[0]),
                datasets: [{ data: sorted.slice(0, 15).map(item => item[1]) }],
            },
            bottom15: {
                labels: sorted.slice(-15).map(item => item[0]),
                datasets: [{ data: sorted.slice(-15).map(item => item[1]) }],
            },
            all: frequency,
            expectedFreq,
            chiSquare,
            sorted
        };
    }, [filteredDraws]);

    // Hot/Cold Numbers Analysis
    const hotColdAnalysis = useMemo(() => {
        const recentDraws = filteredDraws; // Last 30 draws
        const recentFreq: Record<number, number> = {};

        recentDraws.forEach(draw => {
            [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6].forEach(num => {
                recentFreq[num] = (recentFreq[num] || 0) + 1;
            });
        });

        const hot = Object.entries(recentFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const cold = Array.from({ length: 59 }, (_, i) => i + 1)
            .filter(num => !recentFreq[num])
            .slice(0, 10);

        return { hot, cold };
    }, [filteredDraws]);


    // Distribution Analysis
    const distributionData = useMemo(() => {
        const sums = filteredDraws.map(draw => draw.B1 + draw.B2 + draw.B3 + draw.B4 + draw.B5 + draw.B6);
        const bins = 10;
        const minSum = Math.min(...sums);
        const maxSum = Math.max(...sums);
        const binSize = (maxSum - minSum) / bins;

        const histogram = Array(bins).fill(0);
        sums.forEach(sum => {
            const binIndex = Math.min(Math.floor((sum - minSum) / binSize), bins - 1);
            histogram[binIndex]++;
        });

        return {
            labels: histogram.map((_, i) => Math.round(minSum + i * binSize).toString()),
            datasets: [{ data: histogram }],
        };
    }, [filteredDraws]);

    // Consecutive Number Analysis
    const consecutiveAnalysis = useMemo(() => {
        const consecutiveCount = filteredDraws.map(draw => {
            const numbers = [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6].sort((a, b) => a - b);
            let count = 0;
            for (let i = 0; i < numbers.length - 1; i++) {
                if (numbers[i + 1] === numbers[i] + 1) count++;
            }
            return count;
        });

        const distribution = [0, 1, 2, 3, 4, 5].map(count => ({
            count,
            frequency: consecutiveCount.filter(c => c === count).length
        }));

        return {
            labels: distribution.map(d => d.count.toString()),
            datasets: [{ data: distribution.map(d => d.frequency) }],
        };
    }, [filteredDraws]);

    // Correlation Analysis
    const correlationData = useMemo(() => {
        const positions = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];
        const correlations: Record<string, number> = {};

        positions.forEach((pos1, i) => {
            positions.forEach((pos2, j) => {
                if (i < j) {
                    const x = filteredDraws.map(draw => draw[pos1 as keyof LottoDraw] as number);
                    const y = filteredDraws.map(draw => draw[pos2 as keyof LottoDraw] as number);

                    const meanX = x.reduce((a, b) => a + b, 0) / x.length;
                    const meanY = y.reduce((a, b) => a + b, 0) / y.length;

                    const numerator = x.reduce((acc, xi, idx) => acc + (xi - meanX) * (y[idx] - meanY), 0);
                    const denomX = Math.sqrt(x.reduce((acc, xi) => acc + Math.pow(xi - meanX, 2), 0));
                    const denomY = Math.sqrt(y.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0));

                    correlations[`${pos1}-${pos2}`] = numerator / (denomX * denomY);
                }
            });
        });

        const sortedCorr = Object.entries(correlations).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 10);
        return {
            labels: sortedCorr.map(([pair]) => pair),
            datasets: [{ data: sortedCorr.map(([, corr]) => Math.abs(corr)) }],
        };
    }, [filteredDraws]);

    // Gap Analysis (time between number appearances)
    const gapAnalysis = useMemo(() => {
        const gaps: Record<number, number[]> = {};

        for (let num = 1; num <= 49; num++) {
            gaps[num] = [];
            let lastSeen = -1;

            filteredDraws.forEach((draw, index) => {
                const numbers = [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6];
                if (numbers.includes(num)) {
                    if (lastSeen !== -1) {
                        gaps[num].push(index - lastSeen);
                    }
                    lastSeen = index;
                }
            });
        }

        // Calculate average gaps for top 15 numbers
        const avgGaps = Object.entries(gaps)
            .map(([num, gapArray]) => ({
                num: parseInt(num),
                avgGap: gapArray.length > 0 ? gapArray.reduce((a, b) => a + b, 0) / gapArray.length : 0
            }))
            .filter(item => item.avgGap > 0)
            .sort((a, b) => a.avgGap - b.avgGap)
            .slice(0, 15);

        return {
            labels: avgGaps.map(item => item.num.toString()),
            datasets: [{ data: avgGaps.map(item => item.avgGap) }],
        };
    }, [filteredDraws]);

    // Moving Average Analysis
    const movingAverageData = useMemo(() => {
        const sums = filteredDraws.map(draw => draw.B1 + draw.B2 + draw.B3 + draw.B4 + draw.B5 + draw.B6);
        const windowSize = 5;
        const movingAvgs = [];

        for (let i = windowSize - 1; i < sums.length; i++) {
            const window = sums.slice(i - windowSize + 1, i + 1);
            movingAvgs.push(window.reduce((a, b) => a + b, 0) / windowSize);
        }

        const recent30 = movingAvgs.slice(-30);
        return {
            labels: recent30.map((_, index) => (index + 1).toString()),
            datasets: [{
                data: recent30,
                color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                strokeWidth: 2
            }],
        };
    }, [filteredDraws]);

    const distribution10Data = useMemo(() => {
        const ranges = {
            '0-9': 0,
            '10-19': 0,
            '20-29': 0,
            '30-39': 0,
            '40-49': 0,
            '50-59': 0
        };

        // Count occurrences for each number across all draws
        filteredDraws.forEach(draw => {
            // Count main balls (B1-B6)
            [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6].forEach(num => {
                if (num >= 0 && num <= 9) ranges['0-9']++;
                else if (num >= 10 && num <= 19) ranges['10-19']++;
                else if (num >= 20 && num <= 29) ranges['20-29']++;
                else if (num >= 30 && num <= 39) ranges['30-39']++;
                else if (num >= 40 && num <= 49) ranges['40-49']++;
                else if (num >= 50 && num <= 59) ranges['50-59']++;
            });
        });

        return {
            labels: Object.keys(ranges),
            datasets: [{
                data: Object.values(ranges)
            }],
        };
    }, [filteredDraws]);


    return (
        <>
            <ScrollView style={styles.container}>

                <Card style={styles.filterCard}>
                    <Card.Content>
                        <Text style={styles.filterLabel}>Analysis Range:</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedCount}
                                style={styles.picker}
                                onValueChange={(itemValue) => setSelectedCount(itemValue)}
                                mode="dropdown"
                            >
                                {dropdownOptions.map(option => (
                                    <Picker.Item
                                        key={option.value}
                                        label={option.label}
                                        value={option.value}
                                    />
                                ))}
                            </Picker>
                        </View>
                        <Text style={styles.totalDrawsText}>{totalDrawsText}</Text>
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Title title="📊 Advanced Statistical Analysis" />
                    <Card.Content>
                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <Text variant="titleMedium">Mean: {advancedStats.mean.toFixed(2)}</Text>
                                <Text variant="bodySmall">Average sum</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text variant="titleMedium">Std Dev: {advancedStats.stdDev.toFixed(2)}</Text>
                                <Text variant="bodySmall">Variability</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text variant="titleMedium">Skewness: {advancedStats.skewness.toFixed(3)}</Text>
                                <Text variant="bodySmall">Distribution shape</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text variant="titleMedium">Kurtosis: {advancedStats.kurtosis.toFixed(3)}</Text>
                                <Text variant="bodySmall">Tail heaviness</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text variant="titleMedium">CV: {advancedStats.cv.toFixed(1)}%</Text>
                                <Text variant="bodySmall">Relative variability</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text variant="titleMedium">IQR: {advancedStats.iqr}</Text>
                                <Text variant="bodySmall">Interquartile range</Text>
                            </View>
                        </View>

                        <Divider style={styles.divider} />

                        <Text variant="bodyMedium">
                            <Text style={styles.bold}>Chi-Square Test: </Text>
                            {frequencyData.chiSquare.toFixed(2)}
                            {frequencyData.chiSquare > 67.5 ? " (Significant deviation from uniform)" : " (Close to uniform distribution)"}
                        </Text>
                        <Text variant="bodySmall" style={styles.weightingNote}>
                            ⚖️ All analysis uses 2x weighting for the last 100 draws
                        </Text>
                    </Card.Content>
                </Card>


                {/* Hot/Cold Numbers */}
                <Card style={styles.card}>
                    <Card.Title title="🔥❄️ Hot & Cold Numbers" />
                    <Card.Content>
                        <View style={styles.hotColdContainer}>
                            <View style={styles.hotColdSection}>
                                <Text variant="titleMedium" style={styles.hotTitle}>🔥 HOT</Text>
                                <View style={styles.chipContainer}>
                                    {hotColdAnalysis.hot.map(([num, freq]) => (
                                        <Chip key={num} mode="flat" style={styles.hotChip}>
                                            {num} ({freq})
                                        </Chip>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.hotColdSection}>
                                <Text variant="titleMedium" style={styles.coldTitle}>❄️ COLD</Text>
                                <View style={styles.chipContainer}>
                                    {hotColdAnalysis.cold.map(num => (
                                        <Chip key={num} mode="flat" style={styles.coldChip}>
                                            {num}
                                        </Chip>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                <ExpandableChartCard
                    title="Top 15 Number Frequency (All Balls)"
                    chartData={mainNumbersChartData}
                    onExpand={() => openModal("Top 15 Number Frequency (All Balls)", mainNumbersChartData)}
                    chartConfig={{
                        ...chartConfig,
                        backgroundGradientFrom: '#11998e',
                        backgroundGradientTo: '#38ef7d',
                    }}
                    width={width}
                />
                <ExpandableChartCard
                    title="Bonus Ball Frequency"
                    chartData={bonusBallChartData}
                    onExpand={() => openModal("Bonus Ball Frequency", bonusBallChartData)}
                    chartConfig={{
                        ...chartConfig,
                        backgroundGradientFrom: '#fc4a1a',
                        backgroundGradientTo: '#f7b733',
                    }}
                    width={width}
                />

                <ExpandableChartCard
                    title="Range Distribution Frequency"
                    chartData={distribution10Data}
                    onExpand={() => openModal("Range Distribution Frequency", distribution10Data)}
                    chartConfig={{
                        ...chartConfig,
                        backgroundGradientFrom: '#e0c815ff',
                        backgroundGradientTo: '#337bf7ff',
                    }}
                    width={width}
                />


                <ExpandableChartCard
                    title="📈 Sum Distribution Histogram"
                    chartData={distributionData}
                    onExpand={() => openModal("📈 Sum Distribution Histogram", distributionData)}
                    chartConfig={{
                        ...chartConfig,
                        backgroundGradientFrom: '#8360c3',
                        backgroundGradientTo: '#2ebf91',
                    }}
                    width={width}
                />

                <ExpandableChartCard
                    title="📊 5-Draw Moving Average (Last 30)"
                    chartData={movingAverageData}
                    chartConfig={{
                        ...chartConfig,
                        backgroundGradientFrom: '#ff9a9e',
                        backgroundGradientTo: '#fecfef',
                    }}
                    onExpand={() => openModal("📊 5-Draw Moving Average (Last 30)", movingAverageData)}
                    width={width}
                />

                <ExpandableChartCard
                    title="🔗 Position Correlation Analysis"
                    chartData={correlationData}
                    onExpand={() => openModal("🔗 Position Correlation Analysis", correlationData)}
                    chartConfig={{
                        ...chartConfig,
                        backgroundGradientFrom: '#ea6666ff',
                        backgroundGradientTo: '#4b78a2ff',
                    }}
                    width={width}
                />


                <ExpandableChartCard
                    title="⏱️ Average Gap Analysis"
                    chartData={gapAnalysis}
                    onExpand={() => openModal("⏱️ Average Gap Analysis", gapAnalysis)}
                    chartConfig={{
                        ...chartConfig,
                        backgroundGradientFrom: '#66ea71ff',
                        backgroundGradientTo: '#a24b4bff',
                    }}
                    width={width}
                />

                <ExpandableChartCard
                    title="🔢 Consecutive Numbers Pattern"
                    chartData={consecutiveAnalysis}
                    onExpand={() => openModal("🔢 Consecutive Numbers Pattern", consecutiveAnalysis)}
                    chartConfig={{
                        ...chartConfig,
                        backgroundGradientFrom: '#66aceaff',
                        backgroundGradientTo: '#4b4fa2ff',
                    }}
                    width={width}
                />
            </ScrollView>

            <Portal>
                <Modal visible={modalVisible} onDismiss={closeModal} contentContainerStyle={styles.modalContainer}>
                    <View style={[styles.modalContent, { width: width * 0.95, height: height * 0.9 }]}>
                        <View style={styles.modalHeader}>
                            <Text variant="titleLarge" style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">{selectedChart?.title}</Text>
                            <IconButton icon="close" size={24} onPress={closeModal} style={styles.closeButton} iconColor="#fff" />
                        </View>
                        {selectedChart && (
                            <ScrollView horizontal>
                                <BarChart
                                    data={selectedChart.data}
                                    width={isLandscape ? width * 0.9 : width * 1.2}
                                    height={isLandscape ? height * 0.7 : height * 0.6}
                                    yAxisLabel=""
                                    yAxisSuffix=""
                                    chartConfig={chartConfig}
                                    style={styles.chartStyle}
                                    verticalLabelRotation={isLandscape ? 20 : 60}
                                />
                            </ScrollView>
                        )}
                    </View>
                </Modal>
            </Portal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 8,
        backgroundColor: '#f5f5f5',
    },
    card: {
        marginBottom: 16,
        elevation: 4,
    },
    chartStyle: {
        marginVertical: 8,
        borderRadius: 16,
    },
    expandButton: {
        opacity: 0.8,
        position: 'absolute',
        top: 15,
        right: 5,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        elevation: 3,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalContent: {
        backgroundColor: '#333',
        borderRadius: 20,
        padding: 10,
        alignItems: 'center',
    },
    modalHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    modalTitle: {
        color: '#fff',
        flex: 1,
    },
    closeButton: {
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statBox: {
        width: '48%',
        padding: 8,
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
    },
    divider: {
        marginVertical: 12,
    },
    bold: {
        fontWeight: 'bold',
    },
    weightingNote: {
        marginTop: 8,
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#2196F3',
    },
    chartContainer: {
        position: 'relative',
    },
    hotColdContainer: {
        flexDirection: 'column',
        gap: 16,
    },
    hotColdSection: {
        alignItems: 'center',
    },
    hotTitle: {
        color: '#ff4444',
        marginBottom: 8,
        fontWeight: 'bold',
    },
    coldTitle: {
        color: '#4444ff',
        marginBottom: 8,
        fontWeight: 'bold',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 4,
    },
    hotChip: {
        backgroundColor: '#ffebee',
        margin: 2,
    },
    coldChip: {
        backgroundColor: '#e3f2fd',
        margin: 2,
    },
    filterCard: {
        marginBottom: 16,
        backgroundColor: '#f5f5f5'
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333'
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 8
    },
    picker: {
        height: 50,
    },
    totalDrawsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic'
    },
});




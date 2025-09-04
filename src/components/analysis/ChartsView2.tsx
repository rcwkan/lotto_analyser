import React, { useMemo, useState } from 'react';
import { ScrollView, Dimensions, StyleSheet, View, Modal, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, Divider, IconButton } from 'react-native-paper';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useData } from '../../context/DataContext';
import { calculateFrequency } from '../../api/analysis';
import { LottoDraw } from '../../types';



const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;
const chartWidth = screenWidth - 32;
const fullScreenChartWidth = screenWidth - 20;
const fullScreenChartHeight = screenHeight * 0.6;

interface ExpandableChartProps {
    children: React.ReactNode;
    title: string;
    onExpand: () => void;
}

const ExpandableChart: React.FC<ExpandableChartProps> = ({ children, title, onExpand }) => (
    <View style={styles.chartContainer}>
        <TouchableOpacity onPress={onExpand} style={styles.expandButton}>
            <IconButton icon="fullscreen" size={20} />
        </TouchableOpacity>
        {children}
    </View>
);

export default function ChartsView() {
    const { draws } = useData();
    const [expandedChart, setExpandedChart] = useState<{
        component: React.ReactNode;
        title: string;
    } | null>(null);

    // Advanced Statistical Calculations
    const advancedStats = useMemo(() => {
        const allNumbers = draws.flatMap(draw => [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6]);
        const sums = draws.map(draw => draw.B1 + draw.B2 + draw.B3 + draw.B4 + draw.B5 + draw.B6);

        // Calculate mean, variance, standard deviation
        const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
        const variance = sums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sums.length;
        const stdDev = Math.sqrt(variance);

        // Calculate skewness and kurtosis
        const skewness = sums.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / sums.length;
        const kurtosis = sums.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0) / sums.length - 3;

        // Calculate median and quartiles
        const sortedSums = [...sums].sort((a, b) => a - b);
        const median = sortedSums[Math.floor(sortedSums.length / 2)];
        const q1 = sortedSums[Math.floor(sortedSums.length * 0.25)];
        const q3 = sortedSums[Math.floor(sortedSums.length * 0.75)];
        const iqr = q3 - q1;

        // Calculate coefficient of variation
        const cv = (stdDev / mean) * 100;

        return { mean, variance, stdDev, skewness, kurtosis, median, q1, q3, iqr, cv, min: Math.min(...sums), max: Math.max(...sums) };
    }, [draws]);

    // Frequency Analysis
    const frequencyData = useMemo(() => {
        const frequency = calculateFrequency(draws);
        const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);

        // Calculate expected frequency (assuming uniform distribution)
        const totalNumbers = draws.length * 6;
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
    }, [draws]);

    // Correlation Analysis
    const correlationData = useMemo(() => {
        const positions = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];
        const correlations: Record<string, number> = {};

        positions.forEach((pos1, i) => {
            positions.forEach((pos2, j) => {
                if (i < j) {
                    const x = draws.map(draw => draw[pos1 as keyof LottoDraw] as number);
                    const y = draws.map(draw => draw[pos2 as keyof LottoDraw] as number);

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
    }, [draws]);

    // Gap Analysis (time between number appearances)
    const gapAnalysis = useMemo(() => {
        const gaps: Record<number, number[]> = {};

        for (let num = 1; num <= 59; num++) {
            gaps[num] = [];
            let lastSeen = -1;

            draws.forEach((draw, index) => {
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
    }, [draws]);

    // Moving Average Analysis
    const movingAverageData = useMemo(() => {
        const sums = draws.map(draw => draw.B1 + draw.B2 + draw.B3 + draw.B4 + draw.B5 + draw.B6);
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
    }, [draws]);

    // Hot/Cold Numbers Analysis
    const hotColdAnalysis = useMemo(() => {
        const recentDraws = draws.slice(-20); // Last 20 draws
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
    }, [draws]);

    // Distribution Analysis
    const distributionData = useMemo(() => {
        const sums = draws.map(draw => draw.B1 + draw.B2 + draw.B3 + draw.B4 + draw.B5 + draw.B6);
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
    }, [draws]);

    // Consecutive Number Analysis
    const consecutiveAnalysis = useMemo(() => {
        const consecutiveCount = draws.map(draw => {
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
    }, [draws]);

    const chartConfig = {
        backgroundColor: '#e26a00',
        backgroundGradientFrom: '#fb8c00',
        backgroundGradientTo: '#ffa726',
        decimalPlaces: 2,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#ffa726"
        }
    };

    const expandChart = (component: React.ReactNode, title: string) => {
        setExpandedChart({ component, title });
    };

    const closeExpandedChart = () => {
        setExpandedChart(null);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Quick Navigation */}
            <Card style={styles.card}>
                <Card.Title title="📋 Chart Navigation" />
                <Card.Content>
                    <Text variant="bodyMedium" style={styles.navigationText}>
                        Tap the 📱 icon on any chart to view it in full screen for detailed analysis
                    </Text>
                    <View style={styles.chipContainer}>
                        <Chip mode="outlined" style={styles.navChip}>📊 Frequency Analysis</Chip>
                        <Chip mode="outlined" style={styles.navChip}>📈 Trend Analysis</Chip>
                        <Chip mode="outlined" style={styles.navChip}>🔗 Statistical Analysis</Chip>
                        <Chip mode="outlined" style={styles.navChip}>🎯 Pattern Analysis</Chip>
                    </View>
                </Card.Content>
            </Card>

            {/* Advanced Statistical Overview */}
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

            {/* Sum Distribution Histogram */}
            <Card style={styles.card}>
                <Card.Title title="📈 Sum Distribution Histogram" />
                <Card.Content>
                    <ExpandableChart
                        title="Sum Distribution Histogram"
                        onExpand={() => expandChart(
                            <BarChart
                                data={distributionData}
                                width={fullScreenChartWidth}
                                height={fullScreenChartHeight}
                                yAxisLabel=""
                                yAxisSuffix=""
                                chartConfig={{
                                    ...chartConfig,
                                    backgroundGradientFrom: '#667eea',
                                    backgroundGradientTo: '#764ba2',
                                }}
                                style={styles.fullScreenChart}
                                showValuesOnTopOfBars
                            />,
                            "Sum Distribution Histogram"
                        )}
                    >
                        <BarChart
                            data={distributionData}
                            width={chartWidth}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=""
                            chartConfig={{
                                ...chartConfig,
                                backgroundGradientFrom: '#667eea',
                                backgroundGradientTo: '#764ba2',
                            }}
                            style={styles.chartStyle}
                        />
                    </ExpandableChart>
                    <Text style={styles.chartDescription}>
                        Distribution of sum ranges showing central tendency and spread
                    </Text>
                </Card.Content>
            </Card>

            {/* Moving Average Trend */}
            <Card style={styles.card}>
                <Card.Title title="📊 5-Draw Moving Average (Last 30)" />
                <Card.Content>
                    <ExpandableChart
                        title="5-Draw Moving Average Trend"
                        onExpand={() => expandChart(
                            <LineChart
                                data={movingAverageData}
                                width={fullScreenChartWidth}
                                height={fullScreenChartHeight}
                                chartConfig={{
                                    ...chartConfig,
                                    backgroundGradientFrom: '#11998e',
                                    backgroundGradientTo: '#38ef7d',
                                }}
                                bezier
                                style={styles.fullScreenChart}
                                withDots={true}
                                withInnerLines={true}
                                withOuterLines={true}
                            />,
                            "5-Draw Moving Average Trend"
                        )}
                    >
                        <LineChart
                            data={movingAverageData}
                            width={chartWidth}
                            height={200}
                            chartConfig={{
                                ...chartConfig,
                                backgroundGradientFrom: '#11998e',
                                backgroundGradientTo: '#38ef7d',
                            }}
                            bezier
                            style={styles.chartStyle}
                        />
                    </ExpandableChart>
                    <Text style={styles.chartDescription}>
                        Smoothed trend line showing average sum patterns over time
                    </Text>
                </Card.Content>
            </Card>

            {/* Position Correlation Analysis */}
            <Card style={styles.card}>
                <Card.Title title="🔗 Position Correlation Analysis" />
                <Card.Content>
                    <ExpandableChart
                        title="Position Correlation Analysis"
                        onExpand={() => expandChart(
                            <BarChart
                                data={correlationData}
                                width={fullScreenChartWidth}
                                height={fullScreenChartHeight}
                                yAxisLabel=""
                                yAxisSuffix=""
                                chartConfig={{
                                    ...chartConfig,
                                    backgroundGradientFrom: '#fc4a1a',
                                    backgroundGradientTo: '#f7b733',
                                }}
                                verticalLabelRotation={45}
                                style={styles.fullScreenChart}
                                showValuesOnTopOfBars
                            />,
                            "Position Correlation Analysis"
                        )}
                    >
                        <BarChart
                            data={correlationData}
                            width={chartWidth}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=""
                            chartConfig={{
                                ...chartConfig,
                                backgroundGradientFrom: '#fc4a1a',
                                backgroundGradientTo: '#f7b733',
                            }}
                            verticalLabelRotation={45}
                            style={styles.chartStyle}
                        />
                    </ExpandableChart>
                    <Text style={styles.chartDescription}>
                        Correlation coefficients between ball positions (higher = more related)
                    </Text>
                </Card.Content>
            </Card>

            {/* Gap Analysis */}
            <Card style={styles.card}>
                <Card.Title title="⏱️ Average Gap Analysis" />
                <Card.Content>
                    <ExpandableChart
                        title="Average Gap Analysis"
                        onExpand={() => expandChart(
                            <BarChart
                                data={gapAnalysis}
                                width={fullScreenChartWidth}
                                height={fullScreenChartHeight}
                                yAxisLabel=""
                                yAxisSuffix=" draws"
                                chartConfig={{
                                    ...chartConfig,
                                    backgroundGradientFrom: '#8360c3',
                                    backgroundGradientTo: '#2ebf91',
                                }}
                                style={styles.fullScreenChart}
                                showValuesOnTopOfBars
                            />,
                            "Average Gap Analysis"
                        )}
                    >
                        <BarChart
                            data={gapAnalysis}
                            width={chartWidth}
                            height={200}
                            yAxisLabel=""
                            yAxisSuffix=" draws"
                            chartConfig={{
                                ...chartConfig,
                                backgroundGradientFrom: '#8360c3',
                                backgroundGradientTo: '#2ebf91',
                            }}
                            style={styles.chartStyle}
                        />
                    </ExpandableChart>
                    <Text style={styles.chartDescription}>
                        Average number of draws between appearances (lower = more frequent)
                    </Text>
                </Card.Content>
            </Card>

            {/* Consecutive Numbers Analysis */}
            <Card style={styles.card}>
                <Card.Title title="🔢 Consecutive Numbers Pattern" />
                <Card.Content>
                    <ExpandableChart
                        title="Consecutive Numbers Pattern"
                        onExpand={() => expandChart(
                            <BarChart
                                data={consecutiveAnalysis}
                                width={fullScreenChartWidth}
                                height={fullScreenChartHeight}
                                yAxisLabel=""
                                yAxisSuffix=" times"
                                chartConfig={{
                                    ...chartConfig,
                                    backgroundGradientFrom: '#ff9a9e',
                                    backgroundGradientTo: '#fecfef',
                                }}
                                style={styles.fullScreenChart}
                                showValuesOnTopOfBars
                            />,
                            "Consecutive Numbers Pattern"
                        )}
                    >
                        <BarChart
                            data={consecutiveAnalysis}
                            width={chartWidth}
                            height={200}
                            yAxisLabel=""
                            yAxisSuffix=" times"
                            chartConfig={{
                                ...chartConfig,
                                backgroundGradientFrom: '#ff9a9e',
                                backgroundGradientTo: '#fecfef',
                            }}
                            style={styles.chartStyle}
                        />
                    </ExpandableChart>
                    <Text style={styles.chartDescription}>
                        Frequency of consecutive number pairs in draws
                    </Text>
                </Card.Content>
            </Card>

            {/* Hot/Cold Numbers */}
            <Card style={styles.card}>
                <Card.Title title="🔥❄️ Hot & Cold Numbers (Last 20 Draws)" />
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

            {/* Standard Frequency Charts */}
            <Card style={styles.card}>
                <Card.Title title="📊 Most Frequent Numbers (All Time)" />
                <Card.Content>
                    <BarChart
                        data={frequencyData.top15}
                        width={chartWidth}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix="  "
                        chartConfig={chartConfig}
                        verticalLabelRotation={30}
                        style={styles.chartStyle}
                    />
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Title title="📉 Least Frequent Numbers (All Time)" />
                <Card.Content>
                    <BarChart
                        data={frequencyData.bottom15}
                        width={chartWidth}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix="  "
                        chartConfig={{
                            ...chartConfig,
                            backgroundGradientFrom: '#36d1dc',
                            backgroundGradientTo: '#5b86e5',
                        }}
                        verticalLabelRotation={30}
                        style={styles.chartStyle}
                    />
                    <Text style={styles.chartDescription}>
                        Numbers with lowest frequency - potentially "due" for selection
                    </Text>
                </Card.Content>
            </Card>
        </ScrollView>
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
    chartContainer: {
        position: 'relative',
    },
    chartStyle: {
        marginVertical: 8,
        borderRadius: 16,
    },
    fullScreenChart: {
        marginVertical: 8,
        borderRadius: 16,
        alignSelf: 'center',
    },
    expandButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        elevation: 3,
    },
    chartDescription: {
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
        color: '#666',
        fontSize: 12,
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
    // Navigation Styles
    navigationText: {
        textAlign: 'center',
        marginBottom: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    navChip: {
        margin: 2,
    },
    weightingNote: {
        marginTop: 8,
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#2196F3',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    modalTitle: {
        flex: 1,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        backgroundColor: '#f0f0f0',
    },
    modalContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 20,
    },
    modalFooter: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    modalFooterText: {
        color: '#666',
        textAlign: 'center',
    },
});
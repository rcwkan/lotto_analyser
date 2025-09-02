import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text, Divider } from 'react-native-paper';
import { useData } from '../../context/DataContext';
import { buildMarkovChain, predictWithMarkovChain } from '../../api/analysis';
import { NumberChip } from '../common/NumberChip';
import { Picker } from '@react-native-picker/picker';

export default function PredictionMarkovChainView() {
    const { draws } = useData();
    const [prediction, setPrediction] = React.useState<number[]>([]);

    // The model needs at least two draws to make a prediction
    if (draws.length < 2) {
        return (
            <View style={styles.centered}>
                <Text>Not enough data for ML prediction.</Text>
                <Text>Please upload a CSV with at least 2 draws.</Text>
            </View>
        );
    }

    // Assuming the most recent draw is the first item in the array
    const lastDraw = draws[0];
    const lastDrawNumbers = [lastDraw.B1, lastDraw.B2, lastDraw.B3, lastDraw.B4, lastDraw.B5, lastDraw.B6].sort((a, b) => a - b);

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



    const handleGenerate = () => {
        const chain = buildMarkovChain(filteredDraws);
        const newPrediction = predictWithMarkovChain(chain, lastDraw);
        setPrediction(newPrediction);
    };

    return (
        <View style={styles.container}>
            <Card>
                <Card.Title
                    title="Prediction (Markov Chain)"
                    subtitle="Predicts numbers based on historical sequences"
                />

                <Card style={styles.filterCard}>
                    <Card.Content>
                        <Text style={styles.filterLabel}>Range to use:</Text>
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
                <Card.Content>
                    <Text variant="bodyMedium" style={styles.label}>
                        Based on Last Draw ({lastDraw.Date}):
                    </Text>
                    <View style={styles.chipContainer}>
                        {lastDrawNumbers.map(num => <NumberChip key={num} number={num} />)}
                    </View>

                    <Divider style={styles.divider} />

                    <Button mode="contained" onPress={handleGenerate} style={styles.button}>
                        Generate Prediction
                    </Button>

                    {prediction.length > 0 && (
                        <View>
                            <Text variant="bodyMedium" style={styles.label}>
                                Predicted Numbers:
                            </Text>
                            <View style={styles.chipContainer}>
                                {prediction.map(num => <NumberChip key={num} number={num} />)}
                            </View>
                        </View>
                    )}

                    <Text style={styles.disclaimer}>
                        Disclaimer: This model is for entertainment purposes only and does not guarantee any winnings.
                    </Text>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'center'
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    label: {
        marginBottom: 8,
        textAlign: 'center'
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 16,
    },
    divider: {
        marginVertical: 16,
    },
    button: {
        marginBottom: 16
    },
    disclaimer: {
        marginTop: 16,
        fontStyle: 'italic',
        textAlign: 'center',
        fontSize: 12,
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
    }, totalDrawsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic'
    },
});

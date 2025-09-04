import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Card, Text, ActivityIndicator } from 'react-native-paper';


import { useData } from '../../context/DataContext';
import { NumberChip } from '../common/NumberChip';
import { tfLitePredict } from '../../api/tfLitePredictor';
import { DatePickerModal } from 'react-native-paper-dates';
import { format } from 'date-fns';



export default function PredictionTfliteView() {
    const { draws } = useData();
    const [tfReady, setTfReady] = useState(false); 
    const [prediction, setPrediction] = useState<number[]>([]);
    const [isPredicting, setIsPredicting] = useState(false);


    const [date, setDate] = React.useState(undefined);
    const [open, setOpen] = React.useState(false);
    const onDismissSingle = React.useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const onConfirmSingle = React.useCallback(
        (params: any) => {
            setOpen(false);
            setDate(params.date);
        },
        [setOpen, setDate]
    );

    useEffect(() => {
        const setup = async () => {
            try {

                setTfReady(true);

            } catch (error) {
                console.error("TF or Model setup failed:", error);
            }
        };
        setup();
    }, []);

    const handleGenerate = async () => {
        if (!tfReady || isPredicting) return;
        setIsPredicting(true);
        setPrediction([]);

        try {

            const filteredDraws = draws.slice(0, Number(10));

            const past10Results: number[][] = filteredDraws.reverse().map(draw => [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6]);
            const predictionDate: Date = date ?? new Date();;
            const output: any[] = await tfLitePredict(past10Results, predictionDate);
            setPrediction(output);

        } catch (error) {
            console.error("Error during prediction:", error);
        } finally {
            setIsPredicting(false);
        }
    };

    if (!tfReady) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Initializing TensorFlow.js...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Card>
                <Card.Title
                    title="Advanced ML (TensorFlow Lite)"
                    subtitle="Prediction using a trained TFLite model"
                />
                <Card.Content>
                    <Button onPress={() => setOpen(true)} uppercase={false} mode="outlined">
                        Select Draw Date
                    </Button>
                    <DatePickerModal
                        locale="en"
                        mode="single"
                        visible={open}
                        onDismiss={onDismissSingle}
                        date={date}
                        onConfirm={onConfirmSingle}
                    />

                    <Text variant="bodyMedium" style={styles.label}>
                        Prediction based on {format((date ?? new Date()), "yyyy-MM-dd")} conditions:
                    </Text>


                    <Button mode="contained" onPress={handleGenerate} disabled={isPredicting}>
                        {isPredicting ? 'Generating...' : 'Generate Prediction'}
                    </Button>

                    <Text style={styles.disclaimer}>
                        Disclaimer: This model is for entertainment purposes only and does not guarantee any winnings.
                    </Text>

                    {isPredicting && <ActivityIndicator style={{ marginVertical: 16 }} />}

                    {prediction.length > 0 && (
                        <View>
                            <Text variant="bodyMedium" style={[styles.label, { marginTop: 16 }]}>
                                Predicted Numbers:
                            </Text>
                            <View style={styles.chipContainer}>
                                {prediction.map(num => <NumberChip key={num} number={num} />)}
                            </View>
                        </View>
                    )}
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, justifyContent: 'center' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    label: { marginBottom: 8, textAlign: 'center', fontWeight: 'bold' },
    featureContainer: { alignItems: 'center', marginBottom: 16, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },
    featureText: { fontSize: 16, marginVertical: 2 },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },
    disclaimer: {
        marginTop: 16,
        fontStyle: 'italic',
        textAlign: 'center',
        fontSize: 12,
    },
});



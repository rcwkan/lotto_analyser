import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text, Divider } from 'react-native-paper';
import { useData } from '../../context/DataContext';
import { predictWithFeatures, featureHelpers } from '../../api/analysis';
import { NumberChip } from '../common/NumberChip';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatePickerModal } from 'react-native-paper-dates';
import { format } from 'date-fns';

const SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn'];
const MOON_PHASES = [
    'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
];

export default function PredictionFeatureView() {
    const { draws } = useData();
    const [prediction, setPrediction] = useState<number[]>([]);

    const [date, setDate] = React.useState(undefined);
    const [open, setOpen] = React.useState(false);

    const onDismissSingle = React.useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const onConfirmSingle = React.useCallback(
        (params : any) => {
            setOpen(false);
            setDate(params.date);
        },
        [setOpen, setDate]
    );

    // Get today's features for the prediction
    const nextDrawDayFeatures = useMemo(() => {
        const today =  date ?? new Date();
        return {
            season: featureHelpers.getSeason(today),
            moonPhase: featureHelpers.getMoonPhase(today),
            dayOfWeek: today.getDay(),
            dayOfYear: featureHelpers.getDayOfYear(today),
            lifePathNumber: featureHelpers.getLifePathNumber(today),
            year: featureHelpers.getYear(today)
        };
    }, []);

    const handleGenerate = () => {
        const newPrediction = predictWithFeatures(draws, nextDrawDayFeatures);
        setPrediction(newPrediction);
    };

    return (
        <View style={styles.container}>
           
            <Card>
                <Card.Title
                    title="Prediction by Features"
                    subtitle="Based on features"
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
                        Prediction based on { format((date ?? new Date()), "yyyy-MM-dd") } conditions:
                    </Text>
                    <View style={styles.featureContainer}>
                        <Text style={styles.featureText}>Season: {SEASONS[nextDrawDayFeatures.season]}</Text>
                        <Text style={styles.featureText}>Moon Phase: {MOON_PHASES[nextDrawDayFeatures.moonPhase]}</Text> 
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
                        Disclaimer: This model is for entertainment purposes and correlates historical data with environmental factors. It does not guarantee winnings.
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
        justifyContent: 'center',
    },
    label: {
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    featureContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    featureText: {
        fontSize: 16,
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
        marginBottom: 16,
    },
    disclaimer: {
        marginTop: 16,
        fontStyle: 'italic',
        textAlign: 'center',
        fontSize: 12,
    },
});

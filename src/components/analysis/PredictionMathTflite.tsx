import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useData } from '../../context/DataContext';
import { calculateFrequency, generatePrediction } from '../../api/analysis';
import { NumberChip } from '../common/NumberChip';
import { predictLottoNumbers, predictLottoNumberWithRef } from '../../api/prediction';
import { Picker } from '@react-native-picker/picker';
import { DatePickerModal } from 'react-native-paper-dates';
import { format } from 'date-fns';
import { tfLitePredict } from '../../api/tfLitePredictor';

export default function PredictionMathTflite() {
  const { draws } = useData();

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

  const frequency = useMemo(() => calculateFrequency(draws), [draws]);

  const [prediction, setPrediction] = useState<number[]>([]);

  const handleGenerate = async () => {
 
    const last10Draws = draws.slice(0, Number(10)); 
    const past10Results: number[][] = last10Draws.reverse().map(draw => [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6]);
    const predictionDate: Date = date ?? new Date();;
    const tfOutput: Number[] = await tfLitePredict(past10Results, predictionDate);
   
    const newPrediction = predictLottoNumberWithRef(tfOutput, filteredDraws).suggestedNumbers;
    setPrediction(newPrediction);
  };

  return (
    <View style={styles.container}>

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
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Prediction Generator" />
        <Card.Content>
          <Text style={styles.disclaimer}>
            Disclaimer: This is for entertainment purposes only and is based on a
            weighted random selection from historical data. It does not guarantee winning.
          </Text>
          <Button mode="contained" onPress={handleGenerate} style={styles.button}>
            Generate Numbers
          </Button>
          {prediction.length > 0 && (
            <View style={styles.chipContainer}>
              {prediction.map(num => <NumberChip key={num} number={num} />)}
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  disclaimer: { marginBottom: 16, fontStyle: 'italic', textAlign: 'center' },
  button: { marginVertical: 8 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 },
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
  label: { marginBottom: 8, textAlign: 'center', fontWeight: 'bold' },
});
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Card, DataTable, Text } from 'react-native-paper';
import { useData } from '../../context/DataContext';
import { analyzeNumberDetails, getHotAndColdDetailed, NumberDetails } from '../../api/analysis';
 

const HOT_COLD_COUNT = 10;

const NumberTable = ({ title, data }: { title: string; data: NumberDetails[] }) => (
  <Card style={styles.card}>
    <Card.Title title={title} />
    <DataTable>
      <DataTable.Header>
        <DataTable.Title style={styles.numberCol}>#</DataTable.Title>
        <DataTable.Title numeric style={styles.freqCol}>Freq.</DataTable.Title>
        <DataTable.Title style={styles.dateCol}>Last 3 Draw Dates</DataTable.Title>
      </DataTable.Header>

      {data.map(({ num, frequency, lastSeen }) => (
        // Apply the style to the row to ensure it has enough height
        <DataTable.Row key={num} style={styles.tableRow}>
          <DataTable.Cell style={styles.numberCol}>
            <Text style={styles.numberText} variant="bodyLarge">{num}</Text>
          </DataTable.Cell>
          <DataTable.Cell numeric style={styles.freqCol}>{frequency}</DataTable.Cell>
          <DataTable.Cell style={styles.dateCol}>
            {lastSeen.join(', ')}
          </DataTable.Cell>
        </DataTable.Row>
      ))}
    </DataTable>
  </Card>
);

export default function HotColdView() {
  const { draws } = useData();

  const { hot, cold } = useMemo(() => {
    if (draws.length === 0) return { hot: [], cold: [] };
    const details = analyzeNumberDetails(draws);
    return getHotAndColdDetailed(details, HOT_COLD_COUNT);
  }, [draws]);

  return (
    <ScrollView style={styles.container}>
      <NumberTable title={`Top ${HOT_COLD_COUNT} Hot Numbers`} data={hot} />
      <NumberTable title={`Top ${HOT_COLD_COUNT} Cold Numbers`} data={cold} />
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8
  },
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  // ADDED: Style for the table row to ensure proper height for multi-line text
  tableRow: {
    minHeight: 65, // Give enough vertical space for 3 lines of text
    alignItems: 'center', // Vertically center the content in the row
  },
  numberCol: {
    flex: 0.4,
  },
  freqCol: {
    flex: 0.5,
    justifyContent: 'center',
  },
  dateCol: {
    flex: 2.0,
  },
  numberText: {
    fontWeight: 'bold',
  }, bottomBanner: {
    position: "absolute",
    bottom: 0
  },
});

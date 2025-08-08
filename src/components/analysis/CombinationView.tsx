import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Card, DataTable, Text } from 'react-native-paper';
import { useData } from '../../context/DataContext';
import { analyzePairDetails } from '../../api/analysis';

const TOP_PAIRS_COUNT = 20;

export default function CombinationView() {
  const { draws } = useData();

  const topPairs = useMemo(() => {
    if (draws.length === 0) return [];
    const allPairDetails = analyzePairDetails(draws);
    return allPairDetails.slice(0, TOP_PAIRS_COUNT);
  }, [draws]);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title={`Top ${TOP_PAIRS_COUNT} Number Pairs`}
          subtitle="Most frequent pairs in main numbers"
        />
        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={styles.pairCol}>Pair</DataTable.Title>
            <DataTable.Title numeric style={styles.freqCol}>Freq.</DataTable.Title>
            <DataTable.Title style={styles.dateCol}>Last 3 Draw Dates</DataTable.Title>
          </DataTable.Header>

          {topPairs.map(({ pair, frequency, lastSeen }) => (
            // Apply the style to the row to ensure it has enough height
            <DataTable.Row key={pair} style={styles.tableRow}>
              <DataTable.Cell style={styles.pairCol}>
                <Text variant="bodyMedium" style={styles.pairText}>{pair}</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={styles.freqCol}>{frequency}</DataTable.Cell>
              <DataTable.Cell style={styles.dateCol}>
                {lastSeen.join(', ')}
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  // ADDED: Style for the table row to ensure proper height
  tableRow: {
    minHeight: 65, // Give enough vertical space for 3 lines of text
    alignItems: 'center', // Vertically center the content in the row
  },
  pairCol: {
    flex: 0.6,
  },
  freqCol: {
    flex: 0.5,
    justifyContent: 'center',
  },
  dateCol: {
    flex: 2.0,
  },
  pairText: {
    fontWeight: 'bold',
  },
});

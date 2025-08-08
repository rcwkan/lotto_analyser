import React from 'react';
import { Chip } from 'react-native-paper';
import { StyleSheet } from 'react-native';

export const NumberChip = ({ number }: { number: number | string }) => (
    <Chip style={styles.chip}>{number}</Chip>
);

const styles = StyleSheet.create({
  chip: { margin: 4, },
});
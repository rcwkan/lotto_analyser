import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { DataProvider } from './src/context/DataContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <DataProvider>
          <AppNavigator />
        </DataProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
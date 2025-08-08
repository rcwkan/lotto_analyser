import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { useData } from '../context/DataContext';
import HotColdView from '../components/analysis/HotColdView';
import CombinationView from '../components/analysis/CombinationView';
import ChartsView from '../components/analysis/ChartsView';
import PredictionView from '../components/analysis/PredictionView';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';


const Tab = createMaterialTopTabNavigator();

export default function AnalyseScreen() {
  const { draws } = useData();

  if (draws.length === 0) {
    return (
      <View style={styles.centered}>
        <Text variant="headlineSmall">No data to analyse.</Text>
        <Text>Please upload a CSV file from the 'Upload' tab.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent} >
        <Tab.Navigator screenOptions={{ tabBarScrollEnabled: true }}>
          <Tab.Screen name="Hot & Cold" component={HotColdView} />
          <Tab.Screen name="Pairs" component={CombinationView} />
          <Tab.Screen name="Charts" component={ChartsView} />
          <Tab.Screen name="Prediction" component={PredictionView} />
        </Tab.Navigator>

      </View>
      <View style={styles.bottomBanner}>
        <BannerAd
          unitId="ca-app-pub-5605412363416280/2561232420" // Use real unit ID in production
          size={BannerAdSize.FULL_BANNER}

        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  container: { flex: 1,  justifyContent: 'center' },
  mainContent: {
    flex: 1, 
    padding: 8,
    paddingBottom: 60, // leave space for bottom bar
  },
  bottomBanner: {
    position: "absolute",
    bottom: 0
  },

});
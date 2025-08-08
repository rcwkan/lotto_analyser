import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UploadScreen from '../screens/UploadScreen';
import AnalyseScreen from '../screens/AnalyseScreen';

const Tab = createMaterialTopTabNavigator();

export default function AppNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      <Tab.Navigator
        style={{ paddingTop: insets.top }}
        screenOptions={{
          tabBarIndicatorStyle: { backgroundColor: '#6200ee' },
          tabBarLabelStyle: { fontWeight: 'bold' },
        }}
      >
        <Tab.Screen name="Upload" component={UploadScreen} />
        <Tab.Screen name="Analyse" component={AnalyseScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
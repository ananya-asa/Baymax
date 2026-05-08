import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import ResultScreen from './screens/ResultScreen';
import HistoryScreen from './screens/HistoryScreen';
import { initDB } from './database/db';

export type Vitals = {
  heartRate: string;
  spo2: string;
  temperature: string;
  bloodPressure: string;
};

export type AnalysisItem = {
  label: string;
  value: string;
  status: 'normal' | 'low' | 'high';
  message: string;
};

export type RootStackParamList = {
  Home: undefined;
  Result: {
    vitals: Vitals;
  };
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    initDB().catch(() => {
      // ignore init errors; app can still render
    });
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShadowVisible: false,
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: '#F8F8F8',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Baymax Health Console' }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: 'Assessment Report' }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'Scan History' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
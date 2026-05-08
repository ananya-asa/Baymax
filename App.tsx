import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from './screens/DashboardScreen'; // ← Added
import HomeScreen from './screens/HomeScreen';
import ResultScreen from './screens/ResultScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatScreen from './screens/ChatScreen';
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
  Dashboard: undefined; // ← Added
  Home: undefined;
  Result: {
    vitals: Vitals;
  };
  History: undefined;
  Profile: undefined;
  Chat: undefined;
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
        initialRouteName="Dashboard" // ← App now opens on Dashboard
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#F8F8F8',
          },
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
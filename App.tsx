import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ComponentType } from 'react';
import HomeScreen from './screens/HomeScreen';
import ResultScreen from './screens/ResultScreen';

export type RootStackParamList = {
  Home: undefined;
  Result: {
    vitals: {
      heartRate: string;
      spo2: string;
      temperature: string;
      bloodPressure: string;
    };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen as unknown as ComponentType<any>}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen as unknown as ComponentType<any>}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
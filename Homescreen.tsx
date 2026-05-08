import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './App';
import { styles } from './styles/HomeScreen.styles';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();

  const [heartRate, setHeartRate] = useState('');
  const [spo2, setSpo2] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!heartRate || !spo2 || !temperature) {
      alert('Please fill in at least Heart Rate, SpO2, and Temperature!');
      return;
    }

    setLoading(true);

    // Simulate sensor data processing delay
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Result', {
        vitals: {
          heartRate: heartRate,
          spo2: spo2,
          temperature: temperature,
          bloodPressure: bloodPressure || 'N/A',
        },
      });
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.baymaxFace}>
          <View style={styles.eyes}>
            <View style={styles.eye} />
            <View style={styles.eye} />
          </View>
        </View>
        <Text style={styles.title}>BAYMAX</Text>
        <Text style={styles.subtitle}>Personal Healthcare Companion</Text>
      </View>

      {/* Greeting */}
      <View style={styles.greetingCard}>
        <Text style={styles.greetingText}>
          Hello. I will conduct a health assessment.{'\n'}
          Please enter your vitals below.
        </Text>
      </View>

      {/* Sensor Inputs */}
      <Text style={styles.sectionTitle}>📡 Sensor Readings</Text>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>❤️ Heart Rate (bpm)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 75"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
          value={heartRate}
          onChangeText={setHeartRate}
        />
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>🫁 SpO2 (%)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 98"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
          value={spo2}
          onChangeText={setSpo2}
        />
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>🌡️ Temperature (°C)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 36.6"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
          value={temperature}
          onChangeText={setTemperature}
        />
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>🩸 Blood Pressure (mmHg) <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 120/80"
          placeholderTextColor="#bbb"
          value={bloodPressure}
          onChangeText={setBloodPressure}
        />
      </View>

      {/* Analyze Button */}
      <TouchableOpacity
        style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
        onPress={handleAnalyze}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.analyzeButtonText}>🔍 ANALYZE</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Connecting to Baymax sensors...
      </Text>
    </ScrollView>
  );
}
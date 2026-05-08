import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { styles } from './styles/ResultScreen.styles';

// Helper to evaluate vitals status
const evaluateVitals = (vitals: any) => {
  const results = [];

  const hr = parseInt(vitals.heartRate);
  if (hr < 60) results.push({ label: 'Heart Rate', value: `${hr} bpm`, status: 'low', icon: '❤️', message: 'Below normal. Possible bradycardia.' });
  else if (hr > 100) results.push({ label: 'Heart Rate', value: `${hr} bpm`, status: 'high', icon: '❤️', message: 'Elevated. You may be stressed or dehydrated.' });
  else results.push({ label: 'Heart Rate', value: `${hr} bpm`, status: 'normal', icon: '❤️', message: 'Normal range. Good.' });

  const spo2 = parseInt(vitals.spo2);
  if (spo2 < 94) results.push({ label: 'SpO2', value: `${spo2}%`, status: 'high', icon: '🫁', message: 'Low oxygen. Seek medical attention.' });
  else if (spo2 < 97) results.push({ label: 'SpO2', value: `${spo2}%`, status: 'low', icon: '🫁', message: 'Slightly below optimal.' });
  else results.push({ label: 'SpO2', value: `${spo2}%`, status: 'normal', icon: '🫁', message: 'Oxygen levels are healthy.' });

  const temp = parseFloat(vitals.temperature);
  if (temp < 36.1) results.push({ label: 'Temperature', value: `${temp}°C`, status: 'low', icon: '🌡️', message: 'Hypothermia risk. Stay warm.' });
  else if (temp > 37.5) results.push({ label: 'Temperature', value: `${temp}°C`, status: 'high', icon: '🌡️', message: 'Fever detected. Rest and hydrate.' });
  else results.push({ label: 'Temperature', value: `${temp}°C`, status: 'normal', icon: '🌡️', message: 'Temperature is normal.' });

  if (vitals.bloodPressure !== 'N/A') {
    results.push({ label: 'Blood Pressure', value: vitals.bloodPressure, status: 'normal', icon: '🩸', message: 'Recorded. Consult a doctor for interpretation.' });
  }

  return results;
};

const getOverallStatus = (results: any[]) => {
  if (results.some(r => r.status === 'high')) return { label: 'Needs Attention', color: '#FF4444', emoji: '⚠️' };
  if (results.some(r => r.status === 'low')) return { label: 'Monitor Closely', color: '#FFA500', emoji: '👀' };
  return { label: 'All Good!', color: '#00C853', emoji: '✅' };
};

export default function ResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vitals } = route.params as any;

  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [overall, setOverall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // Simulate analysis
    setTimeout(() => {
      const results = evaluateVitals(vitals);
      const overallStatus = getOverallStatus(results);
      setAnalysisResults(results);
      setOverall(overallStatus);
      setLoading(false);
      fetchAISummary(vitals, results);
    }, 1000);
  }, []);

  const fetchAISummary = async (vitals: any, results: any[]) => {
    setAiLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          system: `You are Baymax, a friendly healthcare robot. 
            Speak exactly like Baymax from Big Hero 6 — calm, caring, slightly robotic, warm. 
            Give a short 3-4 sentence health summary based on the vitals. 
            Always end with one simple recommendation.`,
          messages: [{
            role: 'user',
            content: `Patient vitals:
              Heart Rate: ${vitals.heartRate} bpm
              SpO2: ${vitals.spo2}%
              Temperature: ${vitals.temperature}°C
              Blood Pressure: ${vitals.bloodPressure}
              
              Please give your assessment.`
          }]
        })
      });
      const data = await response.json();
      setAiSummary(data.content[0].text);
    } catch (err) {
      setAiSummary('I have completed my scan. Please consult a healthcare professional for a full assessment.');
    } finally {
      setAiLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'high') return '#FF4444';
    if (status === 'low') return '#FFA500';
    return '#00C853';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4444" />
        <Text style={styles.loadingText}>Analyzing your vitals...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Health Report</Text>
        <View style={[styles.overallBadge, { backgroundColor: overall?.color }]}>
          <Text style={styles.overallText}>{overall?.emoji} {overall?.label}</Text>
        </View>
      </View>

      {/* Baymax AI Summary */}
      <View style={styles.aiCard}>
        <View style={styles.baymaxMini}>
          <View style={styles.miniEyes}>
            <View style={styles.miniEye} />
            <View style={styles.miniEye} />
          </View>
        </View>
        {aiLoading ? (
          <ActivityIndicator color="#FF4444" />
        ) : (
          <Text style={styles.aiText}>"{aiSummary}"</Text>
        )}
      </View>

      {/* Individual Vitals */}
      <Text style={styles.sectionTitle}>📊 Detailed Results</Text>
      {analysisResults.map((result, index) => (
        <View key={index} style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultIcon}>{result.icon}</Text>
            <Text style={styles.resultLabel}>{result.label}</Text>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(result.status) }]} />
          </View>
          <Text style={[styles.resultValue, { color: getStatusColor(result.status) }]}>
            {result.value}
          </Text>
          <Text style={styles.resultMessage}>{result.message}</Text>
        </View>
      ))}

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← New Scan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
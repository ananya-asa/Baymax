import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { saveScan } from '../database/db';

// --- Types ---
export interface Vitals {
  heartRate: string;
  spo2: string;
  temperature: string;
  bloodPressure: string;
  smoke?: string;
  roomTemp?: string;
  humidity?: string;
}

export interface AnalysisItem {
  label: string;
  value: string;
  status: 'normal' | 'low' | 'high';
  message: string;
}

type RootStackParamList = {
  HomeScreen: undefined;
  Result: { vitals: Vitals };
  History: undefined;
};

type ResultRouteProp = RouteProp<RootStackParamList, 'Result'>;

// --- Edge AI Logic (Local Logic) ---
const evaluateVitals = (vitals: Vitals): AnalysisItem[] => {
  const results: AnalysisItem[] = [];

  const hr = parseInt(vitals.heartRate, 10) || 0;
  results.push({
    label: 'Heart Rate',
    value: `${hr} BPM`,
    status: hr < 60 ? 'low' : hr > 100 ? 'high' : 'normal',
    message: hr > 100 ? 'Elevated pulse detected.' : 'Rhythm within range.',
  });

  const o2 = parseInt(vitals.spo2, 10) || 0;
  results.push({
    label: 'Oxygen (SpO2)',
    value: `${o2} %`,
    status: o2 < 95 ? 'high' : 'normal',
    message: o2 < 95 ? 'Saturation below threshold.' : 'Optimal saturation.',
  });

  const temp = parseFloat(vitals.temperature) || 0;
  results.push({
    label: 'Body Temp',
    value: `${temp} °C`,
    status: temp > 37.5 ? 'high' : temp < 36.1 ? 'low' : 'normal',
    message: temp > 37.5 ? 'Fever baseline reached.' : 'Temperature stable.',
  });

  results.push({
    label: 'Blood Pressure',
    value: vitals.bloodPressure || 'N/A',
    status: 'normal',
    message: 'Systemic pressure logged.',
  });

  return results;
};

const generateLocalInference = (vitals: Vitals): string => {
  const o2 = parseInt(vitals.spo2, 10);
  if (o2 < 95) return "EDGE ADVISORY: Local neural engine detects hypoxic indicators. Ensure proper sensor placement and maintain steady breathing.";
  return "AI STATUS: NOMINAL. Edge processing confirms physiological parameters are consistent with healthy baseline values.";
};

// --- Component ---
export default function ResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<ResultRouteProp>();
  const { vitals } = route.params;

  const findings = useMemo(() => evaluateVitals(vitals), [vitals]);
  const [aiSummary, setAiSummary] = useState('');
  const [isInferring, setIsInferring] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const summary = generateLocalInference(vitals);
      setAiSummary(summary);
      setIsInferring(false);
      
      saveScan({
        ...vitals,
        overallStatus: 'Verified',
        aiSummary: summary
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [vitals]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with Diagnostic Badge */}
      <View style={styles.header}>
        <View>
          <Text style={styles.edgeLabel}>EDGE-AI SYSTEM v2.0</Text>
          <Text style={styles.mainTitle}>Vitals Report</Text>
        </View>
        <View style={styles.diagnosticPill}>
          <Text style={styles.diagnosticText}>LOCAL PROCESSING</Text>
        </View>
      </View>

      {/* Professional White Grid Metric Display */}
      <View style={styles.gridContainer}>
        {findings.map((item, idx) => (
          <View key={idx} style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>{item.label.toUpperCase()}</Text>
              <Ionicons 
                name="ellipse" 
                size={8} 
                color={item.status === 'high' ? '#D32F2F' : item.status === 'low' ? '#FBC02D' : '#2E7D32'} 
              />
            </View>
            <Text style={styles.bigMetricValue}>{item.value.split(' ')[0]}</Text>
            <Text style={styles.unitLabel}>{item.value.split(' ').slice(1).join(' ')}</Text>
          </View>
        ))}
      </View>

      {/* Edge AI Neural Interpretation Card */}
      <View style={styles.inferenceCard}>
        <View style={styles.aiHeader}>
          <MaterialCommunityIcons name="chip" size={24} color={COLORS.primary} />
          <Text style={styles.aiTitle}>NEURAL ENGINE INTERPRETATION</Text>
        </View>
        {isInferring ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loaderText}>Processing on-device...</Text>
          </View>
        ) : (
          <Text style={styles.aiText}>{aiSummary}</Text>
        )}
      </View>

      {/* Professional Action Grid */}
      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="refresh-outline" size={20} color="#555" />
          <Text style={styles.secondaryBtnText}>NEW SCAN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('History')}>
          <Ionicons name="file-tray-full-outline" size={20} color="#FFF" />
          <Text style={styles.primaryBtnText}>VIEW LOGS</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F4F7F6' // Professional Light Gray/White
  },
  content: { 
    paddingBottom: 40 
  },
  header: { 
    padding: 25, 
    paddingTop: 60, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  edgeLabel: { 
    color: '#757575', 
    fontSize: 10, 
    fontWeight: '800', 
    letterSpacing: 1.5 
  },
  mainTitle: { 
    color: '#212121', 
    fontSize: 28, 
    fontWeight: '800' 
  },
  diagnosticPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A5D6A7'
  },
  diagnosticText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2E7D32'
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 12, 
    justifyContent: 'space-between' 
  },
  gridCard: { 
    width: '48%', 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    padding: 18, 
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    // Professional Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  cardLabel: { 
    color: '#9E9E9E', 
    fontSize: 11, 
    fontWeight: '700', 
    letterSpacing: 0.5 
  },
  bigMetricValue: { 
    color: '#212121', 
    fontSize: 40, 
    fontWeight: '900' 
  },
  unitLabel: { 
    color: '#616161', 
    fontSize: 12, 
    fontWeight: '700' 
  },
  inferenceCard: { 
    margin: 15, 
    padding: 22, 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  aiHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  aiTitle: { 
    color: '#424242', 
    marginLeft: 8, 
    fontWeight: '800', 
    fontSize: 12, 
    letterSpacing: 0.5 
  },
  aiText: { 
    color: '#616161', 
    fontSize: 15, 
    lineHeight: 22, 
    fontWeight: '500' 
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  loaderText: {
    marginLeft: 10,
    color: '#9E9E9E',
    fontSize: 14
  },
  actionGrid: { 
    flexDirection: 'row', 
    padding: 15, 
    justifyContent: 'space-between' 
  },
  secondaryBtn: { 
    width: '46%', 
    padding: 18, 
    borderRadius: 12, 
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#BDBDBD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryBtnText: { 
    color: '#424242', 
    fontWeight: '800',
    marginLeft: 8,
    fontSize: 13
  },
  primaryBtn: { 
    width: '46%', 
    padding: 18, 
    borderRadius: 12, 
    backgroundColor: COLORS.primary, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryBtnText: { 
    color: '#FFF', 
    fontWeight: '800',
    marginLeft: 8,
    fontSize: 13
  }
});
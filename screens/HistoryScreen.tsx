import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
// Added useNavigation to the imports
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllScans } from '../database/db';
import { COLORS } from '../theme/colors';

const MEDICAL_RED = '#D32F2F';

type ScanItem = {
  id: number;
  heartRate: string;
  spo2: string;
  temperature: string;
  bloodPressure: string;
  overallStatus: string;
  aiSummary: string;
  createdAt: string;
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanItem[]>([]);
  const navigation = useNavigation(); // Initialize navigation

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const run = async () => {
        const rows = (await getAllScans()) as ScanItem[];
        if (active) setHistory(rows);
      };
      run();
      return () => { active = false; };
    }, [])
  );

  return (
    <View style={{ flex: 1 }}>
      {/* NEW: TOP RIGHT BACK BUTTON */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={MEDICAL_RED} />
      </TouchableOpacity>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* PROFESSIONAL HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>SECURE DATA NODE</Text>
            <Text style={styles.headerTitle}>Patient History</Text>
          </View>
          <MaterialCommunityIcons name="database-check" size={30} color={MEDICAL_RED} />
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={48} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>Log Archive Empty</Text>
            <Text style={styles.emptyText}>
              System is ready. No locally cached diagnostic reports were found on this node.
            </Text>
          </View>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              {/* TOP BAR: Status & Timestamp */}
              <View style={styles.cardHeader}>
                <View style={styles.statusGroup}>
                  <View style={styles.redDot} />
                  <Text style={styles.statusTitle}>REPORT #{item.id}</Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(item.createdAt).toLocaleDateString()} | {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>

              {/* DATA GRID */}
              <View style={styles.vitalsGrid}>
                <View style={styles.vitalBox}>
                  <Text style={styles.vitalLabel}>HR</Text>
                  <Text style={styles.vitalValue}>{item.heartRate}<Text style={styles.vitalUnit}>BPM</Text></Text>
                </View>
                <View style={styles.vitalBox}>
                  <Text style={styles.vitalLabel}>SpO2</Text>
                  <Text style={styles.vitalValue}>{item.spo2}<Text style={styles.vitalUnit}>%</Text></Text>
                </View>
                <View style={styles.vitalBox}>
                  <Text style={styles.vitalLabel}>TEMP</Text>
                  <Text style={styles.vitalValue}>{item.temperature}<Text style={styles.vitalUnit}>°C</Text></Text>
                </View>
                <View style={[styles.vitalBox, { borderRightWidth: 0 }]}>
                  <Text style={styles.vitalLabel}>BP</Text>
                  <Text style={styles.vitalValue}>{item.bloodPressure}</Text>
                </View>
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>EDGE-AI INTERPRETATION</Text>
                <Text style={styles.summaryText} numberOfLines={3}>
                  {item.aiSummary}
                </Text>
              </View>

              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>ENCRYPTED LOG DETAILS</Text>
                <Ionicons name="chevron-forward" size={16} color={MEDICAL_RED} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Added backButton styles
  backButton: {
    position: 'absolute',
    top: 50, // Adjust based on your status bar height
    right: 20,
    zIndex: 10,
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    // Shadow to match cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingTop: 60, // Added more top padding so the back button doesn't overlap header title
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: MEDICAL_RED,
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#212121',
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 20,
  },
  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '800',
    color: '#424242',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 12,
    marginBottom: 12,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MEDICAL_RED,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#212121',
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  vitalsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  vitalBox: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
  },
  vitalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9E9E9E',
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#212121',
  },
  vitalUnit: {
    fontSize: 10,
    color: '#757575',
    marginLeft: 2,
  },
  summaryBox: {
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: MEDICAL_RED,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 18,
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  viewButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: MEDICAL_RED,
    marginRight: 4,
    letterSpacing: 1,
  },
});
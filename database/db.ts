import { Platform } from 'react-native';

// Only import expo-sqlite if we are NOT on the web
const SQLite = Platform.OS !== 'web' ? require('expo-sqlite') : null;

const isWeb = Platform.OS === 'web';

// Simple Web Fallback
const webStorage = {
  get: () => JSON.parse(localStorage.getItem('baymax_history') || '[]'),
  set: (data: any) => localStorage.setItem('baymax_history', JSON.stringify(data)),
};

export const initDB = async () => {
  if (isWeb) return console.log("Running in Web Mode: LocalStorage active.");

  // Mobile-only logic
  const db = await SQLite.openDatabaseAsync('baymax.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      heartRate TEXT, spo2 TEXT, temperature TEXT, bloodPressure TEXT,
      overallStatus TEXT, aiSummary TEXT, createdAt TEXT
    );
  `);
};

export const saveScan = async (scan: any) => {
  const timestamp = new Date().toISOString();
  if (isWeb) {
    const history = webStorage.get();
    webStorage.set([{ ...scan, id: Date.now(), createdAt: timestamp }, ...history]);
    return;
  }

  const db = await SQLite.openDatabaseAsync('baymax.db');
  await db.runAsync(
    `INSERT INTO scan_history (heartRate, spo2, temperature, bloodPressure, overallStatus, aiSummary, createdAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [scan.heartRate, scan.spo2, scan.temperature, scan.bloodPressure, scan.overallStatus, scan.aiSummary, timestamp]
  );
};

export const getAllScans = async () => {
  if (isWeb) return webStorage.get();
  
  const db = await SQLite.openDatabaseAsync('baymax.db');
  return await db.getAllAsync(`SELECT * FROM scan_history ORDER BY createdAt DESC`);
};
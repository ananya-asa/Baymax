// import React, { useEffect, useMemo, useState } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
// } from 'react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import type { RouteProp } from '@react-navigation/native';
// import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// import { COLORS } from '../theme/colors';
// import { saveScan } from '../database/db';

// // --- Types ---
// export interface Vitals {
//   heartRate: string;
//   spo2: string;
//   temperature: string;
//   bloodPressure: string;
//   smoke?: string;
//   roomTemp?: string;
//   humidity?: string;
// }

// export interface AnalysisItem {
//   label: string;
//   value: string;
//   status: 'normal' | 'low' | 'high';
//   message: string;
// }

// type RootStackParamList = {
//   HomeScreen: undefined;
//   Result: { vitals: Vitals };
//   History: undefined;
// };

// type ResultRouteProp = RouteProp<RootStackParamList, 'Result'>;

// // --- API Configuration ---
// const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
// const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// // --- Logic ---
// const evaluateVitals = (vitals: Vitals): AnalysisItem[] => {
//   const results: AnalysisItem[] = [];

//   const hr = parseInt(vitals.heartRate, 10) || 0;
//   results.push({
//     label: 'Heart Rate',
//     value: `${hr} BPM`,
//     status: hr < 60 ? 'low' : hr > 100 ? 'high' : 'normal',
//     message: hr > 100 ? 'Elevated pulse.' : hr < 60 ? 'Low heart rate.' : 'Stable rhythm.',
//   });

//   const o2 = parseInt(vitals.spo2, 10) || 0;
//   results.push({
//     label: 'Oxygen (SpO2)',
//     value: `${o2} %`,
//     status: o2 < 95 ? 'high' : 'normal',
//     message: o2 < 92 ? 'Critically low — seek care.' : o2 < 95 ? 'Low saturation.' : 'Optimal levels.',
//   });

//   const temp = parseFloat(vitals.temperature) || 0;
//   results.push({
//     label: 'Body Temp',
//     value: `${temp} °C`,
//     status: temp > 37.5 ? 'high' : temp < 36.1 ? 'low' : 'normal',
//     message: temp > 38.5 ? 'High fever.' : temp > 37.5 ? 'Fever detected.' : temp < 36.1 ? 'Below normal.' : 'Stable temp.',
//   });

//   results.push({
//     label: 'Blood Pressure',
//     value: vitals.bloodPressure || 'N/A',
//     status: 'normal',
//     message: 'Pressure logged.',
//   });

//   return results;
// };

// // --- Component ---
// export default function ResultScreen() {
//   const navigation = useNavigation<any>();
//   const route = useRoute<ResultRouteProp>();
//   const { vitals } = route.params;

//   const findings = useMemo(() => evaluateVitals(vitals), [vitals]);
//   const [aiSummary, setAiSummary] = useState('');
//   const [isInferring, setIsInferring] = useState(true);

//   useEffect(() => {
//     const fetchGeminiAnalysis = async () => {
//       setIsInferring(true);

//       if (!GEMINI_API_KEY) {
//         setAiSummary('API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
//         setIsInferring(false);
//         return;
//       }

//       // Baymax-style prompt — longer, warm, spoken-word friendly
//       const prompt = `
//         You are Baymax, a friendly and caring personal healthcare companion — warm, gentle, and thorough.
//         Speak directly to the patient in first person ("I noticed...", "Your..."), like you are talking to them out loud.

//         Analyze these patient vitals:
//         Heart Rate: ${vitals.heartRate} BPM
//         SpO2: ${vitals.spo2}%
//         Temperature: ${vitals.temperature}°C
//         Blood Pressure: ${vitals.bloodPressure}

//         Give a detailed spoken health summary in 5–7 sentences covering:
//         1. Overall health impression
//         2. Each vital — what it means and whether it is normal
//         3. Any concerns or reassurances
//         4. One practical tip or next step

//         If SpO2 is below 92%, urgently and kindly recommend immediate medical attention.
//         Use simple, human language — no bullet points, no headers, just flowing natural speech as if you are speaking aloud.
//         End with a warm, Baymax-style closing line like "I will always be with you" or "On a scale of 1 to 10, how is your pain?"
//       `;

//       try {
//         const response = await fetch(GEMINI_ENDPOINT, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             contents: [{ parts: [{ text: prompt }] }],
//             generationConfig: {
//               // Allow a longer response for Baymax voice
//               maxOutputTokens: 400,
//               temperature: 0.7,
//               thinkingConfig: {
//                 thinkingBudget: 0,   // ← this was the key fix
//               },
//             },
//           }),
//         });

//         const data = await response.json();

//         if (__DEV__) {
//           console.log('[Gemini] Status:', response.status);
//           console.log('[Gemini] Response:', JSON.stringify(data, null, 2));
//         }

//         const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

//         if (text) {
//           setAiSummary(text.trim());

//           await saveScan({
//             ...vitals,
//             overallStatus: 'Verified',
//             aiSummary: text.trim(),
//           });
//         } else {
//           const errorMsg = data?.error?.message ?? 'Invalid API response structure.';
//           console.error('[Gemini] API Error:', errorMsg);
//           setAiSummary(`Analysis unavailable: ${errorMsg}`);
//         }
//       } catch (error) {
//         console.error('[Gemini] Fetch Error:', error);
//         setAiSummary('Analysis currently unavailable. Please check connectivity and try again.');
//       } finally {
//         setIsInferring(false);
//       }
//     };

//     fetchGeminiAnalysis();
//   }, [vitals]);

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.content}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.edgeLabel}>GEMINI NEURAL ENGINE</Text>
//           <Text style={styles.mainTitle}>Vitals Analysis</Text>
//         </View>
//         <View style={styles.diagnosticPill}>
//           <Text style={styles.diagnosticText}>CLOUD ENHANCED</Text>
//         </View>
//       </View>

//       {/* Metric Grid */}
//       <View style={styles.gridContainer}>
//         {findings.map((item, idx) => (
//           <View key={idx} style={styles.gridCard}>
//             <View style={styles.cardHeader}>
//               <Text style={styles.cardLabel}>{item.label.toUpperCase()}</Text>
//               <Ionicons
//                 name="ellipse"
//                 size={8}
//                 color={
//                   item.status === 'high'
//                     ? '#D32F2F'
//                     : item.status === 'low'
//                     ? '#FBC02D'
//                     : '#2E7D32'
//                 }
//               />
//             </View>
//             <Text style={styles.bigMetricValue}>{item.value.split(' ')[0]}</Text>
//             <Text style={styles.unitLabel}>{item.value.split(' ').slice(1).join(' ')}</Text>
//           </View>
//         ))}
//       </View>

//       {/* AI Interpretation Card */}
//       <View style={styles.inferenceCard}>
//         <View style={styles.aiHeader}>
//           <MaterialCommunityIcons name="brain" size={24} color={COLORS.primary} />
//           <Text style={styles.aiTitle}>BAYMAX HEALTH REPORT</Text>
//         </View>
//         {isInferring ? (
//           <View style={styles.loaderContainer}>
//             <ActivityIndicator color={COLORS.primary} />
//             <Text style={styles.loaderText}>Analyzing biometric data...</Text>
//           </View>
//         ) : (
//           <Text style={styles.aiText}>{aiSummary}</Text>
//         )}
//       </View>

//       {/* Actions */}
//       <View style={styles.actionGrid}>
//         <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
//           <Ionicons name="refresh-outline" size={20} color="#555" />
//           <Text style={styles.secondaryBtnText}>NEW SCAN</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.primaryBtn}
//           onPress={() => navigation.navigate('History')}
//         >
//           <Ionicons name="file-tray-full-outline" size={20} color="#FFF" />
//           <Text style={styles.primaryBtnText}>VIEW LOGS</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F8F9FA' },
//   content: { paddingBottom: 40 },
//   header: {
//     padding: 25,
//     paddingTop: 60,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: '#FFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEE',
//   },
//   edgeLabel: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
//   mainTitle: { color: '#1A1A1A', fontSize: 28, fontWeight: '900' },
//   diagnosticPill: {
//     backgroundColor: '#E3F2FD',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: '#90CAF9',
//   },
//   diagnosticText: { fontSize: 9, fontWeight: '900', color: '#1565C0' },
//   gridContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     padding: 12,
//     justifyContent: 'space-between',
//   },
//   gridCard: {
//     width: '48%',
//     backgroundColor: '#FFF',
//     borderRadius: 12,
//     padding: 18,
//     marginBottom: 14,
//     borderWidth: 1,
//     borderColor: '#F0F0F0',
//     elevation: 2,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   cardLabel: { color: '#AAA', fontSize: 11, fontWeight: '700' },
//   bigMetricValue: { color: '#212121', fontSize: 40, fontWeight: '900' },
//   unitLabel: { color: '#777', fontSize: 12, fontWeight: '700' },
//   inferenceCard: {
//     margin: 15,
//     padding: 22,
//     backgroundColor: '#FFF',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#E3F2FD',
//     borderLeftWidth: 5,
//     borderLeftColor: COLORS.primary,
//     flexShrink: 0,
//     overflow: 'visible',
//   },
//   aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
//   aiTitle: { color: COLORS.primary, marginLeft: 8, fontWeight: '900', fontSize: 12 },
//   aiText: { color: '#444', fontSize: 15, lineHeight: 26, fontWeight: '500', flexShrink: 1, flexWrap: 'wrap' },
//   loaderContainer: { flexDirection: 'row', alignItems: 'center' },
//   loaderText: { marginLeft: 10, color: '#999', fontSize: 14, fontStyle: 'italic' },
//   actionGrid: { flexDirection: 'row', padding: 15, justifyContent: 'space-between' },
//   secondaryBtn: {
//     width: '46%',
//     padding: 16,
//     borderRadius: 12,
//     backgroundColor: '#FFF',
//     borderWidth: 1,
//     borderColor: '#DDD',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   secondaryBtnText: { color: '#555', fontWeight: '800', marginLeft: 8 },
//   primaryBtn: {
//     width: '46%',
//     padding: 16,
//     borderRadius: 12,
//     backgroundColor: COLORS.primary,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   primaryBtnText: { color: '#FFF', fontWeight: '800', marginLeft: 8 },
// });

import React, { useEffect, useMemo, useState, useRef } from 'react';
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
import { Audio } from 'expo-av';
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

// --- API Configuration ---
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const RESEMBLE_API_KEY = process.env.EXPO_PUBLIC_RESEMBLE_API_KEY ?? 'xxoTVdagePJ3EhV74rDKPAtt';
const RESEMBLE_VOICE_UUID = '2b3c5525';
const RESEMBLE_ENDPOINT = 'https://f.cluster.resemble.ai/synthesize';

// --- Logic ---
const evaluateVitals = (vitals: Vitals): AnalysisItem[] => {
  const results: AnalysisItem[] = [];

  const hr = parseInt(vitals.heartRate, 10) || 0;
  results.push({
    label: 'Heart Rate',
    value: `${hr} BPM`,
    status: hr < 60 ? 'low' : hr > 100 ? 'high' : 'normal',
    message: hr > 100 ? 'Elevated pulse.' : hr < 60 ? 'Low heart rate.' : 'Stable rhythm.',
  });

  const o2 = parseInt(vitals.spo2, 10) || 0;
  results.push({
    label: 'Oxygen (SpO2)',
    value: `${o2} %`,
    status: o2 < 95 ? 'high' : 'normal',
    message: o2 < 92 ? 'Critically low — seek care.' : o2 < 95 ? 'Low saturation.' : 'Optimal levels.',
  });

  const temp = parseFloat(vitals.temperature) || 0;
  results.push({
    label: 'Body Temp',
    value: `${temp} °C`,
    status: temp > 37.5 ? 'high' : temp < 36.1 ? 'low' : 'normal',
    message: temp > 38.5 ? 'High fever.' : temp > 37.5 ? 'Fever detected.' : temp < 36.1 ? 'Below normal.' : 'Stable temp.',
  });

  results.push({
    label: 'Blood Pressure',
    value: vitals.bloodPressure || 'N/A',
    status: 'normal',
    message: 'Pressure logged.',
  });

  return results;
};

// --- Component ---
export default function ResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<ResultRouteProp>();
  const { vitals } = route.params;

  const findings = useMemo(() => evaluateVitals(vitals), [vitals]);
  const [aiSummary, setAiSummary] = useState('');
  const [isInferring, setIsInferring] = useState(true);

  // Voice state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // --- Resemble.ai TTS ---
  const handleVoice = async () => {
    // If already speaking — stop
    if (isSpeaking && soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsSpeaking(false);
      return;
    }

    if (!aiSummary) return;

    try {
      setIsLoadingVoice(true);

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      // Call Resemble.ai
      const response = await fetch(RESEMBLE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${RESEMBLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice_uuid: RESEMBLE_VOICE_UUID,
          data: aiSummary,
          output_format: 'mp3',
          sample_rate: 22050,
        }),
      });

      const json = await response.json();

      if (!json.success) {
        console.error('[Resemble] Error:', json.message);
        setIsLoadingVoice(false);
        return;
      }

      // Audio comes back as base64 — find the long base64 string field
      const audioBase64 = Object.values(json).find(
        (v) => typeof v === 'string' && v.length > 1000
      ) as string;

      if (!audioBase64) {
        console.error('[Resemble] No audio data in response');
        setIsLoadingVoice(false);
        return;
      }

      // Load and play
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${audioBase64}` },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setIsSpeaking(true);
      setIsLoadingVoice(false);

      // Auto-reset when playback finishes
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsSpeaking(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });

    } catch (error) {
      console.error('[Resemble] Error:', error);
      setIsLoadingVoice(false);
      setIsSpeaking(false);
    }
  };

  // --- Gemini Analysis ---
  useEffect(() => {
    const fetchGeminiAnalysis = async () => {
      setIsInferring(true);

      if (!GEMINI_API_KEY) {
        setAiSummary('API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
        setIsInferring(false);
        return;
      }

      const prompt = `
        You are Baymax, a friendly and caring personal healthcare companion — warm, gentle, and thorough.
        Speak directly to the patient in first person ("I noticed...", "Your..."), like you are talking to them out loud.

        Analyze these patient vitals:
        Heart Rate: ${vitals.heartRate} BPM
        SpO2: ${vitals.spo2}%
        Temperature: ${vitals.temperature}°C
        Blood Pressure: ${vitals.bloodPressure}

        Give a detailed spoken health summary in 5–7 sentences covering:
        1. Overall health impression
        2. Each vital — what it means and whether it is normal
        3. Any concerns or reassurances
        4. One practical tip or next step

        If SpO2 is below 92%, urgently and kindly recommend immediate medical attention.
        Use simple, human language — no bullet points, no headers, just flowing natural speech as if you are speaking aloud.
        End with a warm, Baymax-style closing line like "I will always be with you" or "On a scale of 1 to 10, how is your pain?"
      `;

      try {
        const response = await fetch(GEMINI_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.7,
              thinkingConfig: {
                thinkingBudget: 0,
              },
            },
          }),
        });

        const data = await response.json();

        if (__DEV__) {
          console.log('[Gemini] Status:', response.status);
          console.log('[Gemini] Response:', JSON.stringify(data, null, 2));
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          setAiSummary(text.trim());
          await saveScan({
            ...vitals,
            overallStatus: 'Verified',
            aiSummary: text.trim(),
          });
        } else {
          const errorMsg = data?.error?.message ?? 'Invalid API response structure.';
          console.error('[Gemini] API Error:', errorMsg);
          setAiSummary(`Analysis unavailable: ${errorMsg}`);
        }
      } catch (error) {
        console.error('[Gemini] Fetch Error:', error);
        setAiSummary('Analysis currently unavailable. Please check connectivity and try again.');
      } finally {
        setIsInferring(false);
      }
    };

    fetchGeminiAnalysis();
  }, [vitals]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.edgeLabel}>GEMINI NEURAL ENGINE</Text>
          <Text style={styles.mainTitle}>Vitals Analysis</Text>
        </View>
        <View style={styles.diagnosticPill}>
          <Text style={styles.diagnosticText}>CLOUD ENHANCED</Text>
        </View>
      </View>

      {/* Metric Grid */}
      <View style={styles.gridContainer}>
        {findings.map((item, idx) => (
          <View key={idx} style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>{item.label.toUpperCase()}</Text>
              <Ionicons
                name="ellipse"
                size={8}
                color={
                  item.status === 'high'
                    ? '#D32F2F'
                    : item.status === 'low'
                    ? '#FBC02D'
                    : '#2E7D32'
                }
              />
            </View>
            <Text style={styles.bigMetricValue}>{item.value.split(' ')[0]}</Text>
            <Text style={styles.unitLabel}>{item.value.split(' ').slice(1).join(' ')}</Text>
          </View>
        ))}
      </View>

      {/* AI Interpretation Card */}
      <View style={styles.inferenceCard}>

        {/* Header row with title + voice button */}
        <View style={styles.aiHeaderRow}>
          <View style={styles.aiHeaderLeft}>
            <MaterialCommunityIcons name="brain" size={24} color={COLORS.primary} />
            <Text style={styles.aiTitle}>BAYMAX HEALTH REPORT</Text>
          </View>

          {/* 🔊 Voice button — appears only when AI text is ready */}
          {!isInferring && aiSummary ? (
            <TouchableOpacity
              style={[styles.voiceBtn, isSpeaking && styles.voiceBtnActive]}
              onPress={handleVoice}
              disabled={isLoadingVoice}
            >
              {isLoadingVoice ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons
                  name={isSpeaking ? 'stop-circle' : 'volume-high'}
                  size={22}
                  color={isSpeaking ? '#FFF' : COLORS.primary}
                />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Content */}
        {isInferring ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loaderText}>Analyzing biometric data...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.aiText}>{aiSummary}</Text>
            {isSpeaking && (
              <View style={styles.speakingIndicator}>
                <Ionicons name="radio-outline" size={14} color={COLORS.primary} />
                <Text style={styles.speakingText}>Baymax is speaking...</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="refresh-outline" size={20} color="#555" />
          <Text style={styles.secondaryBtnText}>NEW SCAN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('History')}
        >
          <Ionicons name="file-tray-full-outline" size={20} color="#FFF" />
          <Text style={styles.primaryBtnText}>VIEW LOGS</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { paddingBottom: 40 },
  header: {
    padding: 25,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  edgeLabel: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  mainTitle: { color: '#1A1A1A', fontSize: 28, fontWeight: '900' },
  diagnosticPill: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  diagnosticText: { fontSize: 9, fontWeight: '900', color: '#1565C0' },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardLabel: { color: '#AAA', fontSize: 11, fontWeight: '700' },
  bigMetricValue: { color: '#212121', fontSize: 40, fontWeight: '900' },
  unitLabel: { color: '#777', fontSize: 12, fontWeight: '700' },
  inferenceCard: {
    margin: 15,
    padding: 22,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    flexShrink: 0,
    overflow: 'visible',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiTitle: { color: COLORS.primary, marginLeft: 8, fontWeight: '900', fontSize: 12 },

  // Voice button styles
  voiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  voiceBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  aiText: {
    color: '#444',
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '500',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  speakingText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
    fontStyle: 'italic',
  },
  loaderContainer: { flexDirection: 'row', alignItems: 'center' },
  loaderText: { marginLeft: 10, color: '#999', fontSize: 14, fontStyle: 'italic' },
  actionGrid: { flexDirection: 'row', padding: 15, justifyContent: 'space-between' },
  secondaryBtn: {
    width: '46%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#555', fontWeight: '800', marginLeft: 8 },
  primaryBtn: {
    width: '46%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFF', fontWeight: '800', marginLeft: 8 },
});
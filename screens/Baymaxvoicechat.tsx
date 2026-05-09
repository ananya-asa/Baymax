import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// --- THEME: CLINICAL WHITE + BAYMAX RED ---
const COLORS = {
  primary: '#EB3324', // Healthcare Red
  background: '#FFFFFF',
  terminal: '#F9F9F9',
  text: '#2D2D2D',
  faded: '#BBB',
};

// API Configuration
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || 'YOUR_GROQ_API_KEY';
const GROQ_CHAT_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_WHISPER_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions';

const RESEMBLE_API_KEY = process.env.EXPO_PUBLIC_RESEMBLE_API_KEY || 'YOUR_RESEMBLE_API_KEY';
const RESEMBLE_VOICE_UUID = '2b3c5525';
const RESEMBLE_ENDPOINT = 'https://f.cluster.resemble.ai/synthesize';

type Message = { id: string; role: 'user' | 'baymax'; text: string };
type Phase = 'idle' | 'recording' | 'thinking' | 'speaking' | 'error';

const BAYMAX_SYSTEM_PROMPT = `
You are Baymax from Big Hero 6 — a warm, caring, gentle personal healthcare companion.
Rules:
- Always speak in Baymax's calm, slightly robotic but deeply caring tone.
- Keep answers concise — 3 to 5 sentences max.
- Never use bullet points or lists — only flowing natural speech.
- End every response with: "I am satisfied with your care."
`;

// --- UI COMPONENTS ---

function ScanningLine({ active }: { active: boolean }) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: 400, duration: 2000, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -100, duration: 0, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active]);

  if (!active) return null;
  return (
    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
  );
}

function PulsingRings({ active, color }: { active: boolean; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      scale.setValue(1);
      opacity.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 2.2, duration: 1500, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    opacity.setValue(0.5);
    animation.start();
    return () => animation.stop();
  }, [active]);

  return <Animated.View style={[styles.pulseRing, { borderColor: color, transform: [{ scale }], opacity }]} />;
}

export default function BaymaxVoiceChat() {
  const navigation = useNavigation<any>();
  const [phase, setPhase] = useState<Phase>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [statusText, setStatusText] = useState('STATION READY');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return () => { if (recordingRef.current) recordingRef.current.stopAndUnloadAsync(); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // --- LOGIC ---

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        recorder.onstop = () => processTranscript(new Blob(audioChunksRef.current, { type: 'audio/wav' }));
        recorder.start();
        mediaRecorderRef.current = recorder;
      } else {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) return;
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        recordingRef.current = recording;
      }
      setPhase('recording');
      setStatusText('SCANNING...');
    } catch (e) {
      setPhase('error');
    }
  };

  const stopRecording = async () => {
    setPhase('thinking');
    setStatusText('ANALYZING...');
    if (Platform.OS === 'web') {
      mediaRecorderRef.current?.stop();
    } else {
      await recordingRef.current?.stopAndUnloadAsync();
      const uri = recordingRef.current?.getURI();
      if (uri) {
        const response = await fetch(uri);
        processTranscript(await response.blob());
      }
    }
  };

  const processTranscript = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.wav');
      formData.append('model', 'whisper-large-v3');

      const res = await fetch(GROQ_WHISPER_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: formData,
      });
      const { text } = await res.json();
      if (!text) throw new Error();

      setMessages(p => [...p, { id: Date.now().toString(), role: 'user', text }]);
      const response = await getBaymaxResponse(text);
      setMessages(p => [...p, { id: (Date.now()+1).toString(), role: 'baymax', text: response }]);
      speak(response);
    } catch (e) {
      setPhase('error');
      setStatusText('DATA CORRUPT. RETRY.');
    }
  };

  const getBaymaxResponse = async (input: string) => {
    const res = await fetch(GROQ_CHAT_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: BAYMAX_SYSTEM_PROMPT }, { role: 'user', content: input }],
      }),
    });
    const data = await res.json();
    return data.choices[0].message.content;
  };

  const speak = async (text: string) => {
    setPhase('speaking');
    setStatusText('RESPONDING...');
    try {
      const res = await fetch(RESEMBLE_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Token ${RESEMBLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_uuid: RESEMBLE_VOICE_UUID, data: text, output_format: 'mp3' }),
      });
      const json = await res.json();
      let audioSrc = json.audio_content || json.url;
      if (!audioSrc.startsWith('http') && !audioSrc.startsWith('data:')) audioSrc = `data:audio/mp3;base64,${audioSrc}`;

      if (Platform.OS === 'web') {
        const audio = new window.Audio(audioSrc);
        audio.onended = () => { setPhase('idle'); setStatusText('STATION READY'); };
        audio.play().catch(() => setStatusText("TAP SCREEN TO HEAR"));
      } else {
        const { sound } = await Audio.Sound.createAsync({ uri: audioSrc }, { shouldPlay: true });
        sound.setOnPlaybackStatusUpdate((s: any) => { if (s.didJustFinish) { setPhase('idle'); setStatusText('STATION READY'); } });
      }
    } catch (e) { setPhase('idle'); }
  };

  return (
    <View style={styles.container}>
      {/* --- HEADER WITH BACK BUTTON --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons name="heart-pulse" size={18} color={COLORS.primary} />
          <Text style={styles.headerTitle}>BAYMAX SYSTEM</Text>
        </View>
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.terminalContainer}>
        <ScanningLine active={phase === 'recording'} />
        <ScrollView ref={scrollRef} contentContainerStyle={styles.chatContent}>
          {messages.length === 0 && (
            <View style={styles.emptyState}>
               <MaterialCommunityIcons name="robot-outline" size={80} color="#F0F0F0" />
               <Text style={styles.terminalText}>STATION IDLE. AWAITING INPUT.</Text>
            </View>
          )}
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleBaymax]}>
              <Text style={[styles.bubbleText, { color: msg.role === 'user' ? '#FFF' : COLORS.text }]}>
                {msg.role === 'baymax' ? `> ${msg.text}` : msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* --- CONTROL CENTER --- */}
      <View style={styles.controlCenter}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: phase === 'idle' ? '#00AEEF' : COLORS.primary }]} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        <View style={styles.micWrapper}>
          <PulsingRings active={phase === 'recording' || phase === 'speaking'} color={COLORS.primary} />
          <TouchableOpacity 
            style={[styles.micBtn, { backgroundColor: phase === 'recording' ? COLORS.primary : '#FFF' }]} 
            onPress={phase === 'recording' ? stopRecording : startRecording}
            disabled={phase === 'thinking'}
          >
            {phase === 'thinking' ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Ionicons 
                name={phase === 'recording' ? 'stop' : 'mic'} 
                size={34} 
                color={phase === 'recording' ? '#FFF' : COLORS.primary} 
              />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.footerNote}>PERSONAL HEALTHCARE COMPANION</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontWeight: '900', letterSpacing: 2, color: COLORS.primary, fontSize: 12, marginLeft: 6 },
  
  terminalContainer: { flex: 1, backgroundColor: '#FAFAFA', overflow: 'hidden' },
  scanLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: 'rgba(235, 51, 36, 0.2)', zIndex: 5 },
  
  chatContent: { padding: 20 },
  emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.6 },
  terminalText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: '#999', marginTop: 10 },
  
  bubble: { padding: 16, borderRadius: 2, marginBottom: 15, maxWidth: '85%' },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
  bubbleBaymax: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE' },
  bubbleText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  
  controlCenter: { paddingVertical: 40, alignItems: 'center', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 25 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  statusText: { fontSize: 10, fontWeight: '900', color: '#666', letterSpacing: 1.5 },
  
  micWrapper: { height: 110, width: 110, justifyContent: 'center', alignItems: 'center' },
  micBtn: { 
    width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', zIndex: 10,
    borderWidth: 2, borderColor: COLORS.primary,
    elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 
  },
  pulseRing: { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 2 },
  footerNote: { marginTop: 20, fontSize: 9, color: COLORS.faded, fontWeight: 'bold', letterSpacing: 1 }
});
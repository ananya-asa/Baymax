import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';

// --- Types ---
interface ProfileData {
  name: string;
  age: string;
  gender: string;
  maritalStatus: string;
  occupation: string;
  heightCm: string;
  weightKg: string;
  smoking: string;
  alcohol: string;
  exercise: string;
  sleepHours: string;
  diet: string;
  existingConditions: string;
}

const STORAGE_KEY = '@health_profile';

const DEFAULT_PROFILE: ProfileData = {
  name: '',
  age: '',
  gender: '',
  maritalStatus: '',
  occupation: '',
  heightCm: '',
  weightKg: '',
  smoking: 'No',
  alcohol: 'No',
  exercise: 'Rarely',
  sleepHours: '',
  diet: 'Mixed',
  existingConditions: '',
};

// --- Health Score Engine ---
const computeHealthScore = (p: ProfileData): { score: number; label: string; emoji: string; message: string } => {
  let score = 100;

  if (p.smoking === 'Yes') score -= 20;
  else if (p.smoking === 'Occasionally') score -= 10;

  if (p.alcohol === 'Heavy') score -= 20;
  else if (p.alcohol === 'Moderate') score -= 8;
  else if (p.alcohol === 'Occasionally') score -= 3;

  if (p.exercise === 'Daily') score += 5;
  else if (p.exercise === 'Weekly') score += 2;
  else if (p.exercise === 'Rarely') score -= 10;
  else if (p.exercise === 'Never') score -= 20;

  const sleep = parseFloat(p.sleepHours) || 0;
  if (sleep >= 7 && sleep <= 9) score += 5;
  else if (sleep < 5 || sleep > 10) score -= 15;
  else score -= 5;

  const h = parseFloat(p.heightCm) / 100;
  const w = parseFloat(p.weightKg);
  if (h > 0 && w > 0) {
    const bmi = w / (h * h);
    if (bmi >= 18.5 && bmi < 25) score += 5;
    else if (bmi >= 25 && bmi < 30) score -= 8;
    else if (bmi >= 30) score -= 18;
    else if (bmi < 18.5) score -= 10;
  }

  if (p.existingConditions && p.existingConditions.toLowerCase() !== 'none' && p.existingConditions.trim() !== '') {
    score -= 10;
  }

  if (p.diet === 'Vegetarian' || p.diet === 'Vegan') score += 3;

  score = Math.max(0, Math.min(100, score));

  if (score >= 85) return { score, label: 'Excellent', emoji: '🏆', message: 'Outstanding! Your lifestyle choices reflect exceptional health habits.' };
  if (score >= 70) return { score, label: 'Good', emoji: '💪', message: 'Great job! A few tweaks and you could be in excellent shape.' };
  if (score >= 50) return { score, label: 'Average', emoji: '🙂', message: 'Room to improve — small changes can make a big difference.' };
  if (score >= 30) return { score, label: 'Poor', emoji: '⚠️', message: 'Your health score needs attention. Consider lifestyle changes.' };
  return { score, label: 'Critical', emoji: '🚨', message: 'Please consult a healthcare provider and work on your habits.' };
};

const getBMI = (heightCm: string, weightKg: string): { value: number; category: string } | null => {
  const h = parseFloat(heightCm) / 100;
  const w = parseFloat(weightKg);
  if (!h || !w) return null;
  const bmi = w / (h * h);
  let category = 'Normal';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';
  return { value: parseFloat(bmi.toFixed(1)), category };
};

const scoreColor = (label: string) => {
  if (label === 'Excellent') return '#2E7D32';
  if (label === 'Good') return '#388E3C';
  if (label === 'Average') return '#F57F17';
  if (label === 'Poor') return '#E65100';
  return '#B71C1C';
};

// --- Stat Card (dashboard grid tile) ---
const StatCard = ({
  icon,
  label,
  value,
  sub,
  badge,
  badgeColor,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  badge?: string;
  badgeColor?: 'good' | 'warn' | 'bad';
}) => (
  <View style={styles.statCard}>
    <View style={styles.statIconWrap}>
      <Ionicons name={icon as any} size={20} color={COLORS.primary} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    {badge ? (
      <View style={[
        styles.badge,
        badgeColor === 'good' ? styles.badgeGood : badgeColor === 'warn' ? styles.badgeWarn : styles.badgeBad,
      ]}>
        <Text style={[
          styles.badgeText,
          badgeColor === 'good' ? styles.badgeTextGood : badgeColor === 'warn' ? styles.badgeTextWarn : styles.badgeTextBad,
        ]}>
          {badge}
        </Text>
      </View>
    ) : null}
  </View>
);

// --- Toggle Selector ---
const ToggleSelector = ({
  label,
  icon,
  options,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleLeft}>
      <Ionicons name={icon as any} size={22} color={COLORS.primary} />
      <Text style={styles.toggleLabel}>{label}</Text>
    </View>
    <View style={styles.toggleGroup}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.toggleChip, value === opt && styles.toggleChipActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.toggleChipText, value === opt && styles.toggleChipTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const SectionLabel = ({ label }: { label: string }) => (
  <Text style={styles.sectionLabel}>{label}</Text>
);

// --- Main Screen ---
export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [healthResult, setHealthResult] = useState<ReturnType<typeof computeHealthScore> | null>(null);
  const scaleAnim = useState(new Animated.Value(0.7))[0];

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setProfile(JSON.parse(raw));
          setHasProfile(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (e) {
        setIsEditing(true);
      }
    };
    load();
  }, []);

  const openPopup = (result: ReturnType<typeof computeHealthScore>) => {
    setHealthResult(result);
    setShowPopup(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  };

  const closePopup = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.7,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setShowPopup(false));
  };

  const handleSave = useCallback(async () => {
    if (!profile.name.trim()) {
      Alert.alert('Name required', 'Please enter your name to continue.');
      return;
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setHasProfile(true);
      setIsEditing(false);
      const result = computeHealthScore(profile);
      openPopup(result);
    } catch (e) {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    }
  }, [profile]);

  const update = (key: keyof ProfileData, val: string) => {
    setProfile((prev) => ({ ...prev, [key]: val }));
  };

  const bmi = getBMI(profile.heightCm, profile.weightKg);
  const initials = profile.name.trim()
    ? profile.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            {hasProfile && (
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.avatarName}>{profile.name || 'Your Name'}</Text>
          <Text style={styles.avatarSub}>
            {profile.age ? `${profile.age} yrs` : ''}
            {profile.age && profile.gender ? ' · ' : ''}
            {profile.gender || 'Complete your profile'}
          </Text>
        </View>

        {/* ── DASHBOARD VIEW ── */}
        {hasProfile && !isEditing && (() => {
          const result = computeHealthScore(profile);
          const bmiData = getBMI(profile.heightCm, profile.weightKg);

          return (
            <View style={styles.dashboardView}>

              {/* Score Banner */}
              <View style={[styles.scoreBanner, { borderLeftColor: scoreColor(result.label) }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scoreBannerLabel}>Health Score</Text>
                  <Text style={[styles.scoreBannerNumber, { color: scoreColor(result.label) }]}>
                    {result.score}
                    <Text style={styles.scoreBannerMax}>/100</Text>
                  </Text>
                  <Text style={styles.scoreBannerMsg}>{result.message}</Text>
                </View>
                <View style={[styles.scoreEmojiBubble, { backgroundColor: scoreColor(result.label) + '18' }]}>
                  <Text style={styles.scoreEmoji}>{result.emoji}</Text>
                  <Text style={[styles.scoreLabel, { color: scoreColor(result.label) }]}>{result.label}</Text>
                </View>
              </View>

              {/* Personal Grid */}
              <SectionLabel label="Personal" />
              <View style={styles.grid}>
                <StatCard icon="person-outline" label="Age" value={profile.age} sub="years" />
                <StatCard icon="male-female-outline" label="Gender" value={profile.gender} />
                <StatCard icon="heart-outline" label="Marital" value={profile.maritalStatus} />
                <StatCard icon="briefcase-outline" label="Occupation" value={profile.occupation || '—'} />
              </View>

              {/* Body Grid */}
              <SectionLabel label="Body" />
              <View style={styles.grid}>
                <StatCard icon="resize-outline" label="Height" value={profile.heightCm} sub="cm" />
                <StatCard icon="barbell-outline" label="Weight" value={profile.weightKg} sub="kg" />
                {bmiData ? (
                  <StatCard
                    icon="analytics-outline"
                    label="BMI"
                    value={`${bmiData.value}`}
                    badge={bmiData.category}
                    badgeColor={bmiData.category === 'Normal' ? 'good' : bmiData.category === 'Overweight' ? 'warn' : 'bad'}
                  />
                ) : null}
                <StatCard
                  icon="moon-outline"
                  label="Sleep"
                  value={profile.sleepHours}
                  sub="hrs/night"
                  badge={parseFloat(profile.sleepHours) >= 7 && parseFloat(profile.sleepHours) <= 9 ? 'Good' : 'Check'}
                  badgeColor={parseFloat(profile.sleepHours) >= 7 && parseFloat(profile.sleepHours) <= 9 ? 'good' : 'warn'}
                />
              </View>

              {/* Lifestyle Grid */}
              <SectionLabel label="Lifestyle" />
              <View style={styles.grid}>
                <StatCard
                  icon="flame-outline"
                  label="Smoking"
                  value={profile.smoking}
                  badge={profile.smoking === 'No' ? 'Safe' : 'Risk'}
                  badgeColor={profile.smoking === 'No' ? 'good' : 'bad'}
                />
                <StatCard
                  icon="wine-outline"
                  label="Alcohol"
                  value={profile.alcohol}
                  badge={profile.alcohol === 'No' ? 'Safe' : profile.alcohol === 'Heavy' ? 'High Risk' : 'Moderate'}
                  badgeColor={profile.alcohol === 'No' ? 'good' : profile.alcohol === 'Heavy' ? 'bad' : 'warn'}
                />
                <StatCard
                  icon="walk-outline"
                  label="Exercise"
                  value={profile.exercise}
                  badge={profile.exercise === 'Daily' ? 'Great' : profile.exercise === 'Never' ? 'Risk' : undefined}
                  badgeColor={profile.exercise === 'Daily' ? 'good' : 'bad'}
                />
                <StatCard icon="leaf-outline" label="Diet" value={profile.diet} />
              </View>

              {profile.existingConditions ? (
                <>
                  <SectionLabel label="Medical" />
                  <View style={styles.wideCard}>
                    <Ionicons name="medical-outline" size={24} color={COLORS.primary} />
                    <View style={{ marginLeft: 14, flex: 1 }}>
                      <Text style={styles.wideCardLabel}>Existing Conditions</Text>
                      <Text style={styles.wideCardValue}>{profile.existingConditions}</Text>
                    </View>
                  </View>
                </>
              ) : null}

              <TouchableOpacity style={styles.saveBtn} onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil-outline" size={22} color="#fff" />
                <Text style={styles.saveBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* ── EDIT FORM ── */}
        {isEditing && (
          <View style={styles.formSection}>

            <SectionLabel label="Personal Details" />
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ananya Sharma"
                  placeholderTextColor="#bbb"
                  value={profile.name}
                  onChangeText={(v) => update('name', v)}
                />
              </View>
              <View style={styles.inputRow}>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 22"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    value={profile.age}
                    onChangeText={(v) => update('age', v)}
                  />
                </View>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Occupation</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Engineer"
                    placeholderTextColor="#bbb"
                    value={profile.occupation}
                    onChangeText={(v) => update('occupation', v)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <ToggleSelector
                label="Gender"
                icon="male-female-outline"
                options={['Male', 'Female', 'Other']}
                value={profile.gender}
                onChange={(v) => update('gender', v)}
              />
              <ToggleSelector
                label="Marital Status"
                icon="heart-outline"
                options={['Single', 'Married', 'Divorced']}
                value={profile.maritalStatus}
                onChange={(v) => update('maritalStatus', v)}
              />
            </View>

            <SectionLabel label="Body Measurements" />
            <View style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 165"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    value={profile.heightCm}
                    onChangeText={(v) => update('heightCm', v)}
                  />
                </View>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 60"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    value={profile.weightKg}
                    onChangeText={(v) => update('weightKg', v)}
                  />
                </View>
              </View>
              {bmi && (
                <View style={styles.bmiBox}>
                  <View>
                    <Text style={styles.bmiLabel}>BMI</Text>
                    <Text style={styles.bmiValue}>{bmi.value}</Text>
                  </View>
                  <View style={[
                    styles.badge,
                    bmi.category === 'Normal' ? styles.badgeGood : bmi.category === 'Overweight' ? styles.badgeWarn : styles.badgeBad,
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      bmi.category === 'Normal' ? styles.badgeTextGood : bmi.category === 'Overweight' ? styles.badgeTextWarn : styles.badgeTextBad,
                    ]}>
                      {bmi.category}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <SectionLabel label="Lifestyle" />
            <View style={styles.card}>
              <ToggleSelector label="Smoking" icon="flame-outline" options={['No', 'Occasionally', 'Yes']} value={profile.smoking} onChange={(v) => update('smoking', v)} />
              <ToggleSelector label="Alcohol" icon="wine-outline" options={['No', 'Occasionally', 'Moderate', 'Heavy']} value={profile.alcohol} onChange={(v) => update('alcohol', v)} />
              <ToggleSelector label="Exercise" icon="walk-outline" options={['Daily', 'Weekly', 'Rarely', 'Never']} value={profile.exercise} onChange={(v) => update('exercise', v)} />
              <ToggleSelector label="Diet" icon="leaf-outline" options={['Mixed', 'Vegetarian', 'Vegan', 'Keto']} value={profile.diet} onChange={(v) => update('diet', v)} />
            </View>

            <SectionLabel label="Sleep & Medical" />
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Average sleep hours per night</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 7"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  value={profile.sleepHours}
                  onChangeText={(v) => update('sleepHours', v)}
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Existing conditions (or "None")</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                  placeholder="e.g. Diabetes, Hypertension"
                  placeholderTextColor="#bbb"
                  multiline
                  value={profile.existingConditions}
                  onChangeText={(v) => update('existingConditions', v)}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </TouchableOpacity>

            {hasProfile && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── HEALTH SCORE POPUP ── */}
      <Modal transparent visible={showPopup} animationType="fade" onRequestClose={closePopup}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.popup, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.popupEmoji}>{healthResult?.emoji}</Text>
            <Text style={styles.popupTitle}>{healthResult?.label} Health!</Text>
            <Text style={[styles.popupScore, { color: scoreColor(healthResult?.label ?? '') }]}>
              {healthResult?.score}
              <Text style={styles.popupScoreMax}>/100</Text>
            </Text>
            <Text style={styles.popupMessage}>{healthResult?.message}</Text>
            <TouchableOpacity style={styles.popupBtn} onPress={closePopup}>
              <Text style={styles.popupBtnText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F6' },
  content: { paddingBottom: 56 },

  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56, paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },

  avatarSection: {
    backgroundColor: COLORS.primary,
    alignItems: 'center', paddingBottom: 32,
  },
  avatarWrap: { position: 'relative' },
  avatarCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarInitials: { fontSize: 36, fontWeight: '800', color: COLORS.primary },
  editBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
  },
  avatarName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 12 },
  avatarSub: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 4 },

  dashboardView: { padding: 16 },
  formSection: { padding: 16 },

  sectionLabel: {
    fontSize: 13, fontWeight: '800', color: COLORS.primary,
    letterSpacing: 1.1, textTransform: 'uppercase',
    marginTop: 22, marginBottom: 10,
  },

  // Score Banner
  scoreBanner: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 20, marginTop: 4,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#EBEBEB',
    borderLeftWidth: 6, elevation: 2,
  },
  scoreBannerLabel: { color: '#999', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  scoreBannerNumber: { fontSize: 58, fontWeight: '900', lineHeight: 64 },
  scoreBannerMax: { fontSize: 22, fontWeight: '600', color: '#bbb' },
  scoreBannerMsg: { color: '#666', fontSize: 14, marginTop: 6, lineHeight: 20 },
  scoreEmojiBubble: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, padding: 16, minWidth: 80, marginLeft: 12,
  },
  scoreEmoji: { fontSize: 40 },
  scoreLabel: { fontSize: 14, fontWeight: '800', marginTop: 4 },

  // 2-column grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: '#EBEBEB',
    elevation: 1,
  },
  statIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#FFF0F0',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: { color: '#999', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  statValue: { color: '#1A1A1A', fontSize: 20, fontWeight: '800' },
  statSub: { color: '#aaa', fontSize: 13, fontWeight: '600', marginTop: 2 },

  // Wide card for medical
  wideCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 18, borderWidth: 1, borderColor: '#EBEBEB',
    flexDirection: 'row', alignItems: 'flex-start', elevation: 1,
  },
  wideCardLabel: { color: '#999', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  wideCardValue: { color: '#1A1A1A', fontSize: 17, fontWeight: '700', lineHeight: 24 },

  // Badges
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  badgeGood: { backgroundColor: '#E8F5E9' },
  badgeWarn: { backgroundColor: '#FFF8E1' },
  badgeBad: { backgroundColor: '#FFEBEE' },
  badgeText: { fontSize: 12, fontWeight: '800' },
  badgeTextGood: { color: '#2E7D32' },
  badgeTextWarn: { color: '#F57F17' },
  badgeTextBad: { color: '#C62828' },

  // Form card wrapper
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#EBEBEB', overflow: 'hidden', elevation: 1,
  },

  // Toggle Selector
  toggleRow: {
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { color: '#1A1A1A', fontSize: 16, fontWeight: '700' },
  toggleGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22,
    borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA',
  },
  toggleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleChipText: { fontSize: 15, fontWeight: '700', color: '#777' },
  toggleChipTextActive: { color: '#fff' },

  // Form Inputs
  inputGroup: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: '#EBEBEB', gap: 14,
  },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#888' },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 17, color: '#1A1A1A', backgroundColor: '#FAFAFA',
  },

  // BMI Box
  bmiBox: {
    backgroundColor: '#FFF5F5', borderRadius: 12,
    padding: 14, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  bmiLabel: { color: '#999', fontSize: 13, fontWeight: '700' },
  bmiValue: { color: COLORS.primary, fontSize: 30, fontWeight: '900' },

  // Buttons
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 18, marginTop: 28,
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', marginTop: 14, paddingVertical: 10 },
  cancelBtnText: { color: '#999', fontSize: 16, fontWeight: '600' },

  // Popup
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  popup: {
    backgroundColor: '#fff', borderRadius: 28,
    padding: 36, alignItems: 'center',
    width: '85%', elevation: 12,
  },
  popupEmoji: { fontSize: 68, marginBottom: 12 },
  popupTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', marginBottom: 6 },
  popupScore: { fontSize: 54, fontWeight: '900', lineHeight: 62 },
  popupScoreMax: { fontSize: 22, fontWeight: '600', color: '#bbb' },
  popupMessage: { color: '#666', fontSize: 15, textAlign: 'center', marginTop: 12, marginBottom: 26, lineHeight: 22 },
  popupBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 15, paddingHorizontal: 48,
  },
  popupBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
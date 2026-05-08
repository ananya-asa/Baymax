import React, { useRef, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';

import {
  Video,
  ResizeMode,
  AVPlaybackStatus,
} from 'expo-av';

import {
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../theme/colors';

const { width: W, height: H } =
  Dimensions.get('window');

export default function DashboardScreen() {

  const navigation = useNavigation<any>();

  const videoRef = useRef<Video>(null);

  const [isPlaying, setIsPlaying] =
    useState(true);

  const [isMuted, setIsMuted] =
    useState(false);

  const pulseAnim =
    useRef(new Animated.Value(1)).current;

  /* =========================
     PULSE ANIMATION
  ========================= */

  React.useEffect(() => {

    Animated.loop(
      Animated.sequence([

        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 900,
          useNativeDriver: true,
        }),

        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),

      ])
    ).start();

  }, []);

  /* =========================
     STOP AUDIO ON NAVIGATION
  ========================= */

  useFocusEffect(
    React.useCallback(() => {

      const playVideo = async () => {
        if (videoRef.current) {
          await videoRef.current.playAsync();
        }
      };

      playVideo();

      return () => {

        const stopVideo = async () => {
          if (videoRef.current) {
            await videoRef.current.stopAsync();
          }
        };

        stopVideo();
      };

    }, [])
  );

  /* =========================
     PLAY / PAUSE
  ========================= */

  const togglePlay = async () => {

    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  /* =========================
     MUTE
  ========================= */

  const toggleMute = async () => {

    if (!videoRef.current) return;

    await videoRef.current.setIsMutedAsync(
      !isMuted
    );

    setIsMuted((p) => !p);
  };

  return (

    <View style={styles.container}>

      {/* BACKGROUND BLOBS */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      {/* HEADER */}
      <View style={styles.header}>

        <View style={styles.logoRow}>

          <View style={styles.logoIcon}>
            <Ionicons
              name="heart"
              size={16}
              color="#FFF"
            />
          </View>

          <Text style={styles.logoText}>
            BAYMAX
          </Text>

        </View>

        <TouchableOpacity
          style={styles.consoleBtn}
          onPress={() =>
            navigation.navigate('Home')
          }
        >
          <Text style={styles.consoleBtnText}>
            Open Console
          </Text>

          <Ionicons
            name="arrow-forward"
            size={14}
            color={COLORS.primary}
          />
        </TouchableOpacity>

      </View>

      {/* HERO SECTION */}
      <View style={styles.hero}>

        {/* LEFT SIDE */}
        <View style={styles.left}>

          <Text style={styles.hello}>
            Hello,
          </Text>

          <Text style={styles.name}>
            I am{'\n'}

            <Text style={styles.accent}>
              Baymax.
            </Text>
          </Text>

          <Text style={styles.sub}>
            Your Personal{'\n'}
            Health Assistant.
          </Text>

          <View style={styles.btnStack}>

            <Animated.View
              style={{
                transform: [
                  { scale: pulseAnim },
                ],
              }}
            >

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  navigation.navigate('Home')
                }
              >

                <Ionicons
                  name="pulse"
                  size={18}
                  color="#FFF"
                />

                <Text style={styles.primaryBtnText}>
                  Start Health Scan
                </Text>

              </TouchableOpacity>

            </Animated.View>

            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() =>
                navigation.navigate('Home')
              }
            >

              <Ionicons
                name="stats-chart"
                size={16}
                color={COLORS.primary}
              />

              <Text style={styles.outlineBtnText}>
                Start Analysis
              </Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() =>
                navigation.navigate('History')
              }
            >

              <Ionicons
                name="time-outline"
                size={15}
                color={COLORS.subtext}
              />

              <Text style={styles.ghostBtnText}>
                View past reports
              </Text>

            </TouchableOpacity>

          </View>
        </View>

        {/* RIGHT SIDE */}
        <View style={styles.right}>

          {/* VIDEO */}
          <View style={styles.videoContainer}>

            <Video
              ref={videoRef}
              source={require('../assets/baymax_intro.mp4')}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay
              useNativeControls={false}

              onPlaybackStatusUpdate={(
                s: AVPlaybackStatus
              ) => {

                if (s.isLoaded) {
                  setIsPlaying(
                    s.isPlaying
                  );
                }

              }}
            />

          </View>

          {/* CONTROLS */}
          <View style={styles.controls}>

            <TouchableOpacity
              style={styles.ctrl}
              onPress={togglePlay}
            >

              <Ionicons
                name={
                  isPlaying
                    ? 'pause'
                    : 'play'
                }
                size={18}
                color="#FFF"
              />

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctrl}
              onPress={toggleMute}
            >

              <Ionicons
                name={
                  isMuted
                    ? 'volume-mute'
                    : 'volume-high'
                }
                size={18}
                color="#FFF"
              />

            </TouchableOpacity>

          </View>

          {/* CAPTION */}
          <Text style={styles.caption}>
            "I will scan you now."
          </Text>

        </View>
      </View>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },

  /* BACKGROUND */
  blobTop: {
    position: 'absolute',
    top: -80,
    left: -80,

    width: 240,
    height: 240,
    borderRadius: 120,

    backgroundColor: COLORS.primary,
    opacity: 0.06,
  },

  blobBottom: {
    position: 'absolute',
    bottom: -60,
    right: -60,

    width: 200,
    height: 200,
    borderRadius: 100,

    backgroundColor: COLORS.primary,
    opacity: 0.06,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingHorizontal: 32,

    paddingTop:
      Platform.OS === 'ios'
        ? 54
        : 20,

    paddingBottom: 10,

    zIndex: 10,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  logoIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,

    backgroundColor: COLORS.primary,

    justifyContent: 'center',
    alignItems: 'center',
  },

  logoText: {
    fontSize: 17,
    fontWeight: '900',

    color: COLORS.text,
    letterSpacing: 2,
  },

  consoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,

    paddingHorizontal: 14,
    paddingVertical: 7,

    borderRadius: 20,

    borderWidth: 1.5,
    borderColor: COLORS.border,

    backgroundColor: '#FFF',
  },

  consoleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  /* HERO */
  hero: {
    flex: 1,
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',

    paddingLeft: 90,
    paddingRight: 40,
  },

  /* LEFT */
  left: {
    width: W * 0.46,
    maxWidth: 420,

    zIndex: 5,
  },

  hello: {
    fontSize: 18,
    fontWeight: '400',

    color: COLORS.subtext,

    marginBottom: 6,
  },

  name: {
    fontSize: 58,
    fontWeight: '900',

    color: COLORS.text,

    lineHeight: 62,
    marginBottom: 14,
  },

  accent: {
    color: COLORS.primary,
  },

  sub: {
    fontSize: 21,
    fontWeight: '600',

    color: COLORS.subtext,

    lineHeight: 32,
    marginBottom: 34,
  },

  btnStack: {
    gap: 16,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    backgroundColor: COLORS.primary,

    paddingVertical: 16,
    paddingHorizontal: 28,

    minWidth: 230,

    borderRadius: 18,

    shadowColor: COLORS.primary,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.35,
    shadowRadius: 12,

    elevation: 6,
  },

  primaryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },

  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,

    borderWidth: 2,
    borderColor: COLORS.primary,

    backgroundColor: COLORS.primarySoft,

    paddingVertical: 14,
    paddingHorizontal: 24,

    minWidth: 230,

    borderRadius: 18,
  },

  outlineBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },

  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,
    paddingVertical: 4,
  },

  ghostBtnText: {
    fontSize: 13,
    fontWeight: '600',

    color: COLORS.subtext,

    textDecorationLine: 'underline',
  },

  /* RIGHT */
  right: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  videoContainer: {
    position: 'absolute',

    width: W,
    height: H,

    right: -340,
    top: -340,

    justifyContent: 'center',
    alignItems: 'center',
  },

  video: {
    width: W * 1.4,
    height: H * 1.1,
  },

  /* CONTROLS */
  controls: {
    position: 'absolute',

    bottom: 50,
    right: 40,

    flexDirection: 'row',
    gap: 8,

    zIndex: 20,
  },

  ctrl: {
    width: 38,
    height: 38,
    borderRadius: 19,

    backgroundColor: 'rgba(0,0,0,0.45)',

    justifyContent: 'center',
    alignItems: 'center',
  },

  /* CAPTION */
  caption: {
    position: 'absolute',
    bottom: 12,

    fontSize: 12,
    fontWeight: '500',

    color: COLORS.subtext,
    fontStyle: 'italic',

    zIndex: 20,
  },

});
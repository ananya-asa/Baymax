

import React, { useState, Suspense } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { Canvas } from '@react-three/fiber';
import {
  useGLTF,
  Html,
  Stage,
  OrbitControls,
} from '@react-three/drei';

import { useNavigation } from '@react-navigation/native';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { Asset } from 'expo-asset';
import { COLORS } from '../theme/colors';

/* =========================
   3D HEALTH MODEL
========================= */

function HealthModel({
  heartRate,
  setHeartRate,
  spo2,
  setSpo2,
  temp,
  setTemp,
  bp,
  setBp,
  smoke,
  setSmoke,
  roomTemp,
  setRoomTemp,
  humidity,
  setHumidity,
}: any) {

  const asset = Asset.fromModule(
    require('../assets/human_body.glb')
  );

  const { scene } = useGLTF(asset.uri) as any;

  const [hoveredId, setHoveredId] =
    useState<string | null>(null);

  const getDynamicStyle = (
    id: string,
    baseStyle: any
  ) => [
    baseStyle,

    hoveredId === id && {
      borderColor: COLORS.primary,
      borderWidth: 2,

      transform: [{ scale: 1.08 }],

      shadowColor: COLORS.primary,
      shadowOpacity: 0.25,
      shadowRadius: 10,

      elevation: 10,
    },
  ];

  return (
    <group>

      {/* HUMAN BODY */}
      <primitive
        object={scene}
        scale={2}
        position={[0, -1.5, 0]}
      />

      {/* HEART RATE */}
      <mesh
        position={[0.15, 0.6, 0.25]}
        onPointerOver={() => setHoveredId('hr')}
        onPointerOut={() => setHoveredId(null)}
      >

        <Html distanceFactor={8} center>
          <Ionicons
            name="heart"
            size={24}
            color={
              hoveredId === 'hr'
                ? '#FF0000'
                : COLORS.primary
            }
          />
        </Html>

        <Html
          distanceFactor={8}
          position={[1.4, 0, 0]}
          pointerEvents="auto"
        >
          <View style={styles.calloutWrapper}>

            <View style={styles.line} />

            <View
              style={getDynamicStyle(
                'hr',
                styles.floatingInputCard
              )}
            >
              <Text style={styles.floatingLabel}>
                HEART RATE
              </Text>

              <TextInput
                value={heartRate}
                onChangeText={setHeartRate}
                placeholder="72"
                style={styles.floatingInput}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Html>
      </mesh>

      {/* SpO2 */}
      <mesh
        position={[-1.2, 0.4, 0.1]}
        onPointerOver={() => setHoveredId('spo2')}
        onPointerOut={() => setHoveredId(null)}
      >
        <Html
          distanceFactor={8}
          position={[-1.5, 0, 0]}
          pointerEvents="auto"
        >
          <View
            style={[
              styles.calloutWrapper,
              { flexDirection: 'row-reverse' },
            ]}
          >
            <View style={styles.line} />

            <View
              style={getDynamicStyle(
                'spo2',
                styles.floatingInputCard
              )}
            >
              <Text style={styles.floatingLabel}>
                SpO2 %
              </Text>

              <TextInput
                value={spo2}
                onChangeText={setSpo2}
                placeholder="98"
                style={styles.floatingInput}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Html>
      </mesh>

      {/* BODY TEMP */}
      <mesh
        position={[0, 1.4, 0.15]}
        onPointerOver={() => setHoveredId('temp')}
        onPointerOut={() => setHoveredId(null)}
      >
        <Html
          distanceFactor={8}
          position={[1.5, 0.4, 0]}
          pointerEvents="auto"
        >
          <View style={styles.calloutWrapper}>

            <View style={styles.line} />

            <View
              style={getDynamicStyle(
                'temp',
                styles.floatingInputCard
              )}
            >
              <Text style={styles.floatingLabel}>
                BODY TEMP
              </Text>

              <TextInput
                value={temp}
                onChangeText={setTemp}
                placeholder="36.8"
                style={styles.floatingInput}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Html>
      </mesh>

      {/* BLOOD PRESSURE */}
      <mesh
        position={[0.7, 0.3, 0.15]}
        onPointerOver={() => setHoveredId('bp')}
        onPointerOut={() => setHoveredId(null)}
      >
        <Html
          distanceFactor={8}
          position={[1.3, -0.5, 0]}
          pointerEvents="auto"
        >
          <View style={styles.calloutWrapper}>

            <View style={styles.line} />

            <View
              style={getDynamicStyle(
                'bp',
                styles.floatingInputCard
              )}
            >
              <Text style={styles.floatingLabel}>
                BP mmHg
              </Text>

              <TextInput
                value={bp}
                onChangeText={setBp}
                placeholder="120/80"
                style={styles.floatingInput}
              />
            </View>
          </View>
        </Html>
      </mesh>

      {/* SMOKE SENSOR */}
      <mesh
        position={[-3.5, 1.5, 0]}
        onPointerOver={() => setHoveredId('smoke')}
        onPointerOut={() => setHoveredId(null)}
      >
        <Html distanceFactor={8} pointerEvents="auto">

          <View
            style={getDynamicStyle(
              'smoke',
              styles.envCard
            )}
          >
            <MaterialCommunityIcons
              name="smoke-detector"
              size={24}
              color={COLORS.primary}
            />

            <Text style={styles.envLabel}>
              SMOKE LEVEL
            </Text>

            <TextInput
              value={smoke}
              onChangeText={setSmoke}
              placeholder="0.02"
              style={styles.envInput}
              keyboardType="numeric"
            />
          </View>

        </Html>
      </mesh>

      {/* HUMIDITY */}
      <mesh
        position={[-3.5, 0.5, 0]}
        onPointerOver={() => setHoveredId('humidity')}
        onPointerOut={() => setHoveredId(null)}
      >
        <Html distanceFactor={8} pointerEvents="auto">

          <View
            style={getDynamicStyle(
              'humidity',
              styles.envCard
            )}
          >
            <Ionicons
              name="water"
              size={24}
              color={COLORS.primary}
            />

            <Text style={styles.envLabel}>
              HUMIDITY %
            </Text>

            <TextInput
              value={humidity}
              onChangeText={setHumidity}
              placeholder="45"
              style={styles.envInput}
              keyboardType="numeric"
            />
          </View>

        </Html>
      </mesh>

      {/* ROOM TEMP */}
      <mesh
        position={[-3.5, -0.5, 0]}
        onPointerOver={() => setHoveredId('room')}
        onPointerOut={() => setHoveredId(null)}
      >
        <Html distanceFactor={8} pointerEvents="auto">

          <View
            style={getDynamicStyle(
              'room',
              styles.envCard
            )}
          >
            <Ionicons
              name="thermometer"
              size={24}
              color={COLORS.primary}
            />

            <Text style={styles.envLabel}>
              ROOM TEMP
            </Text>

            <TextInput
              value={roomTemp}
              onChangeText={setRoomTemp}
              placeholder="24.5"
              style={styles.envInput}
              keyboardType="numeric"
            />
          </View>

        </Html>
      </mesh>

    </group>
  );
}

/* =========================
   HOME SCREEN
========================= */

export default function HomeScreen() {

  const navigation = useNavigation<any>();

  const [heartRate, setHeartRate] =
    useState('');

  const [spo2, setSpo2] =
    useState('');

  const [temperature, setTemperature] =
    useState('');

  const [bloodPressure, setBloodPressure] =
    useState('');

  const [smoke, setSmoke] =
    useState('');

  const [roomTemp, setRoomTemp] =
    useState('');

  const [humidity, setHumidity] =
    useState('');

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>

        {/* LEFT */}
        <View style={styles.headerLeft}>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() =>
              navigation.navigate('Dashboard')
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            HEALTH CONSOLE
          </Text>

        </View>

        {/* RIGHT */}
        <View style={styles.headerIcons}>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              navigation.navigate('History')
            }
          >
            <Ionicons
              name="time-outline"
              size={22}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              navigation.navigate('Profile')
            }
          >
            <Ionicons
              name="person-outline"
              size={22}
              color={COLORS.primary}
            />
          </TouchableOpacity>

        </View>
      </View>

      {/* 3D CANVAS */}
      <View style={styles.canvasContainer}>

        <Canvas
          camera={{
            position: [0, 0, 7],
            fov: 45,
          }}
        >
          <Suspense
            fallback={
              <Html center>
                <ActivityIndicator
                  color={COLORS.primary}
                />
              </Html>
            }
          >

            <Stage
              environment="city"
              intensity={0.5}
            >
              <HealthModel
                heartRate={heartRate}
                setHeartRate={setHeartRate}

                spo2={spo2}
                setSpo2={setSpo2}

                temp={temperature}
                setTemp={setTemperature}

                bp={bloodPressure}
                setBp={setBloodPressure}

                smoke={smoke}
                setSmoke={setSmoke}

                roomTemp={roomTemp}
                setRoomTemp={setRoomTemp}

                humidity={humidity}
                setHumidity={setHumidity}
              />
            </Stage>

          </Suspense>

          <OrbitControls
            enableZoom={false}
            enableRotate={false}
            makeDefault
          />
        </Canvas>

      </View>

      {/* FOOTER */}
      <View style={styles.footer}>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate('Result', {
              vitals: {
                heartRate:
                  heartRate || '72',

                spo2:
                  spo2 || '98',

                temperature:
                  temperature || '36.6',

                bloodPressure:
                  bloodPressure || '120/80',

                smoke,
                roomTemp,
                humidity,
              },
            })
          }
        >
          <Text style={styles.buttonText}>
            Generate Report
          </Text>
        </TouchableOpacity>

      </View>

      {/* CHAT FAB */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() =>
          navigation.navigate('Chat')
        }
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="robot"
          size={28}
          color="#FFF"
        />

        <View style={styles.onlineBadge} />
      </TouchableOpacity>

    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* HEADER */
  header: {
    padding: 24,
    paddingTop: 56,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,

    backgroundColor: COLORS.primarySoft,

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,
    shadowRadius: 6,

    elevation: 3,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },

  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,

    backgroundColor: COLORS.primarySoft,

    justifyContent: 'center',
    alignItems: 'center',
  },

  /* CANVAS */
  canvasContainer: {
    flex: 1,
    minHeight:
      Platform.OS === 'web'
        ? 600
        : undefined,
  },

  /* FOOTER */
  footer: {
    padding: 24,

    position: 'absolute',
    bottom: 0,

    width: '100%',
  },

  primaryButton: {
    backgroundColor: COLORS.primary,

    padding: 20,
    borderRadius: 20,

    alignItems: 'center',
  },

  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },

  /* FAB */
  fabButton: {
    position: 'absolute',

    bottom: 105,
    right: 24,

    width: 64,
    height: 64,
    borderRadius: 32,

    backgroundColor: COLORS.primary,

    justifyContent: 'center',
    alignItems: 'center',

    elevation: 8,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  onlineBadge: {
    position: 'absolute',

    top: 2,
    right: 4,

    width: 14,
    height: 14,
    borderRadius: 7,

    backgroundColor: '#4CAF50',

    borderWidth: 2,
    borderColor: '#FFF',
  },

  /* CALLOUTS */
  calloutWrapper: {
    flexDirection: 'row',
    alignItems: 'center',

    width: 220,
  },

  line: {
    width: 50,
    height: 2,

    backgroundColor: '#FF0000',
  },

  floatingInputCard: {
    backgroundColor: '#FFF',

    padding: 12,
    borderRadius: 16,

    borderWidth: 1,
    borderColor: COLORS.border,

    width: 120,
  },

  floatingLabel: {
    fontSize: 9,
    fontWeight: '800',

    color: COLORS.subtext,

    marginBottom: 4,
  },

  floatingInput: {
    fontSize: 18,
    fontWeight: '800',

    color: COLORS.text,

    padding: 0,
  },

  /* ENVIRONMENT CARDS */
  envCard: {
    backgroundColor: '#FFF',

    padding: 16,
    borderRadius: 20,

    borderWidth: 1,
    borderColor: COLORS.border,

    width: 130,

    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,

    elevation: 2,
  },

  envLabel: {
    fontSize: 10,
    fontWeight: '800',

    color: COLORS.subtext,

    marginTop: 8,
    marginBottom: 4,
  },

  envInput: {
    fontSize: 20,
    fontWeight: '800',

    color: COLORS.text,

    textAlign: 'center',
    width: '100%',
  },

});
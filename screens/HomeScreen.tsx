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
import { useGLTF, Html, Stage, OrbitControls } from '@react-three/drei';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { COLORS } from '../theme/colors';

function HealthModel({ 
    heartRate, setHeartRate, spo2, setSpo2, temp, setTemp, bp, setBp, 
    smoke, setSmoke, roomTemp, setRoomTemp, humidity, setHumidity 
  }: any) {
    const asset = Asset.fromModule(require('../assets/human_body.glb')); 
    const { scene } = useGLTF(asset.uri) as any;
    const [hoveredId, setHoveredId] = useState<string | null>(null);
  
    const getDynamicStyle = (id: string, baseStyle: any) => [
      baseStyle,
      hoveredId === id && {
        borderColor: COLORS.primary,
        borderWidth: 2,
        transform: [{ scale: 1.1 }], 
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
      }
    ];
  
    return (
      <group>
        <primitive object={scene} scale={2} position={[0, -1.5, 0]} />
  
        {/* Heart Rate */}
        <mesh position={[0.15, 0.6, 0.25]} onPointerOver={() => setHoveredId('hr')} onPointerOut={() => setHoveredId(null)}>
          <Html distanceFactor={8} center>
            <Ionicons name="heart" size={24} color={hoveredId === 'hr' ? '#FF0000' : COLORS.primary} />
          </Html>
          <Html distanceFactor={8} position={[1.4, 0, 0]} pointerEvents="auto">
            <View style={styles.calloutWrapper}>
              <View style={styles.line} />
              <View style={getDynamicStyle('hr', styles.floatingInputCard)}>
                <Text style={styles.floatingLabel}>HEART RATE</Text>
                <TextInput value={heartRate} onChangeText={setHeartRate} placeholder="72" style={styles.floatingInput} keyboardType="numeric" />
              </View>
            </View>
          </Html>
        </mesh>
  
        {/* SpO2 */}
        <mesh position={[-1.2, 0.4, 0.1]} onPointerOver={() => setHoveredId('spo2')} onPointerOut={() => setHoveredId(null)}>
          <Html distanceFactor={8} position={[-1.5, 0, 0]} pointerEvents="auto">
            <View style={[styles.calloutWrapper, { flexDirection: 'row-reverse' }]}>
              <View style={styles.line} />
              <View style={getDynamicStyle('spo2', styles.floatingInputCard)}>
                <Text style={styles.floatingLabel}>SpO2 %</Text>
                <TextInput value={spo2} onChangeText={setSpo2} placeholder="98" style={styles.floatingInput} keyboardType="numeric" />
              </View>
            </View>
          </Html>
        </mesh>
  
        {/* Body Temp */}
        <mesh position={[0, 1.4, 0.15]} onPointerOver={() => setHoveredId('temp')} onPointerOut={() => setHoveredId(null)}>
          <Html distanceFactor={8} position={[1.5, 0.4, 0]} pointerEvents="auto">
            <View style={styles.calloutWrapper}>
              <View style={styles.line} />
              <View style={getDynamicStyle('temp', styles.floatingInputCard)}>
                <Text style={styles.floatingLabel}>BODY TEMP</Text>
                <TextInput value={temp} onChangeText={setTemp} placeholder="36.8" style={styles.floatingInput} keyboardType="numeric" />
              </View>
            </View>
          </Html>
        </mesh>
  
        {/* Blood Pressure */}
        <mesh position={[0.7, 0.3, 0.15]} onPointerOver={() => setHoveredId('bp')} onPointerOut={() => setHoveredId(null)}>
          <Html distanceFactor={8} position={[1.3, -0.5, 0]} pointerEvents="auto">
            <View style={styles.calloutWrapper}>
              <View style={styles.line} />
              <View style={getDynamicStyle('bp', styles.floatingInputCard)}>
                <Text style={styles.floatingLabel}>BP mmHg</Text>
                <TextInput value={bp} onChangeText={setBp} placeholder="120/80" style={styles.floatingInput} />
              </View>
            </View>
          </Html>
        </mesh>
  
        {/* Environmental Sensors - Smoke */}
        <mesh position={[-3.5, 1.5, 0]} onPointerOver={() => setHoveredId('smoke')} onPointerOut={() => setHoveredId(null)}>
          <Html distanceFactor={8} pointerEvents="auto">
            <View style={getDynamicStyle('smoke', styles.envCard)}>
              <MaterialCommunityIcons name="smoke-detector" size={24} color={COLORS.primary} />
              <Text style={styles.envLabel}>SMOKE LEVEL</Text>
              <TextInput value={smoke} onChangeText={setSmoke} placeholder="0.02" style={styles.envInput} keyboardType="numeric" />
            </View>
          </Html>
        </mesh>
  
        {/* Environmental Sensors - Humidity (Restored) */}
        <mesh position={[-3.5, 0.5, 0]} onPointerOver={() => setHoveredId('humidity')} onPointerOut={() => setHoveredId(null)}>
          <Html distanceFactor={8} pointerEvents="auto">
            <View style={getDynamicStyle('humidity', styles.envCard)}>
              <Ionicons name="water" size={24} color={COLORS.primary} />
              <Text style={styles.envLabel}>HUMIDITY %</Text>
              <TextInput value={humidity} onChangeText={setHumidity} placeholder="45" style={styles.envInput} keyboardType="numeric" />
            </View>
          </Html>
        </mesh>
  
        {/* Environmental Sensors - Room Temp (Restored) */}
        <mesh position={[-3.5, -0.5, 0]} onPointerOver={() => setHoveredId('room')} onPointerOut={() => setHoveredId(null)}>
          <Html distanceFactor={8} pointerEvents="auto">
            <View style={getDynamicStyle('room', styles.envCard)}>
              <Ionicons name="thermometer" size={24} color={COLORS.primary} />
              <Text style={styles.envLabel}>ROOM TEMP</Text>
              <TextInput value={roomTemp} onChangeText={setRoomTemp} placeholder="24.5" style={styles.envInput} keyboardType="numeric" />
            </View>
          </Html>
        </mesh>
      </group>
    );
  }

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [heartRate, setHeartRate] = useState('');
  const [spo2, setSpo2] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [smoke, setSmoke] = useState('');
  const [roomTemp, setRoomTemp] = useState('');
  const [humidity, setHumidity] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HEALTH CONSOLE</Text>
        <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('History')}>
          <Ionicons name="time-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
          <Suspense fallback={<Html center><ActivityIndicator color={COLORS.primary} /></Html>}>
            <Stage environment="city" intensity={0.5}>
              <HealthModel
                heartRate={heartRate} setHeartRate={setHeartRate}
                spo2={spo2} setSpo2={setSpo2}
                temp={temperature} setTemp={setTemperature}
                bp={bloodPressure} setBp={setBloodPressure}
                smoke={smoke} setSmoke={setSmoke}
                roomTemp={roomTemp} setRoomTemp={setRoomTemp}
                humidity={humidity} setHumidity={setHumidity}
              />
            </Stage>
          </Suspense>
          <OrbitControls enableZoom={false} enableRotate={false} makeDefault />
        </Canvas>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate('Result', { // Navigation target fixed
              vitals: {
                heartRate: heartRate || '72',
                spo2: spo2 || '98',
                temperature: temperature || '36.6',
                bloodPressure: bloodPressure || '120/80',
                smoke,
                roomTemp,
                humidity,
              },
            })
          }
        >
          <Text style={styles.buttonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: '#FFFFFF' 
    },
    header: { 
      padding: 24, 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    },
    title: { 
      fontSize: 26, 
      fontWeight: '800', 
      color: COLORS.text 
    },
    historyButton: { 
      width: 50, 
      height: 50, 
      borderRadius: 15, 
      backgroundColor: COLORS.primarySoft, 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    canvasContainer: { 
      flex: 1, 
      minHeight: Platform.OS === 'web' ? 600 : undefined 
    },
    footer: { 
      padding: 24, 
      position: 'absolute', 
      bottom: 0, 
      width: '100%' 
    },
    primaryButton: { 
      backgroundColor: COLORS.primary, 
      padding: 20, 
      borderRadius: 20, 
      alignItems: 'center' 
    },
    buttonText: { 
      color: '#FFF', 
      fontSize: 18, 
      fontWeight: '800' 
    },
    calloutWrapper: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      width: 220 
    },
    line: { 
      width: 50, 
      height: 2, 
      backgroundColor: '#FF0000' 
    },
    floatingInputCard: { 
      backgroundColor: '#FFF', 
      padding: 12, 
      borderRadius: 16, 
      borderWidth: 1, 
      borderColor: COLORS.border, 
      width: 120 
    },
    floatingLabel: { 
      fontSize: 9, 
      fontWeight: '800', 
      color: COLORS.subtext, 
      marginBottom: 4 
    },
    floatingInput: { 
      fontSize: 18, 
      fontWeight: '800', 
      color: COLORS.text, 
      padding: 0 
    },
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
      marginBottom: 4 
    },
    envInput: { 
      fontSize: 20, 
      fontWeight: '800', 
      color: COLORS.text, 
      textAlign: 'center', 
      width: '100%' 
    }
  });
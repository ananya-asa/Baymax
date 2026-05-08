import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const MEDICAL_RED = '#D32F2F';
const { width, height } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(380, width * 0.86);

type Message = {
  id: string;
  text: string;
  sender: 'ai' | 'user';
};

export default function ChatScreen() {
  const navigation = useNavigation<any>();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello. I am Baymax, your personal healthcare companion. How can I help you navigate your data today?',
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');

  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH + 40)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, backdropAnim]);

  const closePanel = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: PANEL_WIDTH + 40,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
    });
  };

  const getBotReply = (userInput: string) => {
    const text = userInput.trim().toLowerCase();

    if (text === 'hi' || text === 'hello' || text === 'hey' || text === 'hii') {
      return 'Hello 👋 I am Baymax. I can help with history, profile, reports, and basic health navigation.';
    }

    if (text.includes('history')) {
      return 'Opening your Secure Data Node history now...';
    }

    if (text.includes('profile')) {
      return 'Taking you to your profile now.';
    }

    if (text.includes('report')) {
      return 'You can generate a health report from the main dashboard using the Generate Report button.';
    }

    if (text.includes('help')) {
      return "Try saying: 'hi', 'show history', 'open profile', or 'generate report'.";
    }

    return "I'm monitoring your request. You can say 'Show History' or 'Check Profile'.";
  };

  const handleBotAction = (userInput: string) => {
    const text = userInput.trim().toLowerCase();

    if (text.includes('history')) {
      closePanel();
      setTimeout(() => {
        navigation.navigate('History');
      }, 240);
      return;
    }

    if (text.includes('profile')) {
      closePanel();
      setTimeout(() => {
        navigation.navigate('Profile');
      }, 240);
      return;
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const currentInput = input.trim();

    const userMsg: Message = {
      id: Date.now().toString(),
      text: currentInput,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const botResponse = getBotReply(currentInput);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'ai',
      };

      setMessages(prev => [...prev, aiMsg]);
      handleBotAction(currentInput);
    }, 700);
  };

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <View style={styles.root}>
      <TouchableWithoutFeedback onPress={closePanel}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          style={styles.container}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.botIconWrap}>
                <Ionicons name="medical" size={18} color="#FFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>BAYMAX ASSIST</Text>
                <Text style={styles.headerSub}>Healthcare companion</Text>
              </View>
            </View>

            <TouchableOpacity onPress={closePanel} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={MEDICAL_RED} />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.row,
                  item.sender === 'user' ? styles.userRow : styles.aiRow,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    item.sender === 'user' ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      item.sender === 'user' ? styles.userText : styles.aiText,
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
          />

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => setInput('hi')}
            >
              <Text style={styles.quickChipText}>Hi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => setInput('show history')}
            >
              <Text style={styles.quickChipText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => setInput('open profile')}
            >
              <Text style={styles.quickChipText}>Profile</Text>
            </TouchableOpacity>
          </View>

          {/* INPUT AREA */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your vitals..."
              placeholderTextColor="#9E9E9E"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Ionicons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  backdrop: {
    position: 'absolute',
    width,
    height,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },

  panel: {
    position: 'absolute',
    right: 0,
    top: Platform.OS === 'ios' ? 45 : 20,
    bottom: Platform.OS === 'ios' ? 20 : 10,
    width: PANEL_WIDTH,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 16,
    overflow: 'hidden',
  },

  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },

  header: {
    backgroundColor: '#FFF5F5',
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1D9D9',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  botIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MEDICAL_RED,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  headerTitle: {
    color: '#212121',
    fontWeight: '900',
    letterSpacing: 1.2,
    fontSize: 14,
  },

  headerSub: {
    color: '#757575',
    fontSize: 12,
    marginTop: 2,
  },

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F3D2D2',
  },

  chatList: {
    padding: 16,
    paddingBottom: 8,
  },

  row: {
    marginBottom: 12,
    flexDirection: 'row',
  },

  userRow: {
    justifyContent: 'flex-end',
  },

  aiRow: {
    justifyContent: 'flex-start',
  },

  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    maxWidth: '84%',
  },

  userBubble: {
    backgroundColor: MEDICAL_RED,
    borderBottomRightRadius: 4,
  },

  aiBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },

  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },

  userText: {
    color: '#FFF',
    fontWeight: '600',
  },

  aiText: {
    color: '#212121',
  },

  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },

  quickChip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0D0D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },

  quickChipText: {
    color: MEDICAL_RED,
    fontSize: 12,
    fontWeight: '700',
  },

  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },

  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 18,
    height: 48,
    marginRight: 10,
    color: '#212121',
  },

  sendBtn: {
    backgroundColor: MEDICAL_RED,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
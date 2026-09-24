import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Keyboard,
  Modal,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useSpeechToText } from 'react-native-turbo-stt';

import { useApp } from '../contexts/AppContext';
import { useAlert } from '../contexts/AlertContext';
import firebaseService from '../services/firebaseService';
import analyticsService from '../services/analyticsService';
import { SCENARIOS, LANGUAGES, getScenarioGreeting } from '../constants/scenarios';
import { CAFE_MENUS } from '../constants/cafeMenus';
import { RESTAURANT_MENUS } from '../constants/restaurantMenus';
import MenuViewer from '../components/MenuViewer';
// UNIFIED MODAL
import PremiumLimitModal from '../components/PremiumLimitModal';
import ConversationLimitModal from '../components/ConversationLimitModal';
import voiceService from '../services/voiceService';
import rewardedAdService from '../services/rewardedAdService';
import { getBackgroundForScenario } from '../constants/backgrounds';
import Haptics from '../utils/haptics';
import Logger from '../utils/logger';
import { useTheme } from '../contexts/ThemeContext';

const ChatLogger = Logger.withCategory('CHAT');

const getScenarioTheme = (scenarioId, isDarkMode) => {
  const id = scenarioId ? scenarioId.toUpperCase() : 'DEFAULT';
  const defaultTheme = {
    gradient: ['#6A11CB', '#2575FC'],
    bg: isDarkMode ? '#121212' : '#F3F4F6',
    primary: '#6A11CB',
    bubbleUser: '#6A11CB',
    textUser: '#FFF'
  };

  const themes = {
    'CAFE': {
      gradient: ['#D38312', '#A83279'],
      bg: isDarkMode ? '#1A1A1A' : '#FFF8F0',
      primary: '#D38312',
      bubbleUser: '#D38312',
      textUser: '#FFF'
    },
    'RESTAURANT': {
      gradient: ['#11998e', '#38ef7d'],
      bg: isDarkMode ? '#0F1F15' : '#F0FFF4',
      primary: '#11998e',
      bubbleUser: '#11998e',
      textUser: '#FFF'
    },
    'SHOPPING': {
      gradient: ['#FF512F', '#DD2476'],
      bg: isDarkMode ? '#1F1015' : '#FFF0F5',
      primary: '#DD2476',
      bubbleUser: '#DD2476',
      textUser: '#FFF'
    },
    'DOCTOR': {
      gradient: ['#1A2980', '#26D0CE'],
      bg: isDarkMode ? '#0F1520' : '#F0F8FF',
      primary: '#1A2980',
      bubbleUser: '#1A2980',
      textUser: '#FFF'
    },
  };

  const themeKey = Object.keys(themes).find(key => id.includes(key)) || 'DEFAULT';
  return themes[themeKey] || defaultTheme;
};

const ChatScreen = ({ route, navigation }) => {
  const params = route.params || {};
  let { scenarioId, language, conversationId: existingConversationId } = params;

  if (!scenarioId && params.scenario && params.scenario.id) {
    scenarioId = params.scenario.id;
  }

  if (language && typeof language === 'string') {
    const foundLang = Object.values(LANGUAGES).find(l => l.code === language);
    language = foundLang || { code: language, name: language, flag: '🏳️' };
  }

  const scenario = SCENARIOS[scenarioId?.toUpperCase()] || params.scenario;
  const { colors, isDarkMode } = useTheme();
  const theme = getScenarioTheme(scenario?.id, isDarkMode);

  // All hooks must be called unconditionally (Rules of Hooks)
  const {
    user,
    userProfile,
    incrementUsage,
    updateStreak,
    isPro,
    earnExtraChats } = useApp();
  const { showAlert } = useAlert();
  const {
    start: startSTT,
    stop: stopSTT,
    result: sttResult,
    error: sttError,
    isListening: sttListening
  } = useSpeechToText();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(existingConversationId || null);

  const correctionMode = userProfile?.correctionMode ?? true;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // UNIFIED MODAL STATE
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitModalMode, setLimitModalMode] = useState('CHAT'); // 'CHAT' or 'VOICE'

  const [showConversationLimitModal, setShowConversationLimitModal] = useState(false);
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  const [chatAdsWatchedToday, setChatAdsWatchedToday] = useState(0);
  const [voiceTriesFromAds, setVoiceTriesFromAds] = useState(0);
  const [, setBackgroundError] = useState(false);

  // Roast Mode Warning Modal
  const [showRoastWarning, setShowRoastWarning] = useState(false);
  const isRoastMode = scenario?.id === 'roast_mode';

  const isVoiceInput = useRef(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const MAX_VOICE_ADS_PER_DAY = 3;
  const MAX_CHAT_ADS_PER_DAY = 5;
  const BASE_FREE_MESSAGES = 10;
  const PRO_MESSAGE_LIMIT = 50;

  const [messageLimit, setMessageLimit] = useState(isPro() ? PRO_MESSAGE_LIMIT : BASE_FREE_MESSAGES);
  const [hasExtendedConversation, setHasExtendedConversation] = useState(false);
  const [conversationStartTime, setConversationStartTime] = useState(Date.now());

  const userMessageCount = messages.filter(m => m.role === 'user').length;

  const scenarioData = scenario ? SCENARIOS[scenario.id.toUpperCase()] : null;
  const hasMenu = scenarioData?.hasMenu || false;
  const menuType = scenarioData?.menuType || null;

  // Check if we have valid scenario and language
  const isValidSetup = !!(scenario && language);

  // Handle invalid setup - redirect back
  useEffect(() => {
    if (!isValidSetup) {
      Logger.error('ChatScreen: Missing scenario or language', { scenarioId, language, params });
      setTimeout(() => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('Home');
      }, 100);
    }
  }, [isValidSetup, navigation, scenarioId, language, params]);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback((animated = true) => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated });
      }, 100);
    }
  }, [messages.length]);

  const isInitialized = useRef(false);

  // Main initialization effect
  useEffect(() => {
    if (!isValidSetup) return; // Skip if invalid setup

    // Prevent double initialization (React Strict Mode, re-renders)
    if (isInitialized.current) return;
    isInitialized.current = true;

    if (user?.uid) {
      Logger.setUserId(user.uid);
      Logger.setAttributes({
        scenario: scenario?.id,
        language: language?.code,
        isPro: isPro() ? 'true' : 'false'
      });
    }

    Logger.breadcrumb('Chat session started', {
      scenario: scenario?.name,
      language: language?.code,
      isExisting: !!existingConversationId
    });

    if (existingConversationId) {
      loadExistingConversation(existingConversationId);
    } else {
      initializeConversation();
      addWelcomeMessage();
    }
    loadAdWatchData();

    // Show roast mode warning on first entry
    if (isRoastMode) {
      setShowRoastWarning(true);
    }

    return () => {
      Logger.breadcrumb('Chat session ended', { messageCount: messages.length });
      voiceService.stopSpeaking();

      // Extract vocabulary if user had at least 3 messages in the conversation
      const userMsgCount = messages.filter(m => m.role === 'user').length;
      if (user?.uid && conversationId && userMsgCount >= 3) {
        Logger.info('[VOCAB] Extracting vocabulary from conversation', {
          conversationId,
          userMsgCount,
          language: language?.code
        });
        analyticsService.extractVocabulary(
          user.uid,
          conversationId,
          messages,
          language?.code || 'es',
          userProfile?.nativeLanguage || 'en'
        ).then(result => {
          if (result?.success) {
            Logger.info('[VOCAB] Vocabulary extracted successfully', { wordsAdded: result.wordsAdded });
          }
        }).catch(err => Logger.error('[VOCAB] Vocabulary extraction failed', err));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidSetup]);

  useEffect(() => {
    if (sttResult) setInputText(sttResult.text);
  }, [sttResult]);

  useEffect(() => {
    if (sttError) {
      if (sttError.message === 'Client side error') return;
      showAlert(sttError.code === 'NO_MATCH' ? 'Microphone Issue' : 'Speech Error', sttError.code === 'NO_MATCH' ? 'No speech detected.' : sttError.message);
    }
  }, [sttError]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, scrollToBottom]);

  // Handle keyboard show for proper scrolling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => scrollToBottom(true), 150);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, [scrollToBottom]);

  // Early return for invalid setup AFTER all hooks
  if (!isValidSetup) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }


  const loadAdWatchData = async () => {
    try {
      // Use UTC date for consistent global timing
      const todayUTC = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in UTC
      const storedDate = await AsyncStorage.getItem('adWatchDate');
      const storedAds = await AsyncStorage.getItem('adsWatchedToday');
      const storedChatAds = await AsyncStorage.getItem('chatAdsWatchedToday');
      const storedTries = await AsyncStorage.getItem('voiceTriesFromAds');

      if (storedDate === todayUTC) {
        setAdsWatchedToday(parseInt(storedAds) || 0);
        setChatAdsWatchedToday(parseInt(storedChatAds) || 0);
        setVoiceTriesFromAds(parseInt(storedTries) || 0);
      } else {
        setAdsWatchedToday(0);
        setChatAdsWatchedToday(0);
        setVoiceTriesFromAds(0);
        await AsyncStorage.setItem('adWatchDate', todayUTC);
        await AsyncStorage.setItem('adsWatchedToday', '0');
        await AsyncStorage.setItem('chatAdsWatchedToday', '0');
        await AsyncStorage.setItem('voiceTriesFromAds', '0');
      }
    } catch (error) {
      Logger.error('Error loading ad data', error);
    }
  };

  const loadExistingConversation = async (convId) => {
    try {
      const existingMessages = await firebaseService.getConversationMessages(convId);

      // Filter out system messages
      const filteredMessages = existingMessages
        .filter(m =>
          m.role !== 'system' &&
          !m.isSystemRequest &&
          !m.content?.includes('The interview is complete. Please provide') &&
          !m.content?.includes('Das Interview ist beendet. Bitte gib mir')
        )
        // Sort by order field if available (for interviews), otherwise by timestamp
        .sort((a, b) => {
          // Use order field if both messages have it (interview messages)
          if (typeof a.order === 'number' && typeof b.order === 'number') {
            return a.order - b.order;
          }
          // Fallback to timestamp sorting
          const timeA = a.timestamp?.toMillis?.() || new Date(a.timestamp).getTime() || 0;
          const timeB = b.timestamp?.toMillis?.() || new Date(b.timestamp).getTime() || 0;
          return timeA - timeB;
        })
        // Ensure unique IDs by adding index suffix if needed
        .map((msg, index) => ({
          ...msg,
          id: msg.id ? `${msg.id}_${index}` : `msg_${index}_${Date.now()}`
        }));

      // Always ensure greeting message is present at the start
      const welcomeText = getScenarioGreeting(scenario.id, language.code);
      const greetingMessage = {
        id: 'greeting_0',
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date(0) // Very old timestamp to ensure it's first
      };

      // Check if first message is already a greeting (from assistant)
      // For interviews, welcomeText will be empty so hasGreeting will effectively check if first message is from assistant
      const hasGreeting = filteredMessages.length > 0 &&
        filteredMessages[0].role === 'assistant' &&
        (welcomeText === '' || filteredMessages[0].content?.includes(welcomeText.split(' ')[0]));

      const finalMessages = hasGreeting ? filteredMessages : [greetingMessage, ...filteredMessages];
      setMessages(finalMessages);

      if (existingMessages.length > 0 && existingMessages[0].timestamp) {
        const firstMessageTime = existingMessages[0].timestamp instanceof Date
          ? existingMessages[0].timestamp.getTime()
          : existingMessages[0].timestamp?.toMillis?.() || Date.now();
        setConversationStartTime(firstMessageTime);
      }

      const userMsgCount = existingMessages.filter(m => m.role === 'user').length;

      if (userMsgCount > BASE_FREE_MESSAGES) {
        setHasExtendedConversation(true);
        setMessageLimit(15);
      } else if (userMsgCount === BASE_FREE_MESSAGES) {
        setHasExtendedConversation(false);
        setMessageLimit(BASE_FREE_MESSAGES);
      }
    } catch (error) {
      Logger.error('Failed to load conversation:', error);
      showAlert('Error', 'Failed to load conversation');
    }
  };

  const initializeConversation = async () => {
    try {
      const convId = await firebaseService.createConversation(
        user.uid,
        scenario.id,
        language.code
      );
      setConversationId(convId);
      await incrementUsage();
      await updateStreak();
      analyticsService.trackScenarioStart(user.uid, scenario.id, language.code);
    } catch (error) {
      Logger.error('Init conv error', error);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeText = getScenarioGreeting(scenario.id, language.code);
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeText,
      timestamp: new Date()
    }]);
  };

  const speakAIResponse = async (text, force = false) => {
    // Play TTS if enabled
    if (userProfile?.autoTTS !== false) {
      setIsSpeaking(true);
      await voiceService.speak(text, userProfile?.voicePreference);
      setIsSpeaking(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Check limits
    const currentLimit = isPro() ? PRO_MESSAGE_LIMIT : messageLimit;

    if (userMessageCount >= currentLimit) {
      if (isPro()) {
        showAlert('Session Limit Reached', 'You have reached the maximum of 50 messages for this session. Please start a new chat.');
      } else {
        if (hasExtendedConversation) {
          setShowConversationLimitModal(true);
        } else {
          // Trigger generic limit modal in CHAT mode
          setLimitModalMode('CHAT');
          setLimitModalVisible(true);
        }
      }
      return;
    }

    const shouldSpeakResponse = isVoiceInput.current;
    const userMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
      isVoice: shouldSpeakResponse // Capture if this was a voice input
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    if (inputRef.current) inputRef.current.clear();

    setLoading(true);
    isVoiceInput.current = false;

    try {
      if (conversationId) {
        await firebaseService.addMessage(conversationId, 'user', userMessage.content, { isVoice: userMessage.isVoice });
      }

      let menuData = null;
      if (hasMenu) {
        if (menuType === 'cafe') menuData = CAFE_MENUS[language.code];
        else if (menuType === 'restaurant') menuData = RESTAURANT_MENUS[language.code];
      }

      const rawScenarioPrompt = SCENARIOS[scenario.id.toUpperCase()].systemPrompt(language.name);
      const systemPrompt = buildSystemPrompt(rawScenarioPrompt, language.name, correctionMode, menuData);

      const history = messages.map(msg => ({ role: msg.role, content: msg.content }));
      history.push({ role: 'user', content: userMessage.content });
      const truncatedHistory = truncateContext(history);

      const apiMessages = [{ role: 'system', content: systemPrompt }, ...truncatedHistory];
      const model = isPro() ? 'gpt-4o' : 'gpt-3.5-turbo';

      const response = await axios.post(
        `${BACKEND_URL}/api/chat`,
        { messages: apiMessages, model: model },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-client-secret': APP_CLIENT_SECRET
          },
          timeout: 30000
        }
      );

      const aiContent = response.data?.choices?.[0]?.message?.content;
      if (!aiContent) {
        throw new Error('Chat service returned an invalid response');
      }

      // Trigger TTS immediately if voice input was used
      if (shouldSpeakResponse) {
        speakAIResponse(aiContent, true);
      }

      const aiMessage = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        isVoice: shouldSpeakResponse // Mark AI response as voice if triggered by voice
      };

      setMessages(prev => [...prev, aiMessage]);

      if (conversationId) {
        await firebaseService.addMessage(conversationId, 'assistant', aiMessage.content, { isVoice: aiMessage.isVoice });
      }
    } catch (error) {
      Logger.error('Send error:', error);
      let errorMessage = 'Failed to send message.';
      if (error.response) {
        const upstreamDetails = String(error.response.data?.details || '');
        if (error.response.status === 429 || upstreamDetails.includes('429')) {
          errorMessage = 'The chat service is temporarily unavailable. Please try again later.';
        } else if (error.response.status >= 500) {
          errorMessage = 'The chat service is temporarily unavailable. Please try again later.';
        } else {
          errorMessage = `Request failed (${error.response.status}). Please try again.`;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.';
      }
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const permission = Platform.OS === 'android' ? PERMISSIONS.ANDROID.RECORD_AUDIO : PERMISSIONS.IOS.MICROPHONE;
      const checkResult = await check(permission);
      if (checkResult === RESULTS.GRANTED) return true;
      if (checkResult === RESULTS.BLOCKED) {
        showAlert('Permission Blocked', 'Enable Microphone in Settings.', [{ text: 'OK' }]);
        return false;
      }
      const requestResult = await request(permission);
      if (requestResult === RESULTS.GRANTED) return true;
      showAlert('Permission Denied', 'Microphone required.', [{ text: 'OK' }]);
      return false;
    } catch (err) {
      showAlert('Error', 'Permission error: ' + err.message);
      return false;
    }
  };

  const startRecording = async () => {
    if (!isPro() && voiceTriesFromAds <= 0) {
      setLimitModalMode('VOICE');
      setLimitModalVisible(true);
      return;
    }
    if (!isPro() && voiceTriesFromAds > 0) {
      setVoiceTriesFromAds(prev => {
        const val = prev - 1;
        AsyncStorage.setItem('voiceTriesFromAds', val.toString());
        return val;
      });
    }

    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;

      const getLocaleCode = (langName) => {
        const map = { 'English': 'en-US', 'Turkish': 'tr-TR', 'Spanish': 'es-ES', 'French': 'fr-FR', 'German': 'de-DE' };
        return map[langName] || 'en-US';
      };

      isVoiceInput.current = true;
      await startSTT(getLocaleCode(language.name));
    } catch (error) {
      showAlert('Error', 'Recording failed: ' + error.message);
    }
  };

  const stopRecording = async () => {
    try {
      if (sttListening) await stopSTT();
    } catch (error) {
      Logger.error('Stop recording error:', error);
    }
  };

  const handleMenuItemSelect = (itemName) => setInputText(itemName);

  const handleUpgrade = () => {
    setLimitModalVisible(false);
    navigation.navigate('Subscription');
  };

  // Unified Ad Handler
  const handleUnifiedWatchAd = async () => {
    // Map modal mode to ad type
    let type = 'CHAT';
    if (limitModalMode === 'VOICE') type = 'VOICE';
    if (limitModalMode === 'VOICE_REPLAY') type = 'VOICE_REPLAY';

    try {
      const success = await rewardedAdService.showAd(type, () => {
        if (type === 'VOICE' || type === 'VOICE_REPLAY') {
          setVoiceTriesFromAds(prev => {
            const v = prev + 1;
            AsyncStorage.setItem('voiceTriesFromAds', v.toString());
            return v;
          });
          setAdsWatchedToday(prev => {
            const v = prev + 1;
            AsyncStorage.setItem('adsWatchedToday', v.toString());
            return v;
          });
          showAlert('Voice Try Earned!', 'You can now use voice practice!');
        } else {
          // Chat extension logic
          earnExtraChats(1); // or whatever logic you prefer for general chat ad
          setMessageLimit(prev => prev + 5); // Extend current chat
          setHasExtendedConversation(true);
          setChatAdsWatchedToday(prev => {
            const v = prev + 1;
            AsyncStorage.setItem('chatAdsWatchedToday', v.toString());
            return v;
          });
          showAlert('Extended!', 'You can now send 5 more messages!');
        }
        setLimitModalVisible(false);
      }, () => { }, () => showAlert('Ad Error', 'Ad not available.'));

      if (!success) showAlert('Loading', 'Please wait for ad to load.');
    } catch (e) {
      Logger.error(e);
    }
  };

  // Logic Helpers
  const truncateContext = (messages, maxContext = 6) => {
    if (messages.length <= maxContext) return messages;
    return messages.slice(-maxContext);
  };

  const handleVoiceReplay = (text) => {
    if (isPro()) {
      speakAIResponse(text);
      return;
    }

    if (voiceTriesFromAds > 0) {
      setVoiceTriesFromAds(prev => {
        const val = prev - 1;
        AsyncStorage.setItem('voiceTriesFromAds', val.toString());
        return val;
      });
      speakAIResponse(text);
    } else {
      showAlert(
        'Unlock Voice Replay',
        'Watch a short ad to listen to this message again?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Watch Ad',
            onPress: async () => {
              let rewardEarned = false;
              const success = await rewardedAdService.showAd('VOICE_REPLAY', () => {
                rewardEarned = true;
                setVoiceTriesFromAds(prev => {
                  const v = prev + 1;
                  AsyncStorage.setItem('voiceTriesFromAds', v.toString());
                  return v;
                });
                setAdsWatchedToday(prev => {
                  const v = prev + 1;
                  AsyncStorage.setItem('adsWatchedToday', v.toString());
                  return v;
                });
                showAlert('Success!', 'You can now listen to the message.');
              }, () => {
                // Only play if reward was earned
                if (rewardEarned) {
                  speakAIResponse(text);
                }
              }, () => showAlert('Ad Error', 'Ad not available.'));

              if (!success) showAlert('Loading', 'Please wait for ad to load.');
            }
          }
        ]
      );
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    const isCorrection = item.content.startsWith('✅ Correction:');
    const contentParts = item.content.split('✅ Correction:');
    const mainContent = isCorrection ? contentParts[0].trim() : item.content;
    const correctionContent = isCorrection ? contentParts[1]?.trim() : null;

    return (
      <View style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
        paddingHorizontal: 16,
      }}>
        <View style={[
          styles.bubbleBase,
          isUser ? [styles.bubbleUser, { backgroundColor: theme.bubbleUser }] : [styles.bubbleAi, { backgroundColor: colors.surface, borderColor: colors.border }]
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Text style={[styles.textBase, isUser ? styles.textUser : [styles.textAi, { color: colors.text }]]}>
              {mainContent}{' '}
            </Text>
            {/* Show speaker icon ONLY if the message is marked as voice (User or AI) */}
            {item.isVoice && (
              <TouchableOpacity
                onPress={() => handleVoiceReplay(mainContent)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ marginLeft: 4, marginBottom: 2 }}
              >
                <Icon name="volume-high" size={16} color={isUser ? 'rgba(255,255,255,0.7)' : colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {correctionContent && (
            <View style={styles.correctionBox}>
              <Text style={styles.correctionText}>✅ {correctionContent}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const backgroundData = getBackgroundForScenario(scenario?.id || 'DEFAULT');
  const isImageBackground = backgroundData?.type === 'image';
  const overlayColor = isImageBackground
    ? (isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.35)')
    : (isDarkMode ? 'rgba(18, 18, 18, 0.85)' : 'rgba(243, 244, 246, 0.65)');

  const mainContent = (
    <View style={{ flex: 1, backgroundColor: overlayColor }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => { Haptics.light(); navigation.goBack(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>{scenario.icon} {scenario.name}</Text>
              <Text style={styles.headerSubtitle}>{language.flag} {language.name}</Text>
            </View>
            <View style={styles.headerButtons}>
              {hasMenu && (
                <TouchableOpacity style={styles.iconActionButton} onPress={() => { Haptics.light(); setMenuVisible(true); }}>
                  <Icon name="restaurant-outline" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          extraData={messages.length}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() => scrollToBottom(true)}
          onLayout={() => scrollToBottom(false)}
          removeClippedSubviews={false}
        />

        {(loading || isSpeaking) && (
          <View style={[styles.statusContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {loading && <ActivityIndicator size="small" color={theme.primary} />}
            {loading && <Text style={{ color: theme.primary, fontSize: 12, marginLeft: 6 }}>Thinking...</Text>}
            {isSpeaking && <ActivityIndicator size="small" color="#00C853" style={{ marginLeft: 10 }} />}
            {isSpeaking && <Text style={{ color: '#00C853', fontSize: 12, marginLeft: 6 }}>Speaking...</Text>}
          </View>
        )}

        {/* Hide input for Interview History */}
        {!(scenario?.id === 'INTERVIEW' && existingConversationId) && (
          <View style={styles.floatingInputWrapper}>
            <Text style={{ textAlign: 'center', fontSize: 11, color: '#888', marginBottom: 6, fontWeight: '500' }}>Messages: {userMessageCount}/{messageLimit}</Text>
            <View style={[styles.floatingInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.micButton, { backgroundColor: sttListening ? '#FF3B30' : theme.primary }, sttListening && { transform: [{ scale: 1.1 }] }]}
                onPressIn={() => { Haptics.medium(); startRecording(); }}
                onPressOut={stopRecording}
              >
                <Icon name={sttListening ? "mic" : "mic-outline"} size={24} color="#FFF" />
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                style={[styles.floatingInput, { color: colors.text }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={sttListening ? "Listening..." : "Text or tap to speak..."}
                placeholderTextColor={colors.textSecondary}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#F5F5F5' }, { opacity: !inputText.trim() ? 0.5 : 1 }]}
                onPress={() => { Haptics.light(); handleSend(); }}
                disabled={!inputText.trim()}
              >
                <Icon name="send" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* --- UNIFIED MODAL --- */}
      <PremiumLimitModal
        visible={limitModalVisible}
        mode={limitModalMode}
        onClose={() => setLimitModalVisible(false)}
        onWatchAd={handleUnifiedWatchAd}
        onUpgrade={handleUpgrade}
        adsWatchedToday={limitModalMode === 'VOICE' ? adsWatchedToday : chatAdsWatchedToday}
        maxAdsPerDay={limitModalMode === 'VOICE' ? MAX_VOICE_ADS_PER_DAY : MAX_CHAT_ADS_PER_DAY}
      />

      {hasMenu && (
        <MenuViewer
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          menuType={menuType}
          language={language}
          onSelectItem={handleMenuItemSelect}
        />
      )}

      {/* Legacy modal for completion summary */}
      <ConversationLimitModal
        visible={showConversationLimitModal}
        onClose={() => {
          setShowConversationLimitModal(false);
          if (userMessageCount < BASE_FREE_MESSAGES) {
            setTimeout(() => navigation.goBack(), 300);
          }
        }}
        onNewChat={async () => {
          setShowConversationLimitModal(false);
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }, 500);
        }}
        onUpgrade={handleUpgrade}
        messageCount={messageLimit}
      />

      {/* Roast Mode Warning Modal */}
      <Modal
        visible={showRoastWarning}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRoastWarning(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.75)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 28,
            width: '90%',
            maxWidth: 340,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#FF512F',
          }}>
            <LinearGradient
              colors={['#FF512F', '#F09819']}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Icon name="flame" size={36} color="#FFF" />
            </LinearGradient>
            <Text style={{
              fontSize: 22,
              fontWeight: '800',
              color: colors.text,
              marginBottom: 12,
              textAlign: 'center',
            }}>Warning</Text>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#FF512F',
              marginBottom: 8,
              textAlign: 'center',
            }}>Emotional Damage imminent.</Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 20,
            }}>This mode roasts your language skills. Prepare for savage (but educational) feedback!</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.medium();
                setShowRoastWarning(false);
              }}
              style={{
                backgroundColor: '#FF512F',
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 16,
                width: '100%',
              }}
            >
              <Text style={{
                color: '#FFF',
                fontSize: 16,
                fontWeight: '700',
                textAlign: 'center',
              }}>I Can Handle It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  if (isImageBackground) {
    return <ImageBackground source={backgroundData.source} style={{ flex: 1 }} resizeMode="cover" onError={() => setBackgroundError(true)}>{mainContent}</ImageBackground>;
  }

  return <LinearGradient colors={backgroundData?.data?.colors || ['#6A11CB', '#2575FC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>{mainContent}</LinearGradient>;
};

const formatMenuData = (menuData) => {
  if (!menuData || !menuData.categories) return '';
  let menuText = '\n\n=== AVAILABLE MENU ===';
  Object.entries(menuData.categories).forEach(([category, items]) => {
    menuText += `\n${category}:\n`;
    if (Array.isArray(items)) {
      items.forEach(item => {
        menuText += `- ${item.name} (${item.price})`;
        if (item.description) menuText += ` - ${item.description}`;
        menuText += '\n';
      });
    }
  });
  menuText += '\nThese are the ONLY items available. If customer asks for something not on this list, politely inform them you don\'t have it.\n';
  return menuText;
};

const buildSystemPrompt = (scenarioPrompt, language, correctionMode, menuData) => {
  let systemPrompt = scenarioPrompt;
  if (menuData) systemPrompt += formatMenuData(menuData);
  if (correctionMode) systemPrompt += `

CORRECTION MODE RULES:
1. ONLY correct significant grammar or vocabulary mistakes in ${language}. Do NOT correct:
   - Missing punctuation (question marks, periods, commas)
   - Minor capitalization issues
   - Informal but understandable phrasing
   - Messages that are grammatically acceptable even if not perfect

2. If you DO find a significant error (wrong word, incorrect verb tense, missing article like "the/a", word order issues), add the correction at the END of your response using EXACTLY this format:
✅ Correction: [the corrected sentence here]

3. NEVER explain corrections inline in your main response. Do not say "I think you meant to say..." or "You may have meant...". Just respond naturally, then add the correction tag at the end if needed.

4. If the user's message is understandable and has no significant errors, do NOT add any correction.`;
  return systemPrompt;
};

const styles = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'android' ? 30 : 0, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, zIndex: 10, height: Platform.OS === 'ios' ? 140 : 120 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, flex: 1, position: 'relative' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  titleContainer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1, pointerEvents: 'none' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 },
  headerButtons: { flexDirection: 'column', alignItems: 'flex-end', gap: 6, zIndex: 10 },
  iconActionButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  keyboardContainer: { flex: 1 },
  messagesList: { paddingHorizontal: 0, paddingTop: 20, paddingBottom: 130 },
  bubbleBase: { maxWidth: '80%', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  bubbleUser: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 4 },
  bubbleAi: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 4, borderBottomRightRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  textBase: { fontSize: 16, lineHeight: 24 },
  textUser: { color: '#FFFFFF' },
  textAi: { color: '#1F2937' },
  correctionBox: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  correctionText: { fontSize: 14, fontWeight: '600', color: '#059669' },
  statusContainer: { position: 'absolute', bottom: 90, left: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.98)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 6, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.05)' },
  floatingInputWrapper: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  floatingInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 35, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 15, borderWidth: 2, borderColor: 'rgba(0, 0, 0, 0.08)' },
  micButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginLeft: 2 },
  floatingInput: { flex: 1, paddingHorizontal: 12, fontSize: 16, maxHeight: 100, color: '#333' },
  sendButton: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 21, marginRight: 4 },
});

export default ChatScreen;

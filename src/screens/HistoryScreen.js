import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Image,
  Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// Internal Imports
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import firebaseService from '../services/firebaseService';
import { SCENARIOS, LANGUAGES } from '../constants/scenarios';
import { formatRelativeTime } from '../utils/helpers';
import { COLORS } from '../constants/theme';
import Logger from '../utils/logger';
import { GemBadge, StreakBadge, InventoryBadge } from '../components/HeaderBadges';

const HistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, userProfile } = useApp();
  const { colors, activeTheme } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({ totalChats: 0, totalMessages: 0, activeLanguages: 0 });

  const isCyberpunk = activeTheme === 'cyberpunk';
  const [loading, setLoading] = useState(true);

  const { height } = Dimensions.get('window');
  const IS_SMALL_SCREEN = height < 700;

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await firebaseService.getUserConversations(user.uid);
      setConversations(convs);

      // Calculate stats
      const totalChats = convs.length;
      const totalMessages = convs.reduce((sum, conv) => sum + (conv.messageCount || 0), 0);
      const uniqueLanguages = new Set(convs.map(c => c.language)).size;

      setStats({
        totalChats,
        totalMessages,
        activeLanguages: uniqueLanguages
      });
    } catch (error) {
      Logger.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  };

  const handleConversationPress = (conversation) => {
    if (conversation.type === 'interview') {
      navigation.navigate('Chat', {
        scenario: {
          id: 'INTERVIEW',
          name: conversation.title || 'Interview',
          description: conversation.subtitle
        },
        language: conversation.language,
        conversationId: conversation.id
      });
      return;
    }

    const scenario = Object.values(SCENARIOS).find(s => s.id === conversation.scenarioId);
    const language = Object.values(LANGUAGES).find(l => l.code === conversation.language);

    if (!scenario || !language) {
      Alert.alert('Error', 'Invalid conversation data');
      return;
    }

    navigation.navigate('Chat', {
      scenario,
      language,
      conversationId: conversation.id
    });
  };



  // --- ICON HELPER ---
  // Maps scenario IDs to Vector Icons for a professional look
  const getScenarioIcon = (scenarioId) => {
    const id = scenarioId?.toUpperCase();
    if (id?.includes('CAFE')) return 'coffee';
    if (id?.includes('HOTEL')) return 'bed';
    if (id?.includes('SHOP')) return 'shopping';
    if (id?.includes('DOCTOR') || id?.includes('MEDICAL')) return 'doctor';
    if (id?.includes('TRAVEL')) return 'airplane';
    if (id?.includes('WORK') || id?.includes('INTERVIEW')) return 'briefcase';
    return 'message-text'; // Default
  };

  const getLanguageInfo = (languageCode) => {
    const language = Object.values(LANGUAGES).find(l => l.code === languageCode);
    return language || { name: 'Unknown', flag: '🌍' };
  };

  const renderConversation = ({ item }) => {
    // Get Metadata
    let scenario, language, iconName;

    if (item.type === 'interview') {
      scenario = { name: item.title || 'Interview' };
      language = getLanguageInfo(item.language);
      iconName = 'briefcase';
    } else {
      scenario = Object.values(SCENARIOS).find(s => s.id === item.scenarioId) || { name: 'Unknown' };
      language = getLanguageInfo(item.language);
      iconName = getScenarioIcon(item.scenarioId);
    }

    const timeAgo = formatRelativeTime(item.createdAt);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.card },
          isCyberpunk && {
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.glowColor,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5
          }
        ]}
        onPress={() => handleConversationPress(item)}

        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>

          {/* 1. Scenario Icon */}
          <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
            <MaterialIcon name={iconName} size={24} color="#6A11CB" />
          </View>

          {/* 2. Text Info */}
          <View style={styles.textContainer}>
            <View style={styles.cardHeader}>
              <Text style={[styles.scenarioTitle, { color: colors.text }]} numberOfLines={1}>
                {scenario.name}
              </Text>
              {/* Optional: Add a "New" dot if unread, logic needed */}
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.flag}>{language.flag}</Text>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{language.name}</Text>
              <View style={styles.dotSeparator} />
              <Icon name="time-outline" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{timeAgo}</Text>
            </View>

            <View style={styles.messageBadgeContainer}>
              <MaterialIcon name="message-processing-outline" size={12} color="#6A11CB" style={{ marginRight: 4 }} />
              <Text style={styles.messageCountText}>
                {item.messageCount || 0} messages
              </Text>
            </View>
          </View>

          {/* 3. Arrow */}
          <Icon name="chevron-forward" size={20} color="#D1D5DB" style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 1. CURVED HEADER BACKGROUND (fixed, like HomeScreen) */}
      <View style={[styles.headerContainer, IS_SMALL_SCREEN ? styles.headerContainerSmall : styles.headerContainerLarge]}>
        <LinearGradient
          colors={COLORS.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* 2. TOP BAR - Fixed at top */}
        <View style={[styles.headerTopRow, { marginTop: Math.max(insets.top, 10) }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            <View style={[styles.headerBadges, { gap: IS_SMALL_SCREEN ? 4 : 8 }]}>
              <InventoryBadge onPress={() => navigation.navigate('Inventory')} />
              <GemBadge onPress={() => navigation.navigate('Shop')} />
              <StreakBadge onPress={() => { }} />
            </View>
          </View>
        </View>

        {/* 3. LIST CONTENT - Stats and cards scroll together */}
        {loading ? (
          <View style={IS_SMALL_SCREEN ? styles.centerContainerSmall : styles.centerContainerLarge}>
            <ActivityIndicator size="large" color="#6A11CB" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={IS_SMALL_SCREEN ? styles.emptyStateContainerSmall : styles.emptyStateContainerLarge}>
            {/* Stats Row in empty state */}
            <View style={[styles.statsContainer, IS_SMALL_SCREEN ? styles.statsContainerSmall : styles.statsContainerLarge]}>
              <View style={styles.statItem}>
                <MaterialIcon name="chat-processing" size={24} color="#FFF" style={IS_SMALL_SCREEN ? styles.statIconSmall : styles.statIconLarge} />
                <Text style={IS_SMALL_SCREEN ? styles.statValueSmall : styles.statValueLarge}>{stats.totalChats}</Text>
                <Text style={IS_SMALL_SCREEN ? styles.statLabelSmall : styles.statLabelLarge}>Chats</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcon name="text-box-multiple" size={24} color="#FFF" style={IS_SMALL_SCREEN ? styles.statIconSmall : styles.statIconLarge} />
                <Text style={IS_SMALL_SCREEN ? styles.statValueSmall : styles.statValueLarge}>{stats.totalMessages}</Text>
                <Text style={IS_SMALL_SCREEN ? styles.statLabelSmall : styles.statLabelLarge}>Messages</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcon name="translate" size={24} color="#FFF" style={IS_SMALL_SCREEN ? styles.statIconSmall : styles.statIconLarge} />
                <Text style={IS_SMALL_SCREEN ? styles.statValueSmall : styles.statValueLarge}>{stats.activeLanguages}</Text>
                <Text style={IS_SMALL_SCREEN ? styles.statLabelSmall : styles.statLabelLarge}>Languages</Text>
              </View>
            </View>
            <View style={IS_SMALL_SCREEN ? styles.emptyIconCircleSmall : styles.emptyIconCircleLarge}>
              <MaterialIcon name="history" size={48} color="#D8B4FE" />
            </View>
            <Text style={[IS_SMALL_SCREEN ? styles.emptyTitleSmall : styles.emptyTitleLarge, { color: colors.text }]}>No History Yet</Text>
            <Text style={[IS_SMALL_SCREEN ? styles.emptyTextSmall : styles.emptyTextLarge, { color: colors.textSecondary }]}>
              Your completed conversations will appear here.
            </Text>
            <TouchableOpacity
              style={styles.startChatButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.startChatText}>Start New Chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={loadConversations}
            refreshing={loading}
            ListHeaderComponent={
              <View style={[styles.statsContainer, IS_SMALL_SCREEN ? styles.statsContainerSmall : styles.statsContainerLarge]}>
                <View style={styles.statItem}>
                  <MaterialIcon name="chat-processing" size={24} color="#FFF" style={IS_SMALL_SCREEN ? styles.statIconSmall : styles.statIconLarge} />
                  <Text style={IS_SMALL_SCREEN ? styles.statValueSmall : styles.statValueLarge}>{stats.totalChats}</Text>
                  <Text style={IS_SMALL_SCREEN ? styles.statLabelSmall : styles.statLabelLarge}>Chats</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcon name="text-box-multiple" size={24} color="#FFF" style={IS_SMALL_SCREEN ? styles.statIconSmall : styles.statIconLarge} />
                  <Text style={IS_SMALL_SCREEN ? styles.statValueSmall : styles.statValueLarge}>{stats.totalMessages}</Text>
                  <Text style={IS_SMALL_SCREEN ? styles.statLabelSmall : styles.statLabelLarge}>Messages</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcon name="translate" size={24} color="#FFF" style={IS_SMALL_SCREEN ? styles.statIconSmall : styles.statIconLarge} />
                  <Text style={IS_SMALL_SCREEN ? styles.statValueSmall : styles.statValueLarge}>{stats.activeLanguages}</Text>
                  <Text style={IS_SMALL_SCREEN ? styles.statLabelSmall : styles.statLabelLarge}>Languages</Text>
                </View>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

// Styles defined below

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // --- HEADER ---
  headerContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    zIndex: 0,
  },
  headerContainerSmall: {
    height: 220,
  },
  headerContainerLarge: {
    height: 260,
  },
  headerGradient: { flex: 1 },
  safeArea: { flex: 1 },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  backButton: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    zIndex: 0,
    paddingHorizontal: 80, // Prevent overlap with buttons
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
    zIndex: 10,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  statsContainerSmall: {
    marginTop: 12,
  },
  statsContainerLarge: {
    marginTop: 20,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statIconSmall: { marginBottom: 4, opacity: 0.9 },
  statIconLarge: { marginBottom: 8, opacity: 0.9 },
  statValueSmall: {
    fontSize: 20, fontWeight: '800', color: '#FFF',
  },
  statValueLarge: {
    fontSize: 24, fontWeight: '800', color: '#FFF',
  },
  statLabelSmall: {
    fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  statLabelLarge: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  statDivider: {
    width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // --- LIST ---
  listContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // --- CARD ---
  card: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    // Soft Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50, height: 50,
    borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: { flex: 1, marginRight: 8 },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 4,
  },
  scenarioTitle: {
    fontSize: 16, fontWeight: '700',
  },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 6,
  },
  flag: { fontSize: 14, marginRight: 6 },
  metaText: { fontSize: 13, fontWeight: '500' },
  dotSeparator: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: '#D1D5DB', marginHorizontal: 8,
  },

  messageBadgeContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 12,
  },
  messageCountText: {
    fontSize: 11, color: '#6A11CB', fontWeight: '600',
  },

  // --- EMPTY STATE ---
  centerContainerSmall: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  centerContainerLarge: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyStateContainerSmall: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingTop: 260, // 220 + 40
  },
  emptyStateContainerLarge: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingTop: 300, // 260 + 40
  },
  emptyIconCircleSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitleSmall: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyTitleLarge: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyTextSmall: {
    fontSize: 13, textAlign: 'center', maxWidth: '80%', lineHeight: 20, marginBottom: 20
  },
  emptyTextLarge: {
    fontSize: 14, textAlign: 'center', maxWidth: '80%', lineHeight: 20, marginBottom: 20
  },
  startChatButton: {
    backgroundColor: '#6A11CB',
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 24,
  },
  startChatText: { color: '#FFF', fontWeight: '700' },
});

export default HistoryScreen;
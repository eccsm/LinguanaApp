import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  StatusBar,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Image,
  TextInput
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import { useWalkthrough } from '../contexts/WalkthroughContext';
import { useGamification } from '../features/GamificationFeatures'; // Assuming you have this for inventory check
import { COLORS } from '../constants/theme';
import { LANGUAGES as import_LANGUAGES } from '../constants/scenarios';
import Logger from '../utils/logger';
import Haptics from '../utils/haptics';
import sfxService from '../services/sfxService';

// ICONS: MaterialCommunityIcons is best for "Game/Profile" UI
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PurchasePackModal from '../components/PurchasePackModal';
import AvatarUnlockModal from '../components/AvatarUnlockModal';
import FeedbackModal from '../components/FeedbackModal';
import { GemBadge, StreakBadge, InventoryBadge } from '../components/HeaderBadges';
import { version } from '../../package.json';

const ProfileLogger = Logger.withCategory('PROFILE');

// --- THEME CONFIGURATION ---
const AVAILABLE_THEMES = [
  {
    id: 'light',
    name: 'Daylight',
    colors: ['#6A11CB', '#2575FC'],
    icon: 'white-balance-sunny',
    isFree: true
  },
  {
    id: 'dark',
    name: 'Midnight',
    colors: ['#1e1e2e', '#3a3a5e'],
    icon: 'weather-night',
    isFree: true
  },
  {
    id: 'cyberpunk', // Matches ThemeContext key
    name: 'Cyberpunk',
    colors: ['#ff2d95', '#00f0ff'], // Neon Pink/Cyan gradient
    icon: 'city-variant-outline',
    inventoryKey: 'themeCyber', // Must match ShopScreen
  },
  {
    id: 'calm',
    name: 'Calm Mode',
    description: 'Reduced motion & softer colors',
    colors: ['#5C9A9A', '#9B8AA5'], // Muted teal to lavender
    icon: 'meditation',
    isFree: true, // Accessibility feature should be free
    isAccessibility: true, // Flag for special styling
  },
];

// --- AVATAR CONFIGURATION (Must match ShopScreen) ---
const AVATAR_IMAGES = {
  avatar_gecko: require('../../assets/avatars/gecko.png'),
  avatar_chameleon: require('../../assets/avatars/chameleon.png'),
  avatar_dragon: require('../../assets/avatars/dragon-b.png'),
  avatar_axolotl: require('../../assets/avatars/axolotil.png'),
  avatar_mascott: require('../../assets/avatars/mascott.png'),
  avatar_speedy: require('../../assets/avatars/speedy_lizard.png'),
  avatar_chatters: require('../../assets/avatars/chatters.png'),
  avatar_dictionary: require('../../assets/avatars/dictionary.png'),
  avatar_fn_lizard: require('../../assets/avatars/fn-lizard.png'),
  avatar_monitor: require('../../assets/avatars/monitor-lizard.png'),
};

const AVAILABLE_AVATARS = [
  { id: 'avatar_gecko', name: 'Gecko', image: AVATAR_IMAGES.avatar_gecko, inventoryKey: 'avatar_gecko' },
  { id: 'avatar_chameleon', name: 'Chammy', image: AVATAR_IMAGES.avatar_chameleon, inventoryKey: 'avatar_chameleon' },
  { id: 'avatar_dragon', name: 'Draco', image: AVATAR_IMAGES.avatar_dragon, inventoryKey: 'avatar_dragon' },
  { id: 'avatar_axolotl', name: 'Axel', image: AVATAR_IMAGES.avatar_axolotl, inventoryKey: 'avatar_axolotl' },
  { id: 'avatar_mascott', name: 'Lingo', image: AVATAR_IMAGES.avatar_mascott, inventoryKey: 'avatar_mascott' },
  { id: 'avatar_speedy', name: 'Speedy', image: AVATAR_IMAGES.avatar_speedy, inventoryKey: 'avatar_speedy' },
  { id: 'avatar_chatters', name: 'Chatters', image: AVATAR_IMAGES.avatar_chatters, inventoryKey: 'avatar_chatters' },
  { id: 'avatar_dictionary', name: 'Dictionary', image: AVATAR_IMAGES.avatar_dictionary, inventoryKey: 'avatar_dictionary' },
  { id: 'avatar_fn_lizard', name: 'FN Lizard', image: AVATAR_IMAGES.avatar_fn_lizard, inventoryKey: 'avatar_fn_lizard' },
  { id: 'avatar_monitor', name: 'Monitor', image: AVATAR_IMAGES.avatar_monitor, inventoryKey: 'avatar_monitor' },
];

// --- VOICE CONFIGURATION ---
const AVAILABLE_VOICES = [
  { id: 'alloy', name: 'Rachel', gender: 'Female', description: 'American, Clear', isFree: true, image: require('../../assets/images/speakers/rachel.png') },
  { id: 'echo', name: 'George', gender: 'Male', description: 'British, Warm', isFree: false, image: require('../../assets/images/speakers/george.png') },
  { id: 'fable', name: 'Laura', gender: 'Female', description: 'American, Upbeat', isFree: false, image: require('../../assets/images/speakers/laura.png') },
  { id: 'onyx', name: 'Charlie', gender: 'Male', description: 'Australian, Casual', isFree: false, image: require('../../assets/images/speakers/charlie.png') },
  { id: 'nova', name: 'Charlotte', gender: 'Female', description: 'British, Calm', isFree: false, image: require('../../assets/images/speakers/charlotte.png') },
  { id: 'shimmer', name: 'Bella', gender: 'Female', description: 'American, Soft', isFree: false, image: require('../../assets/images/speakers/bella.png') }
];



const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, userProfile, signOut, updateProfile, isPro, refreshProfile } = useApp();
  const { colors, isDarkMode, activeTheme, setTheme } = useTheme();
  const { stats } = useGamification();
  const { showAlert } = useAlert();
  const { resetWalkthrough } = useWalkthrough();

  // --- DERIVED DATA ---
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Learner';
  const initial = displayName?.[0]?.toUpperCase() || '?';
  const totalChats = userProfile?.totalConversations || 0;
  const currentStreak = userProfile?.currentStreak || 0;
  const longestStreak = userProfile?.longestStreak || 0;
  const equippedAvatarId = userProfile?.equippedAvatar;
  const equippedAvatar = AVAILABLE_AVATARS.find(a => a.id === equippedAvatarId);

  // Detect auth provider (Google, Facebook/Meta, or none for email/password)
  const getAuthProvider = () => {
    if (!user?.providerData || user.providerData.length === 0) return null;

    const providers = user.providerData.map(p => p.providerId);

    if (providers.includes('google.com')) {
      return { name: 'Google', icon: 'google', color: '#4285F4' };
    } else if (providers.includes('facebook.com')) {
      return { name: 'Meta', icon: 'facebook', color: '#1877F2' };
    }
    return null;
  };

  const authProvider = getAuthProvider();

  // Check for Gold Frame ownership
  const hasGoldFrame = stats?.inventory?.frameGold > 0;

  // Username editing state
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(userProfile?.username || '');

  // SFX and Vibration toggle state (from AppContext)
  // Handle null userProfile when logged out
  const sfxEnabled = userProfile?.sfxEnabled ?? true;
  const vibrationEnabled = userProfile?.vibrationEnabled ?? true;
  const { toggleSfx, toggleVibration } = useApp();

  // Handle SFX toggle
  const handleSfxToggle = async (value) => {
    await toggleSfx(value);
    if (value) {
      sfxService.playFlip(); // Play a sound to confirm it's working
    }
  };

  // Handle Vibration toggle
  const handleVibrationToggle = async (value) => {
    await toggleVibration(value);
    if (value) {
      sfxService.vibrate(100); // Vibrate to confirm it's working
    }
  };

  // Voice Selection State
  const [selectedVoice, setSelectedVoice] = useState(userProfile?.voicePreference || 'alloy');

  // Handle Voice Selection
  const handleVoiceSelect = async (voice) => {
    const userIsPro = isPro();
    Logger.log(`Voice select attempt: ${voice.name}, isFree: ${voice.isFree}, isPro: ${userIsPro}`);

    if (!voice.isFree && !userIsPro) {
      showAlert(
        'Premium Voice 💎',
        `Unlock ${voice.name} and all other premium voices with Linguana Pro!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') }
        ]
      );
      return;
    }

    setSelectedVoice(voice.id);

    // Play a sample (optional, but good UX)
    // For now, just haptic feedback
    Haptics.selection();

    try {
      await updateProfile({ voicePreference: voice.id });
      Logger.log('Voice preference updated:', voice.id);
    } catch (error) {
      Logger.error('Failed to update voice preference:', error);
      showAlert('Error', 'Failed to save voice preference.');
    }
  };

  // --- HANDLERS ---

  const handleSignOut = () => {
    showAlert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: async () => await signOut() }
      ]
    );
  };

  // Handle username change
  const handleUsernameChange = async () => {
    const username = newUsername.trim();

    // Validation: 3-15 alphanumeric characters and underscores
    if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
      showAlert('Invalid Username', 'Username must be 3-15 characters, letters, numbers, and underscores only.');
      return;
    }

    const usernameChanges = userProfile?.usernameChanges || 0;
    const hasNameToken = (stats?.inventory?.nameChangeToken || 0) > 0;

    // If not first change and no token, show error
    if (usernameChanges > 0 && !hasNameToken) {
      showAlert(
        'Name Token Required',
        'You need a Name Token from the shop to change your username again.',
        [
          { text: 'Go to Shop', onPress: () => navigation.navigate('Shop') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    try {
      const userRef = firestore().collection('users').doc(user.uid);
      const updateData = {
        username: username,
        usernameChanges: usernameChanges + 1,
      };

      // Consume Name Token if this is a paid change
      if (usernameChanges > 0) {
        updateData['inventory.nameChangeToken'] = firestore.FieldValue.increment(-1);
      }

      await userRef.update(updateData);

      // Also update the username in weeklyAggregatedScores for the current week
      // This ensures the league leaderboard shows the updated username immediately
      const { getWeekId } = require('../services/leagueService');
      const weekId = getWeekId();
      const weeklyScoreRef = firestore()
        .collection('weeklyAggregatedScores')
        .doc(`${weekId}_${user.uid}`);
      const weeklyDoc = await weeklyScoreRef.get();
      if (weeklyDoc.exists) {
        await weeklyScoreRef.update({ displayName: username });
        ProfileLogger.info('Updated username in weeklyAggregatedScores:', weekId);
      }

      setEditingUsername(false);
      Haptics.success();
      showAlert('Success!', `Username changed to ${username}`);
    } catch (error) {
      ProfileLogger.error('Username change error:', error);
      showAlert('Error', 'Failed to change username. Please try again.');
    }
  };

  const handleThemeSelect = async (theme) => {
    // 1. Check if user owns the theme
    const isOwned = theme.isFree || stats?.inventory?.[theme.inventoryKey] > 0 || isPro();

    if (!isOwned) {
      showAlert(
        'Locked Theme 🔒',
        `You need to unlock the ${theme.name} theme in the Shop first!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Shop', onPress: () => navigation.navigate('Shop') }
        ]
      );
      return;
    }

    // 2. Apply Theme using setTheme from ThemeContext
    setTheme(theme.id);

    // 3. Persist to Firestore
    try {
      await updateProfile({ activeTheme: theme.id });
      ProfileLogger.info('Theme applied and saved:', theme.id);
    } catch (error) {
      ProfileLogger.error('Failed to save theme preference:', error);
    }
  };

  // Unlock Modal State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedLockedAvatar, setSelectedLockedAvatar] = useState(null);

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleAvatarSelect = async (avatar) => {
    // 1. Check ownership
    const isOwned = stats?.inventory?.[avatar.inventoryKey] > 0;

    if (!isOwned) {
      setSelectedLockedAvatar(avatar);
      setShowUnlockModal(true);
      return;
    }

    // 2. Equip Avatar
    try {
      await updateProfile({ equippedAvatar: avatar.id });
      ProfileLogger.info('Avatar equipped:', avatar.id);
      Haptics.success();
    } catch (error) {
      showAlert('Error', 'Failed to equip avatar');
    }
  };

  const toggleCorrectionMode = async (value) => {
    try {
      await updateProfile({ correctionMode: value });
    } catch (error) {
      showAlert('Error', 'Failed to update settings');
    }
  };

  // --- RENDER HELPERS ---

  const renderStatItem = (icon, label, value, color, gradientColors) => (
    <View style={[styles.statItem, { backgroundColor: colors.card }]}>
      {/* Decorative accent bar */}
      <LinearGradient
        colors={gradientColors || [color, color]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.statAccentBar}
      />
      <View style={[styles.statIconBubble, { backgroundColor: `${color}15` }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* 1. CURVED HEADER BACKGROUND (fixed, like HomeScreen) */}
      <View style={styles.headerBackgroundContainer}>
        <LinearGradient
          colors={COLORS.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* 2. TOP BAR */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 8) }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            <View style={[styles.headerBadges, { gap: 4 }]}>
              <InventoryBadge onPress={() => navigation.navigate('Inventory')} />
              <GemBadge onPress={() => navigation.navigate('Shop')} />
              <StreakBadge onPress={() => { }} />
            </View>
          </View>
        </View>

        {/* 3. SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {/* Profile Hero Section */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={hasGoldFrame ? ['#FFD700', '#FDB931'] : (isPro() ? ['#FFD700', '#FFA500'] : ['#9478f6', '#9478f6'])}
                style={[
                  styles.avatarGradient,
                  hasGoldFrame && {
                    borderColor: '#FFD700',
                    borderWidth: 4,
                    shadowColor: '#FFD700',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 15,
                    elevation: 10
                  }
                ]}
              >
                {equippedAvatar?.image ? (
                  <Image source={equippedAvatar.image} style={styles.equippedAvatarImage} resizeMode="cover" />
                ) : equippedAvatar?.icon ? (
                  <Icon name={equippedAvatar.icon} size={60} color="#FFF" />
                ) : (
                  <Text style={styles.avatarText}>{initial}</Text>
                )}
              </LinearGradient>
              {isPro() && (
                <View style={styles.proBadgeIcon}>
                  <Icon name="crown" size={14} color="#FFF" />
                </View>
              )}
            </View>

            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{user?.email || 'Anonymous'}</Text>

            {/* Auth Provider Badge */}
            {authProvider && (
              <View style={[styles.providerBadge, { backgroundColor: authProvider.color + '40' }]}>
                <Icon name={authProvider.icon} size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.providerText}>
                  Connected via {authProvider.name}
                </Text>
              </View>
            )}

            {/* Status Pill */}
            <View style={styles.statusPill}>
              <Icon name={isPro() ? "star-face" : "account-outline"} size={14} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.statusText}>{isPro() ? 'Pro Member' : 'Free Plan'}</Text>
            </View>
          </View>

          {/* 3. STATISTICS GRID */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="chart-box-outline" size={20} color={colors.primary || '#6A11CB'} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
            </View>
            <View style={styles.statsGrid}>
              {renderStatItem('message-text-outline', 'Chats', totalChats, '#4F46E5', ['#4F46E5', '#7C3AED'])}
              {renderStatItem('fire', 'Streak', currentStreak, '#F97316', ['#F97316', '#EA580C'])}
              {renderStatItem('trophy-outline', 'Best Streak', longestStreak, '#F59E0B', ['#F59E0B', '#D97706'])}
              {renderStatItem('briefcase-check', 'Interviews', userProfile?.totalInterviews || 0, '#10B981', ['#10B981', '#059669'])}
            </View>
          </View>

          {/* 4. THEME SELECTOR (NEW FEATURE) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="palette-outline" size={20} color={colors.primary || '#6A11CB'} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Personalization</Text>
            </View>

            {/* Username Row */}
            <View style={[styles.usernameRow, { backgroundColor: colors.card }]}>
              <View style={styles.usernameLeft}>
                <Icon name="at" size={20} color={colors.primary || '#6A11CB'} />
                <View style={styles.usernameTextContainer}>
                  {editingUsername ? (
                    <TextInput
                      style={[styles.usernameInput, { color: colors.text }]}
                      value={newUsername}
                      onChangeText={setNewUsername}
                      placeholder="Enter username"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={15}
                    />
                  ) : (
                    <Text style={[styles.usernameText, { color: colors.text }]}>
                      {userProfile?.username || 'Not set'}
                    </Text>
                  )}
                  <Text style={[styles.usernameHint, { color: colors.textSecondary }]}>
                    {(userProfile?.usernameChanges || 0) === 0 ? '🎁 Free change!' : 'Requires Name Token'}
                  </Text>
                </View>
              </View>
              {editingUsername ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.usernameCancel}
                    onPress={() => setEditingUsername(false)}
                  >
                    <Icon name="close" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.usernameSave}
                    onPress={handleUsernameChange}
                  >
                    <Icon name="check" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.usernameEdit}
                  onPress={() => {
                    setNewUsername(userProfile?.username || '');
                    setEditingUsername(true);
                  }}
                >
                  <Icon name="pencil" size={16} color={colors.primary || '#6A11CB'} />
                  <Text style={[styles.usernameEditText, { color: colors.primary || '#6A11CB' }]}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
              {AVAILABLE_THEMES.map((theme) => {
                // Determine logic: Free OR (Inventory has Item OR User is Pro)
                const isOwned = theme.isFree || stats?.inventory?.[theme.inventoryKey] > 0 || isPro();
                // Check if this theme is currently active
                const isActive = activeTheme === theme.id;

                return (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => handleThemeSelect(theme)}
                    style={[
                      styles.themeCard,
                      isActive && styles.themeCardActive,
                      { backgroundColor: colors.card }
                    ]}
                  >
                    <LinearGradient
                      colors={theme.colors}
                      style={styles.themePreview}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      {isActive && (
                        <View style={styles.activeCheck}>
                          <Icon name="check" size={12} color="#FFF" />
                        </View>
                      )}
                      {!isOwned && (
                        <View style={styles.lockOverlay}>
                          <Icon name="lock" size={20} color="#FFF" />
                        </View>
                      )}
                    </LinearGradient>
                    <Text style={[styles.themeName, { color: colors.text }]}>{theme.name}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* 5. AVATAR SELECTOR (NEW FEATURE) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="account-circle-outline" size={20} color={colors.primary || '#6A11CB'} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Avatars</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
              {/* Default Initials Option */}
              <TouchableOpacity
                onPress={() => updateProfile({ equippedAvatar: null })}
                style={[
                  styles.themeCard,
                  !equippedAvatarId && styles.themeCardActive,
                  { backgroundColor: colors.card }
                ]}
              >
                <View style={[styles.themePreview, { backgroundColor: '#E5E7EB' }]}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#6B7280' }}>{initial}</Text>
                  {!equippedAvatarId && (
                    <View style={styles.activeCheck}>
                      <Icon name="check" size={12} color="#FFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.themeName, { color: colors.text }]}>Default</Text>
              </TouchableOpacity>

              {AVAILABLE_AVATARS.map((avatar) => {
                const isOwned = stats?.inventory?.[avatar.inventoryKey] > 0;
                const isActive = equippedAvatarId === avatar.id;

                return (
                  <TouchableOpacity
                    key={avatar.id}
                    onPress={() => handleAvatarSelect(avatar)}
                    style={[
                      styles.themeCard,
                      isActive && styles.themeCardActive,
                      { backgroundColor: colors.card }
                    ]}
                  >
                    <View style={[styles.themePreview, { backgroundColor: 'transparent' }]}>
                      {avatar.image ? (
                        <Image source={avatar.image} style={styles.avatarSelectImage} resizeMode="contain" />
                      ) : (
                        <Icon name={avatar.icon} size={32} color={avatar.color} />
                      )}
                      {isActive && (
                        <View style={styles.activeCheck}>
                          <Icon name="check" size={12} color="#FFF" />
                        </View>
                      )}
                      {!isOwned && (
                        <View style={styles.lockOverlay}>
                          <Icon name="lock" size={20} color="#FFF" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.themeName, { color: colors.text }]}>{avatar.name}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* 6. VOICE SELECTOR (NEW FEATURE) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="account-voice" size={20} color={colors.primary || '#6A11CB'} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Speaker</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
              {AVAILABLE_VOICES.map((voice) => {
                const isLocked = !voice.isFree && !isPro();
                const isActive = selectedVoice === voice.id;

                return (
                  <TouchableOpacity
                    key={voice.id}
                    onPress={() => handleVoiceSelect(voice)}
                    style={[
                      styles.themeCard,
                      isActive && styles.themeCardActive,
                      { backgroundColor: colors.card, width: 180, height: 240 }
                    ]}
                  >
                    <View style={[styles.themePreview, { backgroundColor: isDarkMode ? '#2D3748' : '#F3F4F6', height: 130, padding: 0, overflow: 'hidden' }]}>
                      {voice.image ? (
                        <Image
                          source={voice.image}
                          style={{ width: '100%', height: '100%', borderRadius: 8 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Icon name={voice.icon} size={40} color={isActive ? (colors.primary || '#6A11CB') : '#9CA3AF'} />
                      )}

                      {isActive && (
                        <View style={[styles.activeCheck, styles.voiceActiveCheck]}>
                          <Icon name="check-bold" size={16} color="#FFF" />
                        </View>
                      )}

                      {isLocked && (
                        <View style={styles.lockOverlay}>
                          <Icon name="lock" size={24} color="#FFF" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.themeName, { color: colors.text, fontSize: 16, marginTop: 8, width: '100%', textAlign: 'center' }]} numberOfLines={1}>{voice.name}</Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 4, width: '100%' }}>
                      {voice.gender}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 2, opacity: 0.8, width: '100%', paddingHorizontal: 2 }}>
                      {voice.description}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* 5. NATIVE LANGUAGE SELECTOR (NEW) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="translate" size={20} color={colors.primary || '#6A11CB'} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Native Language (for translations)</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
              {Object.values(import_LANGUAGES).map((lang) => {
                const isActive = (userProfile?.nativeLanguage || 'en') === lang.code;
                const hasToken = (stats?.inventory?.nativeLanguageChange || 0) > 0;

                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => {
                      if (isActive) return; // Already selected, do nothing

                      if (!hasToken) {
                        showAlert(
                          'Token Required',
                          'You need a Native Language Change token from the Shop to change your native language.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Go to Shop', onPress: () => navigation.navigate('Shop') }
                          ]
                        );
                        return;
                      }

                      // Confirm before consuming token
                      showAlert(
                        'Change Native Language',
                        `Change to ${lang.nativeName}? This will consume 1 Native Language Change token.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Change',
                            onPress: async () => {
                              try {
                                // Consume token and update language
                                await firestore().collection('users').doc(user.uid).update({
                                  nativeLanguage: lang.code,
                                  'inventory.nativeLanguageChange': firestore.FieldValue.increment(-1)
                                });
                                await refreshProfile();
                                Haptics.success();
                              } catch (error) {
                                showAlert('Error', 'Failed to change language');
                              }
                            }
                          }
                        ]
                      );
                    }}
                    style={[
                      styles.themeCard,
                      isActive && styles.themeCardActive,
                      { backgroundColor: colors.card }
                    ]}
                  >
                    <View style={[styles.themePreview, { backgroundColor: isActive ? `${colors.primary}15` : 'transparent' }]}>
                      <Text style={{ fontSize: 32 }}>{lang.flag}</Text>
                      {isActive && (
                        <View style={styles.activeCheck}>
                          <Icon name="check" size={12} color="#FFF" />
                        </View>
                      )}
                      {!isActive && !hasToken && (
                        <View style={styles.lockOverlay}>
                          <Icon name="lock" size={16} color="#FFF" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.themeName, { color: colors.text }]}>{lang.nativeName}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* 5. UPGRADE CTA */}
          {
            !isPro() && (
              <View style={styles.sectionContainer}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Subscription')}
                  style={styles.upgradeContainer}
                >
                  <LinearGradient
                    colors={['#8e52f2', '#6A11CB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeGradient}
                  >
                    <View style={styles.upgradeContent}>
                      <Text style={styles.upgradeTitle}>Unlock Full Potential</Text>
                      <Text style={styles.upgradeDesc}>GPT-5, Voice Chat & Unlimited Lives.</Text>
                    </View>
                    <View style={styles.upgradeButton}>
                      <Text style={styles.upgradeBtnText}>UPGRADE</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          }

          {/* 6. SETTINGS & ACTIONS */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="cog-outline" size={20} color={colors.primary || '#6A11CB'} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card }]}>

              {/* Correction Mode */}
              <View style={styles.settingRow}>
                <View style={styles.settingIconBox}>
                  <Icon name="school-outline" size={22} color="#6A11CB" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Tutor Mode</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Get grammar feedback automatically
                  </Text>
                </View>
                <Switch
                  value={userProfile?.correctionMode ?? true}
                  onValueChange={toggleCorrectionMode}
                  trackColor={{ false: '#CCC', true: '#6A11CB' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.divider} />

              {/* History */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => navigation.navigate('History')}
              >
                <View style={styles.settingIconBox}>
                  <Icon name="history" size={22} color="#4F46E5" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Chat History</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#CCC" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Sound Effects Toggle */}
              <View style={styles.settingRow}>
                <View style={[styles.settingIconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Icon name="volume-high" size={22} color="#3B82F6" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Sound Effects</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Play sounds on actions
                  </Text>
                </View>
                <Switch
                  value={sfxEnabled}
                  onValueChange={handleSfxToggle}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={sfxEnabled ? '#3B82F6' : '#9CA3AF'}
                  ios_backgroundColor="#E5E7EB"
                />
              </View>

              {/* Vibration Toggle */}
              <View style={styles.settingRow}>
                <View style={[styles.settingIconBox, { backgroundColor: '#E0E7FF' }]}>
                  <Icon name="vibrate" size={22} color="#6366F1" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Vibration</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Haptic feedback on taps
                  </Text>
                </View>
                <Switch
                  value={vibrationEnabled}
                  onValueChange={handleVibrationToggle}
                  trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                  thumbColor={vibrationEnabled ? '#6366F1' : '#9CA3AF'}
                  ios_backgroundColor="#E5E7EB"
                />
              </View>

              <View style={styles.divider} />

              {/* Send Feedback */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => {
                  Haptics.light();
                  setShowFeedbackModal(true);
                }}
              >
                <View style={[styles.settingIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Icon name="message-reply-text-outline" size={22} color="#22C55E" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Send Feedback</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Report bugs or suggest features
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#CCC" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Replay Tutorial */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => {
                  Haptics.medium();
                  resetWalkthrough();
                  navigation.navigate('Home');
                }}
              >
                <View style={[styles.settingIconBox, { backgroundColor: '#F0E6FF' }]}>
                  <Icon name="school-outline" size={22} color="#8a46ff" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Replay Tutorial</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Learn how to use the app
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#CCC" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Sign Out */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleSignOut}
              >
                <View style={[styles.settingIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Icon name="logout" size={22} color="#EF4444" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Sign Out</Text>
                </View>
              </TouchableOpacity>

            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.versionText}>Linguana v{version}</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
      <AvatarUnlockModal
        visible={showUnlockModal}
        avatar={selectedLockedAvatar}
        onClose={() => {
          setShowUnlockModal(false);
          setSelectedLockedAvatar(null);
        }}
        onGoToShop={() => {
          setShowUnlockModal(false);
          setSelectedLockedAvatar(null);
          navigation.navigate('Shop');
        }}
      />
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header Background (fixed, like HomeScreen)
  headerBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0,
  },
  headerGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
    zIndex: 10,
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
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  avatarContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  avatarGradient: {
    width: 100, height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFF',
  },
  equippedAvatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  avatarSelectImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  proBadgeIcon: {
    position: 'absolute',
    bottom: 0, right: 0,
    backgroundColor: '#000',
    width: 28, height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 10,
  },
  providerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFF',
  },

  // Sections
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(106, 17, 203, 0.08)',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    width: '47%',
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  statAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },

  // Theme Selector
  themeScroll: {
    overflow: 'visible', // allow shadows to show
  },
  themeCard: {
    width: 100,
    marginRight: 16,
    alignItems: 'center',
    borderRadius: 16,
    padding: 8,
    paddingBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardActive: {
    borderColor: '#6A11CB',
    backgroundColor: '#F3E8FF',
  },
  themePreview: {
    width: '100%',
    height: 70,
    borderRadius: 12,
    marginBottom: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeName: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeCheck: {
    backgroundColor: '#10B981',
    width: 20, height: 20,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute',
    bottom: -6, right: -6,
    borderWidth: 2, borderColor: '#FFF',
  },
  // Larger checkmark for voice/speaker cards
  voiceActiveCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    bottom: 8,
    right: 8,
    borderWidth: 3,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Username Row
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  usernameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  usernameTextContainer: {
    flex: 1,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: '600',
  },
  usernameInput: {
    fontSize: 16,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#6A11CB',
    paddingVertical: 4,
    minWidth: 120,
  },
  usernameHint: {
    fontSize: 12,
    marginTop: 2,
  },
  usernameEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(106, 17, 203, 0.08)',
    gap: 4,
  },
  usernameEditText: {
    fontSize: 14,
    fontWeight: '600',
  },
  usernameCancel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usernameSave: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Upgrade CTA
  upgradeContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6A11CB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  upgradeContent: { flex: 1, marginRight: 12 },
  upgradeTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  upgradeDesc: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  upgradeButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  upgradeBtnText: { fontSize: 13, fontWeight: '800', color: '#6A11CB' },

  // Settings Card
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIconBox: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingTextContainer: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '600' },
  settingDescription: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 68 },

  footer: { alignItems: 'center', padding: 30, gap: 8 },
  versionText: { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  madeWithContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  madeWithText: { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  pawIcon: { marginHorizontal: 1 },
});

export default ProfileScreen;
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Platform
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Logger from '../utils/logger';

const { width } = Dimensions.get('window');

const CONTENT_CONFIG = {
  VOICE: {
    icon: 'microphone',
    iconColor: '#4CAF50', // Greenish
    title: 'Unlock Voice Practice',
    subtitle: 'Level up your pronunciation with AI conversations.',
    benefits: [
      { icon: 'account-voice', text: 'Speak naturally with AI' },
      { icon: 'ear-hearing', text: 'Hear perfect pronunciation' },
      { icon: 'lightning-bolt', text: 'Improve 3x faster' },
    ],
    adReward: 'Get 1 voice try'
  },
  CHAT: {
    icon: 'message-text',
    iconColor: '#2196F3', // Blueish
    title: 'Daily Limit Reached',
    subtitle: "You've used all your free messages for today.",
    benefits: [
      { icon: 'infinity', text: 'Unlimited conversations' },
      { icon: 'brain', text: 'Smarter AI models (GPT-4)' },
      { icon: 'school', text: 'Detailed grammar corrections' },
    ],
    adReward: 'Unlock 5 messages'
  },
  INTERVIEW: {
    icon: 'briefcase',
    iconColor: '#FFD700', // Gold
    title: 'Daily Interview Limit',
    subtitle: 'You can only do 1 free interview per day.',
    benefits: [
      { icon: 'briefcase-check', text: 'Unlimited mock interviews' },
      { icon: 'text-box-search', text: 'Detailed AI feedback' },
      { icon: 'school', text: 'Master every topic' },
    ],
    adReward: 'Unlock 1 interview'
  },
  EXTRA_SCENARIO: {
    icon: 'message-plus',
    iconColor: '#9C27B0', // Purple
    title: 'Daily Limit Reached',
    subtitle: 'Watch an ad to unlock one more conversation scenario.',
    benefits: [
      { icon: 'lock-open', text: 'Unlock 1 full conversation' },
      { icon: 'brain', text: 'Practice new topics' },
      { icon: 'star', text: 'Keep your streak alive' },
    ],
    adReward: 'Unlock +1 Scenario'
  }
};

const PremiumLimitModal = ({
  visible,
  onClose,
  mode = 'CHAT',
  onWatchAd,
  onUpgrade,
  adsWatchedToday = 0,
  maxAdsPerDay = 3
}) => {
  const { colors } = useTheme();
  // Safety check for colors
  const themeColors = colors || { surface: '#FFF', text: '#000', textSecondary: '#666', primary: '#6A11CB', border: '#EEE' };

  const navigation = useNavigation();
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  const content = CONTENT_CONFIG[mode] || CONTENT_CONFIG.CHAT;
  const canWatchAd = adsWatchedToday < maxAdsPerDay;

  useEffect(() => {
    if (visible) {
      Logger.log(`[PremiumLimitModal] Opening in mode: ${mode}`);
      // Reset values to ensure animation plays correctly
      scaleValue.setValue(0.8);
      opacityValue.setValue(0);

      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 7
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible]);

  const handleUpgradePress = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigation.navigate('Subscription');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: opacityValue }]} />

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: themeColors.surface,
              transform: [{ scale: scaleValue }],
              opacity: opacityValue
            }
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* Header Icon */}
            <View style={[styles.iconCircle, { backgroundColor: content.iconColor + '20' }]}>
              <Icon name={content.icon} size={36} color={content.iconColor} />
            </View>

            {/* Texts */}
            <Text style={[styles.title, { color: themeColors.text }]}>
              {content.title}
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {content.subtitle}
            </Text>

            {/* Benefits List */}
            <View style={styles.benefitsContainer}>
              {content.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <Icon name={benefit.icon} size={20} color={themeColors.primary} style={styles.benefitIcon} />
                  <Text style={[styles.benefitText, { color: themeColors.text }]}>{benefit.text}</Text>
                </View>
              ))}
            </View>

            {/* WATCH AD BUTTON */}
            {onWatchAd && (
              <View style={styles.adSection}>
                <TouchableOpacity
                  style={[
                    styles.adButton,
                    !canWatchAd && styles.adButtonDisabled,
                    { borderColor: canWatchAd ? themeColors.primary : themeColors.border }
                  ]}
                  onPress={canWatchAd ? onWatchAd : null}
                  activeOpacity={0.7}
                  disabled={!canWatchAd}
                >
                  <View style={styles.adContent}>
                    <Icon
                      name={canWatchAd ? "play-circle-outline" : "clock-outline"}
                      size={24}
                      color={canWatchAd ? themeColors.primary : themeColors.textSecondary}
                    />
                    <View style={styles.adTextCol}>
                      <Text style={[styles.adButtonTitle, { color: canWatchAd ? themeColors.text : themeColors.textSecondary }]}>
                        {canWatchAd ? 'Watch Ad' : 'Ad Limit Reached'}
                      </Text>
                      <Text style={[styles.adButtonSubtitle, { color: themeColors.textSecondary }]}>
                        {canWatchAd ? content.adReward : 'Come back tomorrow'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.adBadge, { backgroundColor: canWatchAd ? themeColors.primary + '20' : themeColors.border }]}>
                    <Text style={[styles.adBadgeText, { color: canWatchAd ? themeColors.primary : themeColors.textSecondary }]}>
                      {canWatchAd ? 'FREE' : `${adsWatchedToday}/${maxAdsPerDay}`}
                    </Text>
                  </View>
                </TouchableOpacity>

                {canWatchAd && (
                  <Text style={[styles.limitText, { color: themeColors.textSecondary }]}>
                    Daily limit: {adsWatchedToday}/{maxAdsPerDay}
                  </Text>
                )}
              </View>
            )}

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.line, { backgroundColor: themeColors.border }]} />
              <Text style={[styles.orText, { color: themeColors.textSecondary, backgroundColor: themeColors.surface }]}>OR</Text>
              <View style={[styles.line, { backgroundColor: themeColors.border }]} />
            </View>

            {/* PREMIUM BUTTON */}
            <TouchableOpacity
              style={[styles.premiumButton, { backgroundColor: themeColors.primary }]}
              onPress={handleUpgradePress}
              activeOpacity={0.9}
            >
              <View style={styles.premiumContent}>
                <Icon name="crown" size={24} color="#FFF" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                  <Text style={styles.premiumSubtitle}>Unlimited Access • No Ads</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#FFF" style={{ opacity: 0.8 }} />
              </View>
            </TouchableOpacity>

            {/* Close */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={[styles.closeText, { color: themeColors.textSecondary }]}>Maybe Later</Text>
            </TouchableOpacity>

          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fallback if backdrop fails
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    padding: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitText: {
    fontSize: 15,
    fontWeight: '600',
  },
  adSection: {
    width: '100%',
    marginBottom: 20,
  },
  adButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  adButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  adButtonTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  adButtonSubtitle: {
    fontSize: 12,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  adBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  limitText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 20,
    marginBottom: 20,
  },
  line: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 5,
  },
  premiumButton: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  premiumTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  premiumSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    padding: 12,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
  }
});

export default PremiumLimitModal;
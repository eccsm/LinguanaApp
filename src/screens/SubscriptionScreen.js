import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import firestore from '@react-native-firebase/firestore';
import analyticsService from '../services/analyticsService';
import paywallService from '../services/paywallService';
import Logger from '../utils/logger';

const SUBSCRIPTION_TIERS = {
  FREE: {
    features: [
      '10 daily conversations',
      'Basic model (GPT-3.5)',
      'Standard response speed',
    ],
  },
  PRO: {
    features: [
      'Unlimited conversations',
      'Unlimited Job Interviews',
      'Advanced model (GPT-5)',
      'Priority response speed',
      'Access to exclusive content',
    ],
  },
};

const SubscriptionScreen = ({ navigation }) => {
  const { user, userProfile, isPro, updateProfile, refreshProfile } = useApp();
  const { colors, isDarkMode, activeTheme } = useTheme();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('ANNUAL'); // Default to Annual

  const isCyberpunk = activeTheme === 'cyberpunk';

  // Generate dynamic styles based on theme colors
  const styles = useMemo(() => getStyles(colors, isDarkMode), [colors, isDarkMode]);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      await paywallService.refreshData();
      const pkgs = paywallService.getPackages();
      setPackages(pkgs);

      // Select annual by default if available, otherwise monthly
      const annual = pkgs.find(p => p.packageType === 'ANNUAL');
      const monthly = pkgs.find(p => p.packageType === 'MONTHLY');

      if (annual) {
        setSelectedPackage(annual);
        setSelectedPeriod('ANNUAL');
      } else if (monthly) {
        setSelectedPackage(monthly);
        setSelectedPeriod('MONTHLY');
      } else {
        setSelectedPackage(pkgs[0]);
      }

      Logger.withCategory('SUBSCRIPTION').info('Packages loaded:', pkgs.length);
    } catch (error) {
      Logger.withCategory('SUBSCRIPTION').error('Failed to load packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPeriod = (period) => {
    setSelectedPeriod(period);
    const pkg = packages.find(p => p.packageType === period);
    if (pkg) {
      setSelectedPackage(pkg);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPackage) {
      showAlert('No Package Selected', 'Please wait for packages to load or try again.');
      return;
    }

    setLoading(true);
    try {
      Logger.withCategory('SUBSCRIPTION').info('Starting purchase:', selectedPackage.identifier);
      const result = await paywallService.purchase(selectedPackage);

      if (result.success) {
        if (userProfile?.uid) {
          const details = paywallService.getPackageDetails(selectedPackage);
          analyticsService.trackPremiumConversion(
            userProfile.uid,
            details.period.toLowerCase(),
            parseFloat(details.price.replace(/[^0-9.]/g, '')) || 9.99
          );
        }
        await refreshProfile();
        showAlert(
          'Welcome to Premium!',
          'Your subscription is now active. Enjoy unlimited access!',
          [{ text: 'Start Learning', onPress: () => navigation.goBack() }]
        );
      } else if (!result.cancelled) {
        showAlert('Purchase Failed', result.error || 'Unable to process subscription. Please try again.');
      }
    } catch (error) {
      Logger.withCategory('SUBSCRIPTION').error('Subscription error:', error);
      showAlert('Subscription Failed', error.message || 'Unable to process subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await paywallService.restorePurchases();
      if (result.success && result.isPro) {
        await refreshProfile();
        showAlert(
          'Subscription Restored!',
          'Your premium access has been restored.',
          [{ text: 'Continue', onPress: () => navigation.goBack() }]
        );
      } else {
        showAlert('No Subscription Found', 'No active subscription to restore.');
      }
    } catch (error) {
      Logger.withCategory('SUBSCRIPTION').error('Restore error:', error);
      showAlert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    showAlert(
      'Manage Subscription',
      'You can manage your subscription through your App Store or Google Play account settings.',
      [{ text: 'OK' }]
    );
  };

  // Helper to get price string safely
  const getPrice = (type) => {
    const pkg = packages.find(p => p.packageType === type);
    return pkg ? pkg.product.priceString : (type === 'ANNUAL' ? '$69.99' : '$9.99');
  };

  if (isPro()) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#6A11CB', '#2575FC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.headerIconCircle}>
                <Icon name="crown" size={40} color="#FFD700" />
              </View>
              <Text style={styles.headerTitle}>Pro Member</Text>
              <Text style={styles.headerSubtitle}>
                Thank you for supporting Linguana.
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.contentContainer}>
            <View style={[styles.benefitsCard, styles.proBenefitsCard]}>
              <Text style={[styles.benefitsTitle, styles.benefitsTitlePro]}>Your Active Benefits</Text>
              {SUBSCRIPTION_TIERS.PRO.features.map((feature, index) => (
                <View key={index} style={styles.benefitRow}>
                  <Icon name="check-circle" size={20} color="#4CAF50" style={{ marginRight: 12 }} />
                  <Text style={styles.benefitText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
              <LinearGradient
                colors={['#007AFF', '#2575FC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.manageGradient}
              >
                <Text style={styles.manageButtonText}>Manage Subscription</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView style={styles.container} bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header Gradient */}
        <LinearGradient
          colors={['#6A11CB', '#2575FC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.headerIconCircle}>
                <Icon name="crown" size={40} color="#FFD700" />
              </View>
              <Text style={styles.headerTitle}>Unlock Premium</Text>
              <Text style={styles.headerSubtitle}>
                Master a new language 3x faster with unlimited access.
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.contentContainer}>

          {/* Plan Selection Cards */}
          <View style={styles.planSelectionContainer}>

            {/* Yearly Plan */}
            <TouchableOpacity
              style={[
                styles.planOptionCard,
                selectedPeriod === 'ANNUAL' && styles.planOptionCardSelected,
                isCyberpunk && {
                  borderColor: selectedPeriod === 'ANNUAL' ? colors.primary : colors.border,
                  borderWidth: 1,
                  shadowColor: selectedPeriod === 'ANNUAL' ? colors.glowColor : 'transparent',
                  shadowOpacity: 0.6,
                  shadowRadius: 15,
                  elevation: 10
                }
              ]}
              onPress={() => handleSelectPeriod('ANNUAL')}
              activeOpacity={0.9}
            >
              <View style={styles.planOptionHeader}>
                <View style={styles.radioButton}>
                  {selectedPeriod === 'ANNUAL' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planOptionTitle}>Yearly</Text>
                  <Text style={styles.planOptionSubtitle}>Best Value</Text>
                </View>
                <View style={styles.planOptionPriceContainer}>
                  <Text style={styles.planOptionPrice}>{getPrice('ANNUAL')}</Text>
                  <Text style={styles.planOptionPeriod}>/year</Text>
                </View>
              </View>

              {/* Savings Badge */}
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>SAVE 40%</Text>
              </View>
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planOptionCard,
                selectedPeriod === 'MONTHLY' && styles.planOptionCardSelected,
                isCyberpunk && {
                  borderColor: selectedPeriod === 'MONTHLY' ? colors.primary : colors.border,
                  borderWidth: 1,
                  shadowColor: selectedPeriod === 'MONTHLY' ? colors.glowColor : 'transparent',
                  shadowOpacity: 0.6,
                  shadowRadius: 15,
                  elevation: 10
                }
              ]}
              onPress={() => handleSelectPeriod('MONTHLY')}
              activeOpacity={0.9}
            >
              <View style={styles.planOptionHeader}>
                <View style={styles.radioButton}>
                  {selectedPeriod === 'MONTHLY' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planOptionTitle}>Monthly</Text>
                  <Text style={styles.planOptionSubtitle}>Flexible</Text>
                </View>
                <View style={styles.planOptionPriceContainer}>
                  <Text style={styles.planOptionPrice}>{getPrice('MONTHLY')}</Text>
                  <Text style={styles.planOptionPeriod}>/mo</Text>
                </View>
              </View>
            </TouchableOpacity>

          </View>

          {/* Features List */}
          <View style={styles.featuresListContainer}>
            <Text style={styles.featuresListTitle}>What's Included:</Text>
            {SUBSCRIPTION_TIERS.PRO.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Icon name="check-circle" size={20} color="#6A11CB" style={{ marginRight: 12 }} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FFC700', '#FF9A00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#333" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.subscribeButtonText}>
                    {selectedPeriod === 'ANNUAL' ? 'Start Yearly Plan' : 'Start Monthly Plan'}
                  </Text>
                  <Text style={styles.subscribeButtonSubtext}>
                    7-day free trial, then {selectedPeriod === 'ANNUAL' ? getPrice('ANNUAL') + '/year' : getPrice('MONTHLY') + '/mo'}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Comparison Table */}
          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonTitle}>Feature Comparison</Text>
            <View style={styles.comparisonTable}>
              <View style={[styles.comparisonRow, styles.comparisonHeaderRow]}>
                <Text style={styles.comparisonHeaderLabel}>Feature</Text>
                <Text style={styles.comparisonHeaderValue}>Free</Text>
                <Text style={styles.comparisonHeaderValuePro}>Pro</Text>
              </View>

              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Daily Chats</Text>
                <Text style={styles.comparisonFree}>10</Text>
                <Text style={styles.comparisonProValue}>Unlimited</Text>
              </View>

              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Interviews</Text>
                <Text style={styles.comparisonFree}>1/day</Text>
                <Text style={styles.comparisonProValue}>Unlimited</Text>
              </View>

              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>AI Model</Text>
                <Text style={styles.comparisonFree}>GPT-3.5</Text>
                <Text style={styles.comparisonProValue}>GPT-5</Text>
              </View>

              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Voice Chat</Text>
                <Icon name="close" size={20} color={colors.textTertiary} style={styles.comparisonFreeIcon} />
                <Icon name="check" size={20} color="#6A11CB" style={styles.comparisonProIcon} />
              </View>

              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Ad-Free</Text>
                <Icon name="close" size={20} color={colors.textTertiary} style={styles.comparisonFreeIcon} />
                <Icon name="check" size={20} color="#6A11CB" style={styles.comparisonProIcon} />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={loading}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            • Cancel anytime through your platform's subscription settings.{'\n'}
            • Payment will be charged to your account after the trial period.{'\n'}
            • Terms of Service and Privacy Policy apply.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: -20, // Overlap with header
  },

  // Plan Selection Styles
  planSelectionContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planOptionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: isDarkMode ? colors.border : 'transparent',
  },
  planOptionCardSelected: {
    borderColor: '#6A11CB',
    backgroundColor: 'rgba(106, 17, 203, 0.1)', // Transparent purple works on both light and dark
  },
  planOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6A11CB',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6A11CB',
  },
  planOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  planOptionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  planOptionPriceContainer: {
    alignItems: 'flex-end',
  },
  planOptionPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  planOptionPeriod: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  savingsBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#FFC700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#333', // Always dark text on yellow badge
  },

  // Features List
  featuresListContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: isDarkMode ? 1 : 0,
    borderColor: colors.border,
  },
  featuresListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },

  // Subscribe Button
  subscribeButton: {
    borderRadius: 16,
    shadowColor: '#FF9A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  subscribeButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  buttonContent: {
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#333', // Always dark on orange/gold button
    marginBottom: 2,
  },
  subscribeButtonSubtext: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
  },

  // Comparison Table
  comparisonCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: isDarkMode ? 1 : 0,
    borderColor: colors.border,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  comparisonTable: {
    gap: 0,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? colors.border : '#F5F5F5',
  },
  comparisonHeaderRow: {
    borderBottomWidth: 2,
    borderBottomColor: isDarkMode ? colors.border : '#EEE',
    paddingBottom: 12,
    marginBottom: 4,
  },
  comparisonHeaderLabel: {
    flex: 2,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  comparisonHeaderValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  comparisonHeaderValuePro: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#6A11CB',
    textAlign: 'center',
  },
  comparisonLabel: {
    flex: 2,
    fontSize: 14,
    color: colors.text,
  },
  comparisonFree: {
    flex: 1,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  comparisonProValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#6A11CB',
    textAlign: 'center',
  },
  comparisonFreeIcon: {
    flex: 1,
    textAlign: 'center',
  },
  comparisonProIcon: {
    flex: 1,
    textAlign: 'center',
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  restoreText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
  benefitsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  proBenefitsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6A11CB',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: colors.text,
  },
  benefitsTitlePro: {
    color: '#6A11CB',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: colors.text,
  },
  manageButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  manageGradient: {
    padding: 16,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  testProButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'center',
  },
  testProText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default SubscriptionScreen;
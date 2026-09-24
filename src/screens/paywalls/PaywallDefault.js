// Paywall Variant: DEFAULT (Control)
// Simple, clean design with 3 pricing options

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import paywallService from '../../services/paywallService';

const PaywallDefault = ({ onClose, onSuccess }) => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadPackages();
    paywallService.trackPaywallView('default');
  }, []);

  const loadPackages = async () => {
    try {
      const pkgs = paywallService.getPackages();
      setPackages(pkgs);
      
      // Pre-select monthly package
      const monthly = pkgs.find(p => p.packageType === 'MONTHLY');
      setSelectedPackage(monthly || pkgs[0]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load subscription options');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setPurchasing(true);
    const result = await paywallService.purchase(selectedPackage);
    setPurchasing(false);

    if (result.success) {
      Alert.alert(
        '🎉 Welcome to Premium!',
        'Your subscription is now active. Enjoy unlimited access!',
        [{ text: 'Start Learning', onPress: () => onSuccess?.() }]
      );
    } else if (!result.cancelled) {
      Alert.alert('Purchase Failed', result.error || 'Please try again');
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    const result = await paywallService.restorePurchases();
    setLoading(false);

    if (result.success && result.isPro) {
      Alert.alert(
        'Subscription Restored!',
        'Your premium access has been restored.',
        [{ text: 'Continue', onPress: () => onSuccess?.() }]
      );
    } else {
      Alert.alert('No Subscription Found', 'No active subscription to restore.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8a46ff" />
      </View>
    );
  }

  const features = [
    { icon: 'chatbubbles', text: 'Unlimited Conversations' },
    { icon: 'mic', text: 'Voice Practice Included' },
    { icon: 'book', text: 'All 20+ Scenarios' },
    { icon: 'person', text: 'Personalized Learning' },
    { icon: 'stats-chart', text: 'Progress Tracking' },
    { icon: 'close-circle', text: 'No Ads Ever' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6e3ff0', '#8a46ff']}
        style={styles.gradient}
      >
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock your full language learning potential
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Icon name={feature.icon} size={24} color="#FFF" style={styles.featureIcon} />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Options */}
          <View style={styles.packagesContainer}>
            {packages.map((pkg) => {
              const details = paywallService.getPackageDetails(pkg);
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const isPopular = pkg.packageType === 'ANNUAL';

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    isSelected && styles.packageCardSelected,
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  {isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>BEST VALUE</Text>
                    </View>
                  )}
                  
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageTitle}>
                      {details.period === 'ANNUAL' ? 'Annual Plan' : 'Monthly Plan'}
                    </Text>
                    <Text style={styles.packagePrice}>{details.price}</Text>
                  </View>
                  
                  {details.period === 'ANNUAL' && (
                    <Text style={styles.packageSavings}>Save 40%</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
            onPress={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.ctaButtonText}>Start Premium</Text>
            )}
          </TouchableOpacity>

          {/* Restore Button */}
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <Text style={styles.restoreText}>Restore Purchase</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            Cancel anytime. Auto-renews unless cancelled.
          </Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 12,
    width: 24,
  },
  featureText: {
    fontSize: 16,
    color: '#FFF',
    flex: 1,
  },
  packagesContainer: {
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardSelected: {
    borderColor: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  packageSavings: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 4,
  },
  ctaButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8a46ff',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PaywallDefault;

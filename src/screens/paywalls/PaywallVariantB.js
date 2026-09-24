// Paywall Variant B: FEATURE COMPARISON
// Free vs Premium comparison table

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

const PaywallVariantB = ({ onClose, onSuccess }) => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadPackages();
    paywallService.trackPaywallView('variant_b');
  }, []);

  const loadPackages = async () => {
    try {
      const pkgs = paywallService.getPackages();
      setPackages(pkgs);
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
        '🎉 Upgrade Complete!',
        'You now have full access to all premium features!',
        [{ text: 'Get Started', onPress: () => onSuccess?.() }]
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
        'Your premium features are now active.',
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

  const comparisonFeatures = [
    { name: 'Daily Conversations', free: '5', premium: 'Unlimited' },
    { name: 'Voice Practice', free: 'close', premium: 'checkmark' },
    { name: 'All Scenarios', free: 'Limited', premium: '20+' },
    { name: 'AI Corrections', free: 'close', premium: 'checkmark' },
    { name: 'Progress Tracking', free: 'Basic', premium: 'Advanced' },
    { name: 'Ads', free: 'Yes', premium: 'None' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6e3ff0', '#8a46ff']}
        style={styles.gradient}
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Compare Plans</Text>
          <Text style={styles.subtitle}>
            See what you're missing
          </Text>

          {/* Comparison Table */}
          <View style={styles.comparisonTable}>
            <View style={styles.tableHeader}>
              <View style={styles.headerCell} />
              <View style={styles.headerCell}>
                <Text style={styles.headerText}>Free</Text>
              </View>
              <View style={[styles.headerCell, styles.premiumHeader]}>
                <Text style={styles.headerTextPremium}>Premium</Text>
              </View>
            </View>

            {comparisonFeatures.map((feature, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.featureNameCell}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                </View>
                <View style={styles.valueCell}>
                  {feature.free === 'close' ? (
                    <Icon name="close" size={20} color="#999" />
                  ) : feature.free === 'checkmark' ? (
                    <Icon name="checkmark" size={20} color="#4CAF50" />
                  ) : (
                    <Text style={styles.valueText}>{feature.free}</Text>
                  )}
                </View>
                <View style={[styles.valueCell, styles.premiumCell]}>
                  {feature.premium === 'close' ? (
                    <Icon name="close" size={20} color="#999" />
                  ) : feature.premium === 'checkmark' ? (
                    <Icon name="checkmark" size={20} color="#8a46ff" />
                  ) : (
                    <Text style={styles.valueTextPremium}>{feature.premium}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Pricing Selection */}
          <Text style={styles.pricingTitle}>Choose Your Plan</Text>
          <View style={styles.packagesContainer}>
            {packages.map((pkg) => {
              const details = paywallService.getPackageDetails(pkg);
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const savings = pkg.packageType === 'ANNUAL' ? '40%' : 
                            pkg.packageType === 'MONTHLY' ? '0%' : '0%';

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    isSelected && styles.packageCardSelected,
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  <View style={styles.packageLeft}>
                    <View style={styles.radioButton}>
                      {isSelected && <View style={styles.radioButtonInner} />}
                    </View>
                    <View>
                      <Text style={styles.packageTitle}>
                        {details.period === 'ANNUAL' ? 'Annual Plan' : 'Monthly Plan'}
                      </Text>
                      {savings !== '0%' && (
                        <Text style={styles.packageSavings}>Save {savings}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.packagePrice}>{details.price}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
            onPress={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.ctaButtonText}>Upgrade Now</Text>
            )}
          </TouchableOpacity>

          <View style={styles.guaranteeBox}>
            <Text style={styles.guaranteeText}>
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="checkmark-circle" size={18} color="#4CAF50" style={{ marginRight: 6 }} />
                <Text style={styles.guaranteeText}>7-Day Money-Back Guarantee</Text>
              </View>
            </Text>
          </View>

          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <Text style={styles.restoreText}>Restore Purchase</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Auto-renews • Cancel anytime from App Store
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
    marginBottom: 24,
  },
  comparisonTable: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 32,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  premiumHeader: {
    backgroundColor: '#8a46ff',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  headerTextPremium: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureNameCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  featureName: {
    fontSize: 14,
    color: '#333',
  },
  valueCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCell: {
    backgroundColor: 'rgba(138, 70, 255, 0.1)',
  },
  valueText: {
    fontSize: 14,
    color: '#666',
  },
  valueTextPremium: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8a46ff',
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  packagesContainer: {
    marginBottom: 20,
  },
  packageCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardSelected: {
    borderColor: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  packageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  packageSavings: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 2,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
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
  guaranteeBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  guaranteeText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    flex: 1,
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
  },
});

export default PaywallVariantB;

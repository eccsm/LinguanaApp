// Paywall Variant A: SOCIAL PROOF
// Emphasizes testimonials, user count, ratings

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

const PaywallVariantA = ({ onClose, onSuccess }) => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadPackages();
    paywallService.trackPaywallView('variant_a');
  }, []);

  const loadPackages = async () => {
    try {
      const pkgs = paywallService.getPackages();
      setPackages(pkgs);
      const annual = pkgs.find(p => p.packageType === 'ANNUAL');
      setSelectedPackage(annual || pkgs[0]);
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
        'Join 10,000+ learners achieving fluency!',
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
        'Welcome back! Your premium access is active.',
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

  const testimonials = [
    { name: 'Sarah M.', text: 'Became conversational in 3 months!', rating: 5 },
    { name: 'James K.', text: 'Best language app I\'ve ever used.', rating: 5 },
    { name: 'Maria L.', text: 'Voice feature is game-changing!', rating: 5 },
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
          {/* Social Proof Header */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Active Learners</Text>
            </View>
            <View style={styles.statItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.statNumber}>4.9</Text>
                <Icon name="star" size={20} color="#FFD700" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.statLabel}>App Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>20+</Text>
              <Text style={styles.statLabel}>Languages</Text>
            </View>
          </View>

          <Text style={styles.title}>Join Successful Learners</Text>
          <Text style={styles.subtitle}>
            Thousands are already achieving fluency
          </Text>

          {/* Testimonials */}
          <View style={styles.testimonialsContainer}>
            {testimonials.map((t, i) => (
              <View key={i} style={styles.testimonialCard}>
                <View style={styles.starsRow}>
                  {[...Array(t.rating)].map((_, j) => (
                    <Icon key={j} name="star" size={16} color="#FFD700" style={styles.star} />
                  ))}
                </View>
                <Text style={styles.testimonialText}>"{t.text}"</Text>
                <Text style={styles.testimonialName}>- {t.name}</Text>
              </View>
            ))}
          </View>

          {/* Limited Time Offer */}
          <View style={styles.offerBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="time" size={18} color="#000" style={{ marginRight: 6 }} />
              <Text style={styles.offerText}>Limited Time: Save 40%</Text>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.packagesContainer}>
            {packages.map((pkg) => {
              const details = paywallService.getPackageDetails(pkg);
              const isSelected = selectedPackage?.identifier === pkg.identifier;

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    isSelected && styles.packageCardSelected,
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  <Text style={styles.packageTitle}>
                    {details.period === 'ANNUAL' ? 'Annual Plan' : 'Monthly Plan'}
                  </Text>
                  <Text style={styles.packagePrice}>{details.price}</Text>
                  {details.period === 'ANNUAL' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.packageNote}>Most Popular</Text>
                      <Icon name="star" size={14} color="#FFD700" style={{ marginLeft: 4 }} />
                    </View>
                  )}
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
              <Text style={styles.ctaButtonText}>Start Learning Today</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <Text style={styles.restoreText}>Restore Purchase</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Risk-free • Cancel anytime • Auto-renews
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  title: {
    fontSize: 28,
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
  testimonialsContainer: {
    marginBottom: 24,
  },
  testimonialCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    marginRight: 2,
  },
  testimonialText: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  testimonialName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  offerBanner: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  offerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  packagesContainer: {
    marginBottom: 20,
  },
  packageCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageCardSelected: {
    borderColor: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  packageNote: {
    fontSize: 12,
    color: '#FFD700',
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
  },
});

export default PaywallVariantA;

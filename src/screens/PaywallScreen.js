// Paywall A/B Test Router
// Automatically shows the correct variant based on RevenueCat Experiments

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useApp } from '../contexts/AppContext';
import paywallService from '../services/paywallService';

// Import all paywall variants
import PaywallDefault from './paywalls/PaywallDefault';
import PaywallVariantA from './paywalls/PaywallVariantA';
import PaywallVariantB from './paywalls/PaywallVariantB';
import Logger from '../utils/logger';

const PaywallScreen = ({ navigation }) => {
  const { refreshProfile } = useApp();
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVariant();
  }, []);

  const loadVariant = async () => {
    try {
      // Get which variant to show from RevenueCat
      const variantName = await paywallService.getPaywallVariant();
      setVariant(variantName);
    } catch (error) {
      Logger.error('Failed to load variant:', error);
      setVariant('default'); // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleSuccess = async () => {
    // User purchased successfully - refresh profile to update premium status
    Logger.info('Purchase successful, refreshing profile');
    await refreshProfile();
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8a46ff" />
      </View>
    );
  }

  // Show the appropriate variant
  switch (variant) {
    case 'variant_a':
      return <PaywallVariantA onClose={handleClose} onSuccess={handleSuccess} />;

    case 'variant_b':
      return <PaywallVariantB onClose={handleClose} onSuccess={handleSuccess} />;

    case 'default':
    default:
      return <PaywallDefault onClose={handleClose} onSuccess={handleSuccess} />;
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8a46ff',
  },
});

export default PaywallScreen;

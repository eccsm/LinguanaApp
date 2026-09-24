// RevenueCat Paywall Service with A/B Testing
// Handles subscriptions, paywalls, and experiments

import Purchases from 'react-native-purchases';
import Logger from '../utils/logger';
import { Platform } from 'react-native';

const REVENUECAT_API_KEYS = {
  ios: 'test_zrbJsyRUoigVWWpXpdGYSLWUbWO', // Replace with your iOS key
  android: 'goog_xpsqqrvVoqiuZNkZmbdzvIMgxtP', // Replace with your Android key
};

const isTestStoreKey = apiKey => apiKey?.startsWith('test_');

class PaywallService {
  constructor() {
    this.isInitialized = false;
    this.offerings = null;
    this.customerInfo = null;
  }

  /**
   * Initialize RevenueCat SDK
   * Call this once when app starts
   */
  async initialize(userId) {
    if (this.isInitialized) return;

    try {
      const apiKey = Platform.select(REVENUECAT_API_KEYS);

      // RevenueCat intentionally crashes release builds configured with a Test
      // Store key. Refuse to configure the native SDK instead of taking down
      // the whole app if a production key is missing or misconfigured.
      if (!apiKey || (!__DEV__ && isTestStoreKey(apiKey))) {
        Logger.withCategory('PAYWALL').error(
          `RevenueCat ${Platform.OS} production API key is missing or uses the Test Store`,
        );
        return false;
      }

      // Configure SDK
      Purchases.configure({ apiKey, appUserID: userId });

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      }

      this.isInitialized = true;
      Logger.withCategory('PAYWALL').info('✅ RevenueCat initialized', { userId });

      // Load offerings and customer info
      await this.refreshData();
      return true;
    } catch (error) {
      Logger.withCategory('PAYWALL').error('Failed to initialize RevenueCat', error);
      throw error;
    }
  }

  /**
   * Refresh offerings and customer info
   */
  async refreshData() {
    try {
      // Get current offerings (products)
      this.offerings = await Purchases.getOfferings();

      // Get customer subscription status
      this.customerInfo = await Purchases.getCustomerInfo();

      Logger.withCategory('PAYWALL').info('Data refreshed', {
        hasOfferings: !!this.offerings?.current,
        isPro: this.isPro(),
      });
    } catch (error) {
      Logger.withCategory('PAYWALL').error('Failed to refresh data', error);
    }
  }

  /**
   * Check if user is premium subscriber
   */
  isPro() {
    if (!this.customerInfo) return false;

    // Check if user has active "pro" entitlement
    return (
      typeof this.customerInfo.entitlements.active.pro !== 'undefined' ||
      typeof this.customerInfo.entitlements.active.premium !== 'undefined'
    );
  }

  /**
   * Get all available subscription packages
   */
  getPackages() {
    if (!this.offerings?.current) {
      Logger.withCategory('PAYWALL').warn('No offerings available');
      return [];
    }

    const packages = this.offerings.current.availablePackages;

    // Sort by duration: monthly first, then annual
    return packages.sort((a, b) => {
      const order = { MONTHLY: 0, ANNUAL: 1 };
      return (order[a.packageType] || 999) - (order[b.packageType] || 999);
    });
  }

  /**
   * Purchase a package
   */
  async purchase(pkg) {
    try {
      Logger.withCategory('PAYWALL').info('Starting purchase', {
        packageId: pkg.identifier,
      });

      const { customerInfo } = await Purchases.purchasePackage(pkg);

      this.customerInfo = customerInfo;

      const isPro = this.isPro();
      Logger.withCategory('PAYWALL').info('Purchase complete', { isPro });

      return {
        success: true,
        isPro,
        customerInfo,
      };
    } catch (error) {
      if (error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        Logger.withCategory('PAYWALL').info('Purchase cancelled by user');
        return { success: false, cancelled: true };
      }

      Logger.withCategory('PAYWALL').error('Purchase failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore purchases (for users who already subscribed)
   */
  async restorePurchases() {
    try {
      Logger.withCategory('PAYWALL').info('Restoring purchases...');

      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;

      const isPro = this.isPro();
      Logger.withCategory('PAYWALL').info('Restore complete', { isPro });

      return { success: true, isPro };
    } catch (error) {
      Logger.withCategory('PAYWALL').error('Restore failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current paywall variant for A/B testing
   * Uses RevenueCat Experiments
   */
  async getPaywallVariant() {
    try {
      // Check if there's an active experiment
      const currentOffering = this.offerings?.current;

      if (!currentOffering) {
        return 'default';
      }

      // Get metadata (you can set this in RevenueCat dashboard)
      const metadata = currentOffering.metadata || {};

      // Return variant name (e.g., 'control', 'variant_a', 'variant_b')
      return metadata.variant || 'default';
    } catch (error) {
      Logger.withCategory('PAYWALL').error('Failed to get variant', error);
      return 'default';
    }
  }

  /**
   * Track paywall view for analytics
   */
  trackPaywallView(variant) {
    Logger.withCategory('PAYWALL').info('Paywall viewed', { variant });

    // You can also send this to your analytics service
    // analyticsService.track('paywall_viewed', { variant });
  }

  /**
   * Get subscription details (price, period, etc.)
   */
  getPackageDetails(pkg) {
    return {
      identifier: pkg.identifier,
      price: pkg.product.priceString,
      period: pkg.packageType,
      introPrice: pkg.product.introPrice?.priceString || null,
      trialPeriod: pkg.product.introPrice?.period || null,
    };
  }
}

// Export singleton
const paywallService = new PaywallService();
export default paywallService;

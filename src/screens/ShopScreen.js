import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
  FlatList,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useGamification } from '../features/GamificationFeatures';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import { useApp } from '../contexts/AppContext'; // Assuming useApp is needed for user/userProfile
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Logger from '../utils/logger';
import Haptics from '../utils/haptics';
import { COLORS } from '../constants/theme';
import Purchases from 'react-native-purchases';
// Using MaterialCommunityIcons for better game assets
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ChangePreferredLanguageModal from '../components/ChangePreferredLanguageModal';
import NativeLanguageExamModal from '../components/NativeLanguageExamModal';
import MysteryEggModal from '../components/MysteryEggModal';
import PurchasePackModal, { SCENARIO_PACKS } from '../components/PurchasePackModal';

// Avatar images from assets
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

// --- SHOP DATA CONFIGURATION ---
const SHOP_CATEGORIES = [
  {
    id: 'consumables',
    title: 'Essential Supplies',
    icon: 'bag-personal', // Category Icon
    data: [
      {
        id: 'streak_freeze',
        name: 'Streak Freeze',
        iconName: 'snowflake',
        iconColor: '#3b82f6', // Blue
        bgColor: '#eff6ff', // Light Blue
        description: 'Miss a day without losing your streak.',
        cost: 100,
        inventoryKey: 'streakFreeze',
        badge: null,
      },
      {
        id: 'heart_refill',
        name: 'Heart Refill',
        iconName: 'heart',
        iconColor: '#ef4444', // Red
        bgColor: '#fef2f2', // Light Red
        description: 'Restore 3 lives instantly.',
        cost: 300,
        inventoryKey: 'heartRefill',
        badge: 'POPULAR',
      },
      {
        id: 'name_change',
        name: 'Name Token',
        iconName: 'card-account-details-outline',
        iconColor: '#3B82F6', // Blue
        bgColor: '#EFF6FF', // Light Blue
        description: 'Change your username once.',
        cost: 500,
        inventoryKey: 'nameChangeToken',
        badge: null,
      },
      {
        id: 'change_preferred_language',
        name: 'Change Learning Lang',
        iconName: 'book-open-variant',
        iconColor: '#10B981', // Green
        bgColor: '#ECFDF5', // Light Green
        description: 'Switch which language you want to learn.',
        cost: 10,
        inventoryKey: 'preferredLanguageChange',
        isInstantUse: true,
        customHandler: 'showPreferredLanguageChange',
        badge: null,
      },
      {
        id: 'change_native_language',
        name: 'Change Native Lang',
        iconName: 'translate',
        iconColor: '#8B5CF6', // Purple
        bgColor: '#F5F3FF', // Light Purple
        description: 'Pass a proficiency exam to prove fluency.',
        cost: 25,
        inventoryKey: 'nativeLanguageChange',
        isInstantUse: true,
        customHandler: 'showNativeLanguageExam',
        badge: 'EXAM',
      },
      {
        id: 'time_warp_key',
        name: 'Time Warp Key',
        iconName: 'key-variant',
        iconColor: '#F59E0B', // Amber/Gold
        bgColor: '#FFFBEB', // Light Amber
        description: 'Unlock a skipped puzzle day to play it anytime.',
        cost: 100,
        inventoryKey: 'timeWarpKey',
        badge: 'NEW',
      },
    ],
  },
  {
    id: 'boosts',
    title: 'Power-Ups',
    icon: 'lightning-bolt',
    data: [
      {
        id: 'xp_potion',
        name: 'XP Potion',
        iconName: 'bottle-tonic-plus',
        iconColor: '#a855f7', // Purple
        bgColor: '#faf5ff',
        description: 'Double XP for 30 mins.',
        cost: 150,
        inventoryKey: 'xpPotion',
        badge: 'HOT',
      },
      {
        id: 'streak_repair',
        name: 'Streak Repair',
        iconName: 'shield-check',
        iconColor: '#64748b', // Slate
        bgColor: '#f8fafc',
        description: 'Repair a broken streak (48h limit).',
        cost: 1000,
        inventoryKey: 'streakRepair',
        badge: null,
      },
    ],
  },
  {
    id: 'cosmetics',
    title: 'Style & Themes',
    icon: 'palette',
    data: [
      {
        id: 'frame_gold',
        name: 'Gold Frame',
        iconName: 'image-frame',
        iconColor: '#f59e0b', // Amber
        bgColor: '#fffbeb',
        description: 'A shiny golden border.',
        cost: 1000,
        inventoryKey: 'frameGold',
        badge: 'LEGENDARY',
        isOneTimePurchase: true, // Can only own one
      },
      {
        id: 'theme_cyber',
        name: 'Cyberpunk',
        iconName: 'city-variant-outline',
        iconColor: '#ec4899', // Pink
        bgColor: '#fdf2f8',
        description: 'Neon night theme.',
        cost: 800,
        inventoryKey: 'themeCyber',
        badge: 'NEW',
        isOneTimePurchase: true, // Theme - can only own one
      },
    ],
  },
  {
    id: 'mystery_eggs',
    title: 'Mystery Eggs',
    icon: 'egg-easter',
    data: [
      {
        id: 'standard_egg',
        name: 'Standard Egg',
        iconName: 'egg',
        iconColor: '#D2691E',
        bgColor: '#FFF8DC',
        description: 'Exclusive avatars not in shop! 40% Rare, 60% Legendary',
        cost: 5000,
        currency: 'gems', // Can also buy with gems
        priceDollars: 0.99,
        productId: 'com.linguana.standard_egg', // RevenueCat product ID
        eggType: 'standard',
        badge: '💰 ONLY $0.99',
        isEgg: true,
        isPremiumEgg: true,
      },
      {
        id: 'royal_egg',
        name: 'Royal Egg',
        iconName: 'egg-easter',
        iconColor: '#FFD700',
        bgColor: '#FFF8E1',
        description: '100% Legendary! Best avatars only.',
        priceDollars: 2.99,
        productId: 'com.linguana.royal_egg', // RevenueCat product ID
        eggType: 'royal',
        badge: '👑 BEST VALUE',
        isEgg: true,
        isPremiumEgg: true,
        usdOnly: true, // Cannot buy with gems
      },
    ],
  },
  {
    id: 'scenario_packs',
    title: 'Scenario Packs',
    icon: 'package-variant',
    data: [
      {
        id: 'pack_travel',
        name: 'Traveler Pack',
        iconName: 'airplane',
        iconColor: '#3B82F6',
        bgColor: '#DBEAFE',
        description: 'Airport, Hotel, Taxi & Directions',
        priceDollars: 1.99,
        priceGems: 1000,
        packId: 'travel',
        badge: '✈️ POPULAR',
        isPack: true,
      },
      {
        id: 'pack_dating',
        name: 'Flirting & Dating',
        iconName: 'heart',
        iconColor: '#EC4899',
        bgColor: '#FCE7F3',
        description: 'First Date & Pickup Lines',
        priceDollars: 1.99,
        priceGems: 1000,
        packId: 'dating',
        badge: '💕 NEW',
        isPack: true,
      },
      // Note: Business pack removed - Interview content accessed via dedicated Business card
      {
        id: 'pack_social',
        name: 'Social Butterfly',
        iconName: 'butterfly',
        iconColor: '#10B981',
        bgColor: '#D1FAE5',
        description: 'Small Talk & Phone Calls',
        priceDollars: 1.49,
        priceGems: 750,
        packId: 'social',
        badge: null,
        isPack: true,
      },
      {
        id: 'pack_professional',
        name: 'Health & Services',
        iconName: 'hospital-box',
        iconColor: '#EF4444',
        bgColor: '#FEE2E2',
        description: 'Doctor Visits',
        priceDollars: 1.49,
        priceGems: 750,
        packId: 'professional',
        badge: null,
        isPack: true,
      },
    ],
  },
  {
    id: 'avatars',
    title: 'Starter Avatars',
    icon: 'account-circle',
    data: [
      {
        id: 'avatar_gecko',
        name: 'Gecko',
        image: AVATAR_IMAGES.avatar_gecko,
        bgColor: '#dcfce7',
        description: 'A friendly gecko friend.',
        cost: 300,
        inventoryKey: 'avatar_gecko',
        badge: 'STARTER',
        isOneTimePurchase: true,
      },
      {
        id: 'avatar_chameleon',
        name: 'Chammy',
        image: AVATAR_IMAGES.avatar_chameleon,
        bgColor: '#e0f2fe',
        description: 'Master of disguise.',
        cost: 400,
        inventoryKey: 'avatar_chameleon',
        badge: null,
        isOneTimePurchase: true,
      },
      {
        id: 'avatar_chatters',
        name: 'Chatterbox',
        image: AVATAR_IMAGES.avatar_chatters,
        bgColor: '#ccfbf1',
        description: 'Loves to talk!',
        cost: 450,
        inventoryKey: 'avatar_chatters',
        badge: null,
        isOneTimePurchase: true,
      },
    ],
  },
  {
    id: 'exchange',
    title: 'Currency Exchange',
    icon: 'bank-transfer',
    data: [
      {
        id: 'gems_small',
        name: '50 Gems',
        iconName: 'diamond-stone',
        iconColor: '#06b6d4',
        bgColor: '#ecfeff',
        description: 'A starting amount of gems.',
        cost: 500,
        currency: 'xp',
        rewardAmount: 50,
        inventoryKey: 'gems',
        badge: null,
        allowQuantity: true,
      },
      {
        id: 'gems_large',
        name: '110 Gems',
        iconName: 'diamond-stone',
        iconColor: '#06b6d4',
        bgColor: '#ecfeff',
        description: 'Best value exchange!',
        cost: 1000,
        currency: 'xp',
        rewardAmount: 110,
        inventoryKey: 'gems',
        badge: 'BONUS',
        allowQuantity: true,
      },
    ],
  },
];

const ShopScreen = ({ navigation }) => {
  const { stats } = useGamification();
  const { colors, isDarkMode } = useTheme();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { user, userProfile } = useApp(); // Assuming useApp provides user and userProfile
  const [loading, setLoading] = useState(false);
  const [showPreferredLangModal, setShowPreferredLangModal] = useState(false);
  const [showNativeExamModal, setShowNativeExamModal] = useState(false);
  // Mystery Egg Modal State
  const [showEggModal, setShowEggModal] = useState(false);
  const [selectedEggType, setSelectedEggType] = useState('common');
  // Scenario Pack Modal State
  const [showPackModal, setShowPackModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [shopPackages, setShopPackages] = useState({});
  // Quantity Purchase Modal State
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantityItem, setQuantityItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualInputValue, setManualInputValue] = useState('1');
  // Refs for long-press rapid increment/decrement
  const incrementIntervalRef = useRef(null);
  const decrementIntervalRef = useRef(null);
  // const user = auth().currentUser; // This line is now replaced by useApp()

  // RC Package Mapping
  const RC_PACKAGES = {
    'standard_egg': 'egg_standart', // RC typo
    'royal_egg': 'egg_royal',
    'travel': 'pack_travel',
    'social': 'pack_social',
    'professional': 'pack_health',
    'dating': 'pack_dating'
  };

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.all['shop'] && offerings.all['shop'].availablePackages) {
          const packages = {};
          offerings.all['shop'].availablePackages.forEach(pkg => {
            packages[pkg.identifier] = pkg;
          });
          setShopPackages(packages);
        }
      } catch (e) {
        Logger.error('[SHOP] Error fetching offerings', e);
      }
    };
    fetchOfferings();
  }, []);

  // Get owned avatars for duplicate prevention
  const ownedAvatars = Object.keys(stats?.inventory || {}).filter(key => key.startsWith('avatar_') && stats.inventory[key] > 0);

  // --- LOGIC ---
  const handleTestPurchase = async (item) => {
    showAlert(
      'Test Purchase 🛠️',
      `Testing ${item.name} without spending gems.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test It',
          onPress: async () => {
            await processPurchase(item, true);
          },
        },
      ]
    );
  };

  const handlePurchase = async (item) => {
    if (!user) {
      showAlert('Error', 'You must be logged in to make purchases');
      return;
    }

    // Handle custom shop items with special modals
    if (item.customHandler === 'showPreferredLanguageChange') {
      setShowPreferredLangModal(true);
      return;
    }
    if (item.customHandler === 'showNativeLanguageExam') {
      setShowNativeExamModal(true);
      return;
    }

    // Handle Scenario Pack purchase
    if (item.isPack) {
      setSelectedPackId(item.packId);
      setShowPackModal(true);
      return;
    }

    // Handle Mystery Egg purchase
    if (item.isEgg) {
      // USD-only egg (Royal Egg)
      if (item.usdOnly) {
        const rcPackageId = RC_PACKAGES[item.id];
        const rcPackage = shopPackages[rcPackageId];
        const priceString = rcPackage?.product?.priceString || `$${item.priceDollars}`;

        showAlert(
          `Buy ${item.name}?`,
          `Purchase for ${priceString}?\n\n${item.description}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: `Buy ${priceString}`,
              onPress: async () => {
                try {
                  if (!rcPackage) {
                    showAlert('Error', 'Product not available');
                    return;
                  }
                  setLoading(true);
                  await Purchases.purchasePackage(rcPackage);
                  Haptics.success();
                  setSelectedEggType(item.eggType);
                  setShowEggModal(true);
                } catch (error) {
                  if (!error.userCancelled) {
                    Logger.error('[SHOP] IAP purchase failed:', error);
                    showAlert('Error', 'Purchase failed.');
                  }
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
        return;
      }

      // Standard Egg - can buy with gems OR USD
      const userGems = stats.gems || 0;
      const canAffordGems = userGems >= item.cost;

      showAlert(
        `Buy ${item.name}?`,
        `${item.description}\n\nChoose payment method:`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `💎 ${item.cost.toLocaleString()} Gems${!canAffordGems ? ' (Not enough)' : ''}`,
            onPress: async () => {
              if (!canAffordGems) {
                Haptics.error();
                showAlert('Not Enough Gems', `You need ${item.cost.toLocaleString()} gems but only have ${userGems.toLocaleString()}.`);
                return;
              }
              try {
                const userRef = firestore().collection('users').doc(user.uid);
                await userRef.update({
                  gems: firestore.FieldValue.increment(-item.cost),
                });
                Haptics.medium();
                setSelectedEggType(item.eggType);
                setShowEggModal(true);
              } catch (error) {
                Logger.error('[SHOP] Egg purchase failed:', error);
                showAlert('Error', 'Failed to purchase egg.');
              }
            },
          },
          {
            text: `💵 ${shopPackages[RC_PACKAGES[item.id]]?.product?.priceString || '$' + item.priceDollars}`,
            onPress: async () => {
              try {
                const rcPackageId = RC_PACKAGES[item.id];
                const rcPackage = shopPackages[rcPackageId];

                if (!rcPackage) {
                  showAlert('Error', 'Product not available');
                  return;
                }

                setLoading(true);
                await Purchases.purchasePackage(rcPackage);
                Haptics.success();
                setSelectedEggType(item.eggType);
                setShowEggModal(true);
              } catch (error) {
                if (!error.userCancelled) {
                  Logger.error('[SHOP] IAP purchase failed:', error);
                  showAlert('Error', 'Purchase failed.');
                }
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
      return;
    }

    // Check if item is already owned (for one-time purchases)
    const ownedCount = stats.inventory?.[item.inventoryKey] || 0;
    if (item.isOneTimePurchase && ownedCount > 0) {
      Haptics.light();
      showAlert(
        'Already Owned! ✅',
        `You already have the ${item.name}. Go to Profile to use it!`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Check Affordability (Gems or XP)
    const isXpPurchase = item.currency === 'xp';
    const userBalance = isXpPurchase ? (stats.xp || 0) : (stats.gems || 0);
    const currencyName = isXpPurchase ? 'XP' : 'gems';

    if (userBalance < item.cost) {
      Haptics.error();
      showAlert(
        `Not Enough ${currencyName}`,
        `You need ${item.cost} ${currencyName} but only have ${userBalance}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // For stackable consumables OR items with allowQuantity flag (like currency exchange), show quantity modal
    const isStackable = !item.isOneTimePurchase && !item.isInstantUse && item.inventoryKey && item.inventoryKey !== 'gems';
    const shouldShowQuantityModal = isStackable || item.allowQuantity;
    if (shouldShowQuantityModal) {
      setQuantityItem(item);
      setQuantity(1);
      setShowQuantityModal(true);
      return;
    }

    // For non-stackable items, show simple confirmation
    showAlert(
      'Confirm Purchase',
      `Buy ${item.name} for ${item.cost} ${currencyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            await processPurchase(item, false, 1);
          },
        },
      ]
    );
  };

  const processPurchase = async (item, isTest = false, purchaseQuantity = 1) => {
    setLoading(true);
    Haptics.light();

    const totalCost = item.cost * purchaseQuantity;

    try {
      const userRef = firestore().collection('users').doc(user.uid);

      await firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error('User document not found');

        const userData = userDoc.data();
        const isXpPurchase = item.currency === 'xp';

        // Validate Balance
        if (!isTest) {
          const currentBalance = isXpPurchase ? (userData.xp || 0) : (userData.gems || 0);
          if (currentBalance < totalCost) throw new Error(`Insufficient ${isXpPurchase ? 'XP' : 'gems'}`);
        }

        // Prepare update data
        let updateData = {};

        // 1. DEDUCT COST (multiplied by quantity)
        if (!isTest) {
          if (isXpPurchase) {
            updateData.xp = firestore.FieldValue.increment(-totalCost);
          } else {
            updateData.gems = firestore.FieldValue.increment(-totalCost);
          }
        }

        // 2. GRANT REWARD (multiplied by quantity for stackable items)
        if (item.inventoryKey === 'gems') {
          // Direct Gem Grant (from XP exchange)
          updateData.gems = firestore.FieldValue.increment((item.rewardAmount || 0) * purchaseQuantity);
        } else if (item.id === 'xp_boost') {
          updateData['xp'] = firestore.FieldValue.increment(100 * purchaseQuantity);
        } else if (!item.isInstantUse && item.inventoryKey) {
          // Standard Inventory Item - increment by quantity (includes heart_refill)
          updateData[`inventory.${item.inventoryKey}`] = firestore.FieldValue.increment(purchaseQuantity);
        }

        transaction.update(userRef, updateData);

        Logger.info('[SHOP] Purchase successful:', { item: item.name, quantity: purchaseQuantity, userId: user.uid });
      });

      Haptics.success();

      // Determine if this item goes to inventory (not gems/instant use)
      const isInventoryItem = !item.isInstantUse && item.inventoryKey && item.inventoryKey !== 'gems';

      if (isInventoryItem) {
        // Show success message with inventory navigation for consumable items
        const itemText = purchaseQuantity > 1 ? `${purchaseQuantity}x ${item.name}` : item.name;
        showAlert(
          'Purchase Complete! 🎉',
          `${itemText} has been added to your inventory.\n\nYou can use it anytime from your Inventory!`,
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Go to Inventory',
              onPress: () => navigation.navigate('Inventory'),
            },
          ],
          { type: 'success' }
        );
      } else {
        // Simple success for gems/instant items
        const successMsg = purchaseQuantity > 1
          ? `You got ${purchaseQuantity}x ${item.name}!`
          : `You got ${item.name}!`;
        showAlert('Success!', successMsg, [{ text: 'OK' }], { type: 'success' });
      }
    } catch (error) {
      Haptics.error();
      Logger.error(error);
      showAlert('Purchase Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER COMPONENTS ---

  const renderStatsCard = () => (
    <View style={[styles.statsGrid, { backgroundColor: colors.card }]}>
      <View style={styles.statItem}>
        <Icon name="diamond-stone" size={24} color="#06b6d4" style={{ marginBottom: 4 }} />
        <Text style={[styles.statValue, { color: colors.text }]}>{stats.gems}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gems</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Icon name="fire" size={24} color="#f97316" style={{ marginBottom: 4 }} />
        <Text style={[styles.statValue, { color: colors.text }]}>{stats.currentStreak || 0}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Icon name="star-circle" size={24} color="#10B981" style={{ marginBottom: 4 }} />
        <Text style={[styles.statValue, { color: colors.text }]}>{stats.xp || 0}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>XP</Text>
      </View>
    </View>
  );

  const renderItemCard = ({ item }) => {
    const isXpPurchase = item.currency === 'xp';
    const userBalance = isXpPurchase ? (stats.xp || 0) : (stats.gems || 0);
    const canAfford = userBalance >= item.cost;
    const ownedCount = stats.inventory?.[item.inventoryKey] || 0;
    // Check if it's a one-time purchase inventory item that's already owned
    const isOwnedOneTimeItem = item.isOneTimePurchase && ownedCount > 0;
    // Check if it's a scenario pack that's already owned (or user is premium/pro)
    const isPro = userProfile?.subscriptionTier === 'pro';
    const isOwnedPack = item.packId && (userProfile?.ownedPacks?.[item.packId] || isPro);
    // Combined check for any owned one-time item (inventory or pack)
    const isOwnedOneTime = isOwnedOneTimeItem || isOwnedPack;

    return (
      <TouchableOpacity
        activeOpacity={isOwnedOneTime ? 1 : 0.9}
        onPress={() => !isOwnedOneTime && handlePurchase(item)}
        style={[
          styles.cardContainer,
          { backgroundColor: colors.card },
          isOwnedOneTime && styles.cardContainerOwned,
        ]}
        disabled={loading || isOwnedOneTime}
      >
        {/* Badge (Hot/New) - hide if owned */}
        {item.badge && !isOwnedOneTime && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}

        {/* Owned Counter / OWNED badge for one-time purchases */}
        {isOwnedOneTime && (
          <View style={styles.ownedBadge}>
            <Icon name="check-circle" size={12} color="#FFF" style={{ marginRight: 2 }} />
            <Text style={styles.ownedBadgeText}>OWNED</Text>
          </View>
        )}
        {ownedCount > 0 && !item.isOneTimePurchase && item.id !== 'heart_refill' && item.inventoryKey !== 'gems' && (
          <View style={styles.ownedContainer}>
            <Text style={styles.ownedText}>x{ownedCount}</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.cardContent}>
          {/* THE ICON CONTAINER: Image for avatars, Icon for others */}
          <View style={[
            styles.iconContainer,
            { backgroundColor: item.image ? 'transparent' : item.bgColor },
            isOwnedOneTime && { opacity: 0.6 }
          ]}>
            {item.image ? (
              <Image source={item.image} style={styles.avatarImage} resizeMode="contain" />
            ) : (
              <Icon name={item.iconName} size={32} color={item.iconColor} />
            )}
          </View>

          <Text style={[styles.cardName, { color: colors.text }, isOwnedOneTime && { opacity: 0.6 }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        {/* Price Button - show "Owned" for owned one-time items */}
        {isOwnedOneTime ? (
          <View style={[styles.priceButton, styles.priceButtonOwned]}>
            <Icon name="check-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
            <Text style={[styles.priceText, { color: '#10B981' }]}>Owned</Text>
          </View>
        ) : item.isPremiumEgg || item.isPack ? (
          // Premium Egg or Pack pricing display
          <View style={[
            styles.priceButton,
            { borderColor: item.isPack ? '#8B5CF6' : '#FFD700', backgroundColor: item.isPack ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 215, 0, 0.15)' }
          ]}>
            <Text style={[styles.priceText, { color: item.isPack ? '#8B5CF6' : '#FFD700', fontWeight: '700' }]}>
              ${item.priceDollars}
            </Text>
          </View>
        ) : (
          // Normal gem/xp pricing
          <View style={[
            styles.priceButton,
            canAfford
              ? styles.priceButtonActive
              : { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F3F4F6', borderColor: isDarkMode ? 'transparent' : '#E5E7EB' },
            isXpPurchase && canAfford && { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
          ]}>
            <Icon
              name={isXpPurchase ? "star-circle" : "diamond-stone"}
              size={14}
              color={!canAfford ? "#9CA3AF" : (isXpPurchase ? "#10B981" : (isDarkMode ? "#818CF8" : "#4F46E5"))}
              style={{ marginRight: 4 }}
            />
            <Text style={[
              styles.priceText,
              { color: !canAfford ? '#9CA3AF' : (isXpPurchase ? '#10B981' : (isDarkMode ? '#818CF8' : '#4F46E5')) }
            ]}>
              {item.cost} {isXpPurchase ? 'XP' : ''}
            </Text>
          </View>
        )}

      </TouchableOpacity>
    );
  };

  const renderShelf = (category) => (
    <View key={category.id} style={styles.shelfContainer}>
      <View style={styles.shelfHeader}>
        <Icon name={category.icon} size={20} color={colors.text} style={{ marginRight: 8 }} />
        <Text style={[styles.shelfTitle, { color: colors.text }]}>{category.title}</Text>
      </View>
      <FlatList
        data={category.data}
        renderItem={renderItemCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelfScrollContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* 1. CURVED HEADER BACKGROUND */}
      <View style={styles.headerBackgroundContainer} pointerEvents="box-none">
        <LinearGradient
          colors={colors.primaryGradient || COLORS.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        />
      </View>

      {/* Back Button - Fixed position, rendered before SafeAreaView */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backButton, { top: Math.max(insets.top + 10, 20) }]}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Icon name="arrow-left" size={24} color="#FFF" />
      </TouchableOpacity>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 60, 70) }]}
          showsVerticalScrollIndicator={false}
        >

          {/* Header Texts */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Gem Bazaar</Text>
            <Text style={styles.headerSubtitle}>Upgrade your learning journey</Text>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsSection}>
            {renderStatsCard()}
          </View>

          {/* SHELVES (Categories) */}
          <View style={styles.shelvesSection}>
            {SHOP_CATEGORIES.map(category => renderShelf(category))}
          </View>

          {/* Bottom Info */}
          <View style={styles.infoBox}>
            <Icon name="lightbulb-on-outline" size={20} color="#92400E" style={{ marginRight: 12 }} />
            <Text style={styles.infoText}>
              Complete Daily Quests to earn free Gems every day!
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}

      {/* Language Change Modals */}
      <ChangePreferredLanguageModal
        visible={showPreferredLangModal}
        onClose={() => setShowPreferredLangModal(false)}
      />
      <NativeLanguageExamModal
        visible={showNativeExamModal}
        onClose={() => setShowNativeExamModal(false)}
      />

      {/* Mystery Egg Modal */}
      <MysteryEggModal
        visible={showEggModal}
        eggType={selectedEggType}
        ownedAvatars={ownedAvatars}
        onClose={() => setShowEggModal(false)}
        onReveal={async ({ avatar, rarity, isNew, allOwned, gemsReward }) => {
          try {
            const userRef = firestore().collection('users').doc(user.uid);

            if (allOwned && gemsReward) {
              // All avatars owned - grant gems instead
              await userRef.update({
                gems: firestore.FieldValue.increment(gemsReward),
              });

              Haptics.success();
              showAlert(
                '💎 Jackpot!',
                `You already own all avatars! As a bonus, you received ${gemsReward.toLocaleString()} gems!`
              );
            } else if (avatar) {
              // Grant avatar to user inventory
              await userRef.update({
                [`inventory.${avatar.id}`]: firestore.FieldValue.increment(1),
              });

              Haptics.success();

              if (isNew) {
                showAlert(
                  `New ${rarity.toUpperCase()}!`,
                  `You unlocked ${avatar.name}! Equip it in your Profile.`
                );
              } else {
                showAlert(
                  'Duplicate',
                  `You got ${avatar.name} again! (Already owned)`
                );
              }
            }
          } catch (error) {
            Logger.error('[SHOP] Avatar/Gems grant failed:', error);
            showAlert('Error', 'Failed to save reward.');
          }
        }}
      />

      {/* Scenario Pack Modal */}
      <PurchasePackModal
        visible={showPackModal}
        packId={selectedPackId}
        onClose={() => setShowPackModal(false)}
        shopPackages={shopPackages}
        onPurchase={(packId) => {
          Logger.info('[SHOP] Pack purchased:', packId);
          showAlert('Success!', `You unlocked the ${SCENARIO_PACKS[packId]?.name}!`);
        }}
      />

      {/* Quantity Purchase Modal */}
      <Modal
        visible={showQuantityModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          // Cleanup intervals on close
          if (incrementIntervalRef.current) clearInterval(incrementIntervalRef.current);
          if (decrementIntervalRef.current) clearInterval(decrementIntervalRef.current);
          setIsManualInput(false);
          setShowQuantityModal(false);
        }}
      >
        <View style={styles.quantityModalOverlay}>
          <View style={[styles.quantityModalContainer, { backgroundColor: colors.card }]}>
            {quantityItem && (() => {
              // Calculate max affordable quantity
              const userBalance = quantityItem.currency === 'xp' ? stats.xp : stats.gems;
              const maxAffordable = Math.max(1, Math.floor(userBalance / quantityItem.cost));
              const totalCost = quantityItem.cost * quantity;
              const canAfford = userBalance >= totalCost;

              // Long press handlers
              const startIncrement = () => {
                if (incrementIntervalRef.current) return;
                incrementIntervalRef.current = setInterval(() => {
                  setQuantity(q => {
                    if (q < maxAffordable) {
                      Haptics.light();
                      return q + 1;
                    }
                    return q;
                  });
                }, 100);
              };

              const stopIncrement = () => {
                if (incrementIntervalRef.current) {
                  clearInterval(incrementIntervalRef.current);
                  incrementIntervalRef.current = null;
                }
              };

              const startDecrement = () => {
                if (decrementIntervalRef.current) return;
                decrementIntervalRef.current = setInterval(() => {
                  setQuantity(q => {
                    if (q > 1) {
                      Haptics.light();
                      return q - 1;
                    }
                    return q;
                  });
                }, 100);
              };

              const stopDecrement = () => {
                if (decrementIntervalRef.current) {
                  clearInterval(decrementIntervalRef.current);
                  decrementIntervalRef.current = null;
                }
              };

              // Handle manual input submission
              const handleManualInputSubmit = () => {
                const parsed = parseInt(manualInputValue, 10);
                if (!isNaN(parsed) && parsed >= 1) {
                  const clamped = Math.min(parsed, maxAffordable);
                  setQuantity(clamped);
                  setManualInputValue(clamped.toString());
                } else {
                  setManualInputValue(quantity.toString());
                }
                setIsManualInput(false);
              };

              return (
                <>
                  {/* Header */}
                  <View style={styles.quantityModalHeader}>
                    <View style={[styles.quantityItemIcon, { backgroundColor: quantityItem.bgColor }]}>
                      {quantityItem.image ? (
                        <Image source={quantityItem.image} style={{ width: 32, height: 32 }} resizeMode="contain" />
                      ) : (
                        <Icon name={quantityItem.iconName} size={28} color={quantityItem.iconColor} />
                      )}
                    </View>
                    <View style={styles.quantityItemInfo}>
                      <Text style={[styles.quantityItemName, { color: colors.text }]}>{quantityItem.name}</Text>
                      <Text style={[styles.quantityItemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {quantityItem.description}
                      </Text>
                    </View>
                  </View>

                  {/* Quantity Selector */}
                  <View style={styles.quantitySelectorContainer}>
                    <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>Quantity</Text>
                    <View style={styles.quantitySelector}>
                      {/* Minus Button with Long Press */}
                      <TouchableOpacity
                        style={[
                          styles.quantityButton,
                          { backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : '#F3E8FF', borderColor: colors.primary || '#8B5CF6' },
                          quantity <= 1 && { backgroundColor: isDarkMode ? 'rgba(107, 114, 128, 0.2)' : '#F3F4F6', borderColor: isDarkMode ? '#4B5563' : '#E5E7EB' }
                        ]}
                        onPress={() => {
                          if (quantity > 1) {
                            Haptics.light();
                            setQuantity(q => q - 1);
                          }
                        }}
                        onPressIn={() => {
                          if (quantity > 1) startDecrement();
                        }}
                        onPressOut={stopDecrement}
                        disabled={quantity <= 1}
                      >
                        <Icon name="minus" size={20} color={quantity <= 1 ? (isDarkMode ? '#6B7280' : '#9CA3AF') : (colors.primary || '#8B5CF6')} />
                      </TouchableOpacity>

                      {/* Quantity Value - Tappable for Manual Input */}
                      {isManualInput ? (
                        <TextInput
                          style={[styles.quantityInput, { color: colors.text, borderColor: colors.primary || '#8B5CF6', backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : '#FAF5FF' }]}
                          value={manualInputValue}
                          onChangeText={setManualInputValue}
                          keyboardType="number-pad"
                          autoFocus
                          selectTextOnFocus
                          onBlur={handleManualInputSubmit}
                          onSubmitEditing={handleManualInputSubmit}
                          maxLength={6}
                        />
                      ) : (
                        <TouchableOpacity
                          onPress={() => {
                            setManualInputValue(quantity.toString());
                            setIsManualInput(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.quantityValue, { color: colors.text }]}>{quantity}</Text>
                        </TouchableOpacity>
                      )}

                      {/* Plus Button with Long Press */}
                      <TouchableOpacity
                        style={[
                          styles.quantityButton,
                          { backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : '#F3E8FF', borderColor: colors.primary || '#8B5CF6' },
                          quantity >= maxAffordable && { backgroundColor: isDarkMode ? 'rgba(107, 114, 128, 0.2)' : '#F3F4F6', borderColor: isDarkMode ? '#4B5563' : '#E5E7EB' }
                        ]}
                        onPress={() => {
                          if (quantity < maxAffordable) {
                            Haptics.light();
                            setQuantity(q => q + 1);
                          }
                        }}
                        onPressIn={() => {
                          if (quantity < maxAffordable) startIncrement();
                        }}
                        onPressOut={stopIncrement}
                        disabled={quantity >= maxAffordable}
                      >
                        <Icon name="plus" size={20} color={quantity >= maxAffordable ? (isDarkMode ? '#6B7280' : '#9CA3AF') : (colors.primary || '#8B5CF6')} />
                      </TouchableOpacity>
                    </View>
                    {/* Max affordable hint */}
                    <Text style={[styles.quantityHint, { color: colors.textSecondary }]}>
                      Max: {maxAffordable.toLocaleString()} (tap number to type)
                    </Text>
                  </View>

                  {/* Total Cost */}
                  <View style={[styles.quantityTotalContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
                    <Text style={[styles.quantityTotalLabel, { color: colors.textSecondary }]}>Total Cost</Text>
                    <View style={styles.quantityTotalValue}>
                      <Icon
                        name={quantityItem.currency === 'xp' ? 'star-circle' : 'diamond-stone'}
                        size={20}
                        color={quantityItem.currency === 'xp' ? '#10B981' : '#06b6d4'}
                      />
                      <Text style={[styles.quantityTotalText, { color: canAfford ? colors.text : '#EF4444' }]}>
                        {totalCost.toLocaleString()} {quantityItem.currency === 'xp' ? 'XP' : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.quantityButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.quantityCancelButton, { backgroundColor: isDarkMode ? 'rgba(107, 114, 128, 0.2)' : '#F3F4F6' }]}
                      onPress={() => {
                        if (incrementIntervalRef.current) clearInterval(incrementIntervalRef.current);
                        if (decrementIntervalRef.current) clearInterval(decrementIntervalRef.current);
                        setIsManualInput(false);
                        setShowQuantityModal(false);
                      }}
                    >
                      <Text style={[styles.quantityCancelText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quantityConfirmButton, !canAfford && { opacity: 0.5 }]}
                      disabled={!canAfford}
                      onPress={async () => {
                        if (incrementIntervalRef.current) clearInterval(incrementIntervalRef.current);
                        if (decrementIntervalRef.current) clearInterval(decrementIntervalRef.current);
                        setIsManualInput(false);
                        setShowQuantityModal(false);
                        await processPurchase(quantityItem, false, quantity);
                      }}
                    >
                      <LinearGradient
                        colors={COLORS.primaryGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.quantityConfirmGradient}
                      >
                        <Icon name="cart-check" size={18} color="#FFF" />
                        <Text style={styles.quantityConfirmText}>Buy {quantity}x</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Background & Header
  headerBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    zIndex: 0,
  },
  headerGradient: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 10, // For Android
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingTop: 70,
    paddingBottom: 20,
  },

  // Header Texts
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Stats Grid
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },

  // Shelves
  shelvesSection: {
    flex: 1,
  },
  shelfContainer: {
    marginBottom: 24,
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginBottom: 12,
  },
  shelfTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  shelfScrollContent: {
    paddingHorizontal: 20,
    paddingRight: 30, // Extra space at end
  },

  // Item Cards
  cardContainer: {
    width: 150,
    height: 200, // Slightly taller for the icon container
    borderRadius: 20,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
    marginRight: 4,
  },
  cardContainerOwned: {
    opacity: 0.85,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  cardContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  // NEW: The Icon Container Spell
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32, // Perfect Circle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden', // Clip image to circle
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    opacity: 0.8,
  },

  // Card Badges
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  ownedContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  ownedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownedBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // Price Button
  priceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  priceButtonActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)', // Light Indigo
    borderColor: '#4F46E5',
  },
  priceButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  priceButtonOwned: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Footer Info
  infoBox: {
    marginHorizontal: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  testButton: {
    position: 'absolute',
    bottom: 45, // Above price button
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Quantity Purchase Modal Styles
  quantityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  quantityModalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  quantityModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  quantityItemIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quantityItemInfo: {
    flex: 1,
  },
  quantityItemName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  quantityItemDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  quantitySelectorContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.7,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  quantityValue: {
    fontSize: 32,
    fontWeight: '800',
    minWidth: 80,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quantityInput: {
    fontSize: 28,
    fontWeight: '800',
    minWidth: 80,
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 12,
  },
  quantityHint: {
    fontSize: 12,
    marginTop: 10,
    opacity: 0.7,
  },
  quantityTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  quantityTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  quantityTotalValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityTotalText: {
    fontSize: 18,
    fontWeight: '800',
  },
  quantityButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  quantityCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  quantityConfirmButton: {
    flex: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  quantityConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  quantityConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default ShopScreen;
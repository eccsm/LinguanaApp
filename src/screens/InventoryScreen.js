import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGamification } from '../features/GamificationFeatures';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import { useApp } from '../contexts/AppContext';
import { COLORS } from '../constants/theme';
import { GemBadge } from '../components/HeaderBadges';
import shopItemService from '../services/shopItemService';
import firestore from '@react-native-firebase/firestore';
import Haptics from '../utils/haptics';
import Logger from '../utils/logger';

// Inventory item configuration
const INVENTORY_ITEMS = [
    {
        id: 'streak_freeze',
        name: 'Streak Freeze',
        iconName: 'snowflake',
        iconColor: '#3B82F6',
        bgColor: '#EFF6FF',
        description: 'Protects your streak for one day if you miss practice.',
        inventoryKey: 'streakFreeze',
        usable: true,
        useAction: 'useStreakFreeze',
    },
    {
        id: 'heart_refill',
        name: 'Heart Refill',
        iconName: 'heart',
        iconColor: '#EF4444',
        bgColor: '#FEF2F2',
        description: 'Restores 3 lives in Daily Challenge so you can continue.',
        inventoryKey: 'heartRefill',
        usable: true,
        useAction: 'useHeartRefillFromInventory',
    },
    {
        id: 'xp_potion',
        name: 'XP Potion',
        iconName: 'bottle-tonic-plus',
        iconColor: '#A855F7',
        bgColor: '#FAF5FF',
        description: 'Double XP for 30 minutes.',
        inventoryKey: 'xpPotion',
        usable: true,
        useAction: 'useXPPotion',
    },
    {
        id: 'streak_repair',
        name: 'Streak Repair',
        iconName: 'shield-check',
        iconColor: '#64748B',
        bgColor: '#F8FAFC',
        description: 'Repair a broken streak within 48 hours.',
        inventoryKey: 'streakRepair',
        usable: true,
        useAction: 'useStreakRepair',
    },
    {
        id: 'name_change',
        name: 'Name Token',
        iconName: 'card-account-details-outline',
        iconColor: '#3B82F6',
        bgColor: '#EFF6FF',
        description: 'Change your username once. Use in Profile settings.',
        inventoryKey: 'nameChangeToken',
        usable: false,
    },
    {
        id: 'theme_cyber',
        name: 'Cyberpunk Theme',
        iconName: 'city-variant-outline',
        iconColor: '#EC4899',
        bgColor: '#FDF2F8',
        description: 'Neon night theme. Apply in Profile settings.',
        inventoryKey: 'themeCyber',
        usable: false,
    },
    {
        id: 'frame_gold',
        name: 'Gold Frame',
        iconName: 'image-frame',
        iconColor: '#F59E0B',
        bgColor: '#FFFBEB',
        description: 'A shiny golden profile border. Applied automatically.',
        inventoryKey: 'frameGold',
        usable: false,
    },
];

const InventoryScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { stats } = useGamification();
    const { user } = useApp();
    const { colors, isDarkMode } = useTheme();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [loadingItemId, setLoadingItemId] = useState(null);

    const handleUseItem = async (item) => {
        if (!item.usable || !item.useAction) return;

        const owned = stats?.inventory?.[item.inventoryKey] || 0;
        if (owned < 1) {
            Haptics.error();
            showAlert('No Items', `You don't have any ${item.name} to use.`);
            return;
        }

        // Confirm use
        showAlert(
            `Use ${item.name}?`,
            item.description,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Use',
                    onPress: async () => {
                        setLoadingItemId(item.id);
                        Haptics.light();

                        try {
                            let result;
                            switch (item.useAction) {
                                case 'useStreakFreeze':
                                    result = await shopItemService.useStreakFreeze(user.uid);
                                    break;
                                case 'useXPPotion':
                                    result = await shopItemService.useXPPotion(user.uid);
                                    break;
                                case 'useStreakRepair':
                                    result = await shopItemService.useStreakRepair(user.uid);
                                    break;
                                case 'useHeartRefillFromInventory':
                                    // Check if there's a failed Daily Challenge to continue
                                    try {
                                        const today = new Date().toISOString().split('T')[0];
                                        Logger.log('[INVENTORY] Checking daily challenge for:', today);

                                        // Query the correct collection: dailyChallengeScores
                                        const scoresQuery = await firestore()
                                            .collection('dailyChallengeScores')
                                            .where('userId', '==', user.uid)
                                            .where('date', '==', today)
                                            .limit(1)
                                            .get();

                                        const docExists = !scoresQuery.empty;
                                        Logger.log('[INVENTORY] Score doc exists:', docExists);

                                        if (!docExists) {
                                            // No score document = user hasn't started today's challenge
                                            result = { success: false, message: 'No Daily Challenge found for today. Start a new challenge first!' };
                                        } else {
                                            const scoreData = scoresQuery.docs[0].data();
                                            const scoreDocRef = scoresQuery.docs[0].ref;
                                            Logger.log('[INVENTORY] Score data:', JSON.stringify({
                                                completed: scoreData.completed,
                                                score: scoreData.score,
                                                wrongAnswers: scoreData.wrongAnswers,
                                                hasSavedProgress: !!scoreData.savedProgress,
                                                savedProgressLives: scoreData.savedProgress?.lives
                                            }));

                                            // Check various states
                                            // A challenge is "failed" if they lost 3 lives (wrongAnswers >= 3)
                                            // This takes priority over savedProgress.lives since that data may be stale
                                            const wasFailed = (scoreData.wrongAnswers || 0) >= 3;

                                            // A challenge is truly "in progress" only if NOT failed and has savedProgress with lives > 0
                                            const hasInProgressChallenge = !wasFailed &&
                                                scoreData.savedProgress &&
                                                scoreData.savedProgress.lives > 0;

                                            // A challenge is truly "successfully completed" if:
                                            // - completed is true AND wrongAnswers < 3 (didn't lose all lives)
                                            const isSuccessfullyCompleted = scoreData.completed === true &&
                                                (scoreData.wrongAnswers || 0) < 3 &&
                                                !scoreData.savedProgress;

                                            Logger.log('[INVENTORY] wasFailed:', wasFailed, 'hasInProgressChallenge:', hasInProgressChallenge, 'isSuccessfullyCompleted:', isSuccessfullyCompleted);

                                            if (wasFailed) {
                                                // User failed (lost 3 lives) - use potion and restore 3 lives to continue
                                                // Check if savedProgress exists (should now be preserved by backend)
                                                const hasSavedProgress = !!scoreData.savedProgress;

                                                const potionSuccess = await shopItemService.useHeartRefill(user.uid);
                                                if (potionSuccess) {
                                                    if (hasSavedProgress) {
                                                        // Restore savedProgress with 3 lives
                                                        const restoredProgress = {
                                                            ...scoreData.savedProgress,
                                                            lives: 3, // Restore to 3 lives
                                                        };

                                                        await scoreDocRef.update({
                                                            completed: false,
                                                            wrongAnswers: 0, // Reset wrong answer count
                                                            savedProgress: restoredProgress,
                                                        });
                                                        Logger.log('[INVENTORY] Restored savedProgress with 3 lives - user can continue from where they left off');

                                                        result = {
                                                            success: true,
                                                            message: `❤️ Hearts restored! Continue from question ${(restoredProgress.currentQuestion || 0) + 1}!`,
                                                            navigateTo: 'DailyGame'
                                                        };
                                                    } else {
                                                        // No savedProgress (legacy data) - delete and start fresh
                                                        await scoreDocRef.delete();
                                                        Logger.log('[INVENTORY] No savedProgress found - deleted score, user starts fresh');

                                                        result = {
                                                            success: true,
                                                            message: '❤️ Hearts restored! You can now retry today\'s Daily Challenge!',
                                                            navigateTo: 'DailyGame'
                                                        };
                                                    }

                                                    // Clear any completion flag (ignore errors if field doesn't exist)
                                                    try {
                                                        await firestore().collection('users').doc(user.uid).update({
                                                            'dailyChallengeCompleted': firestore.FieldValue.delete(),
                                                        });
                                                    } catch (deleteErr) {
                                                        Logger.log('[INVENTORY] No completion flag to clear (OK)');
                                                    }
                                                } else {
                                                    result = { success: false, message: 'Failed to use Heart Refill.' };
                                                }
                                            } else if (hasInProgressChallenge) {
                                                result = { success: false, message: 'Your challenge is still in progress. Continue playing from where you left off!' };
                                            } else if (isSuccessfullyCompleted) {
                                                result = { success: false, message: "You've already completed today's Daily Challenge successfully! Come back tomorrow." };
                                            } else {
                                                // Edge case: document exists but state is unclear
                                                result = { success: false, message: 'Unable to determine challenge status. Please try again later.' };
                                            }
                                        }
                                    } catch (err) {
                                        Logger.error('[INVENTORY] Heart Refill check error:', err.message || err);
                                        result = { success: false, message: `Could not check Daily Challenge status: ${err.message || 'Unknown error'}` };
                                    }
                                    break;
                                default:
                                    result = { success: false, message: 'Unknown action' };
                            }

                            if (result.success) {
                                Haptics.success();
                                if (result.navigateTo) {
                                    showAlert('Success! ✨', result.message, [
                                        { text: 'Later', style: 'cancel' },
                                        { text: 'Go to Challenge', onPress: () => navigation.navigate(result.navigateTo) }
                                    ]);
                                } else {
                                    showAlert('Success! ✨', result.message);
                                }
                            } else {
                                Haptics.error();
                                showAlert('Error', result.message);
                            }
                        } catch (error) {
                            Logger.error('[INVENTORY] Use item error:', error);
                            Haptics.error();
                            showAlert('Error', 'Failed to use item. Please try again.');
                        } finally {
                            setLoadingItemId(null);
                        }
                    },
                },
            ]
        );
    };

    const renderInventoryItem = (item) => {
        const owned = stats?.inventory?.[item.inventoryKey] || 0;
        const isLoading = loadingItemId === item.id;
        const isOwned = owned > 0;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                key={item.id}
                onPress={() => isOwned && item.usable && handleUseItem(item)}
                style={[
                    styles.itemCard,
                    {
                        backgroundColor: colors.card,
                        borderColor: isOwned ? `${item.iconColor}40` : 'transparent',
                        borderLeftWidth: 4,
                        borderLeftColor: item.iconColor
                    },
                    !isOwned && styles.itemCardLocked,
                ]}
            >
                {/* Icon with Glow Effect */}
                <View style={styles.iconWrapper}>
                    <View style={[
                        styles.itemIconContainer,
                        { backgroundColor: `${item.iconColor}15` }
                    ]}>
                        <Icon name={item.iconName} size={28} color={item.iconColor} />
                    </View>
                    {/* Subtle outer glow for owned items */}
                    {isOwned && <View style={[styles.glow, { backgroundColor: item.iconColor }]} />}
                </View>

                <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                        <Text style={[styles.itemName, { color: colors.text }]}>
                            {item.name}
                        </Text>
                        <View style={[
                            styles.quantityBadge,
                            { backgroundColor: isOwned ? '#10B981' : '#374151' }
                        ]}>
                            <Text style={styles.quantityText}>x{owned}</Text>
                        </View>
                    </View>
                    <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                        {item.description}
                    </Text>
                </View>

                {item.usable && isOwned && (
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={styles.gamifiedButton}
                            onPress={() => handleUseItem(item)}
                        >
                            <View style={styles.buttonBottomShadow} />
                            <View style={[styles.buttonTop, { backgroundColor: colors.primary }]}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.buttonText}>USE</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // Separate items by ownership for better UX
    const ownedItems = INVENTORY_ITEMS.filter(
        (item) => (stats?.inventory?.[item.inventoryKey] || 0) > 0
    );
    const emptyItems = INVENTORY_ITEMS.filter(
        (item) => (stats?.inventory?.[item.inventoryKey] || 0) === 0
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Curved Header Background */}
            <View style={styles.headerBackgroundContainer}>
                <LinearGradient
                    colors={colors.primaryGradient || COLORS.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                />
            </View>

            <SafeAreaView style={styles.safeArea}>
                {/* Top Bar */}
                <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="arrow-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Vault</Text>
                    <View style={styles.topBarRight}>
                        <GemBadge onPress={() => navigation.navigate('Shop')} />
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Owned Items Section */}
                    {ownedItems.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Icon name="check-circle" size={18} color="#10B981" />
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Owned Items</Text>
                            </View>
                            {ownedItems.map(renderInventoryItem)}
                        </View>
                    )}

                    {/* Empty Items Section */}
                    {emptyItems.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Icon name="cart-outline" size={18} color="#9CA3AF" />
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                    Available in Bazaar
                                </Text>
                            </View>
                            {emptyItems.map(renderInventoryItem)}
                        </View>
                    )}

                    {/* Empty State */}
                    {ownedItems.length === 0 && (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Icon name="bag-personal-off-outline" size={64} color="#D1D5DB" />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Items Yet</Text>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Visit the Bazaar to purchase useful items and power-ups!
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => navigation.navigate('Shop')}
                            >
                                <LinearGradient
                                    colors={colors.primaryGradient || COLORS.primaryGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.emptyButtonGradient}
                                >
                                    <Icon name="cart" size={18} color="#FFF" />
                                    <Text style={styles.emptyButtonText}>Go to Bazaar</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBackgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        overflow: 'hidden',
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
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        flex: 1,
        textAlign: 'center',
    },
    topBarRight: {
        width: 40,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    shopButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    scrollView: {
        flex: 1,
        marginTop: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    itemCardEmpty: {
        opacity: 0.6,
    },
    itemIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    quantityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    quantityBadgeEmpty: {
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
    },
    quantityText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFF',
    },
    quantityTextEmpty: {
        color: '#9CA3AF',
    },
    itemDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    useButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        marginLeft: 12,
    },
    useButtonDisabled: {
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
    },
    useButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    useButtonTextDisabled: {
        color: '#9CA3AF',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyButton: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    emptyButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        gap: 8,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 20, // More rounded for game feel
        marginBottom: 16,
        borderWidth: 1,
        // Elevation for Android / Shadow for iOS
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    itemCardLocked: {
        opacity: 0.5,
        borderLeftColor: '#4B5563',
    },
    iconWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    itemIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    glow: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        top: 8,
        left: 8,
        opacity: 0.3,
        blurRadius: 10, // Note: standard View doesn't support blur, use a blurry png or shadow
    },
    itemContent: {
        flex: 1,
        paddingRight: 8,
    },
    itemName: {
        fontSize: 17,
        fontWeight: '800', // Heavier weight
        letterSpacing: 0.5,
    },
    quantityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(0,0,0,0.2)', // 3D effect for badge
    },
    quantityText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#FFF',
    },
    gamifiedButton: {
        width: 60,
        height: 40,
    },
    buttonTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 4, // Leave space for shadow
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    buttonBottomShadow: {
        position: 'absolute',
        top: 4,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#6D28D9', // Darker purple
        borderRadius: 12,
        zIndex: 1,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 12,
    }
});

export default InventoryScreen;

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useGamification } from '../features/GamificationFeatures';
import Haptics from '../utils/haptics';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Logger from '../utils/logger';
import Purchases from 'react-native-purchases';

// Scenario Pack definitions
export const SCENARIO_PACKS = {
    travel: {
        id: 'travel',
        name: 'Traveler Pack',
        description: 'Master conversations for your next adventure',
        icon: 'airplane',
        color: '#3B82F6',
        priceDollars: 1.99,
        priceGems: 10000,
        productId: 'com.linguana.pack_travel',
        scenarios: ['airport', 'hotel', 'taxi', 'directions'],
    },
    social: {
        id: 'social',
        name: 'Social Butterfly',
        description: 'Conquer casual conversations with confidence',
        icon: 'account-group',
        color: '#10B981',
        priceDollars: 1.49,
        priceGems: 2500,
        productId: 'com.linguana.pack_social',
        scenarios: ['small_talk', 'phone_call'],
    },
    dating: {
        id: 'dating',
        name: 'Flirting & Dating',
        description: 'Learn how to charm and connect',
        icon: 'heart',
        color: '#EC4899',
        priceDollars: 1.99,
        priceGems: 5000,
        productId: 'com.linguana.pack_dating',
        scenarios: ['dating', 'flirting'],
    },
    // Note: Business pack removed - Interview content accessed via dedicated Business card on HomeScreen
    professional: {
        id: 'professional',
        name: 'Health & Services',
        description: 'Navigate formal appointments',
        icon: 'medical-bag',
        color: '#EF4444',
        priceDollars: 1.49,
        priceGems: 2500,
        productId: 'com.linguana.pack_professional',
        scenarios: ['doctor'],
    },
};

const PurchasePackModal = ({ visible, packId, onClose, onPurchase, onWatchAd, shopPackages }) => {
    const { colors, isDarkMode } = useTheme();
    const { stats } = useGamification();
    const [loading, setLoading] = useState(false);

    const pack = SCENARIO_PACKS[packId];
    const user = auth().currentUser;
    const userGems = stats?.gems || 0;
    const canAffordGems = userGems >= (pack?.priceGems || 0);

    if (!pack) return null;

    const handleGemPurchase = async () => {
        if (!canAffordGems || !user) return;

        setLoading(true);
        Haptics.medium();

        try {
            const userRef = firestore().collection('users').doc(user.uid);
            await userRef.update({
                gems: firestore.FieldValue.increment(-pack.priceGems),
                [`ownedPacks.${pack.id}`]: true,
            });

            Haptics.success();
            onPurchase?.(pack.id);
            onClose();
        } catch (error) {
            Logger.error('[PACK] Gem purchase failed:', error);
            Haptics.error();
        } finally {
            setLoading(false);
        }
    };

    const handleIAPPurchase = async () => {
        Haptics.medium();

        // Map local pack ID to RC identifier
        const RC_MAP = {
            'travel': 'pack_travel',
            'social': 'pack_social',
            'professional': 'pack_health',
            'dating': 'pack_dating'
        };

        const rcIdentifier = RC_MAP[packId];
        const rcPackage = shopPackages?.[rcIdentifier];

        if (!rcPackage) {
            Logger.warn('[PACK] RC Package not found for:', packId);
            alert('Pack not available for purchase at this time.');
            return;
        }

        try {
            setLoading(true);
            await Purchases.purchasePackage(rcPackage);

            // On success, unlock in Firestore (RC handles consumption/entitlement, but we mirror in Firestore)
            const userRef = firestore().collection('users').doc(user.uid);
            await userRef.update({
                [`ownedPacks.${pack.id}`]: true,
            });

            Haptics.success();
            onPurchase?.(pack.id);
            onClose();
        } catch (error) {
            if (!error.userCancelled) {
                Logger.error('[PACK] IAP purchase failed:', error);
                alert('Purchase failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF' }]}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Icon name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Pack header */}
                    <LinearGradient
                        colors={[pack.color, pack.color + 'CC']}
                        style={styles.headerGradient}
                    >
                        <Icon name={pack.icon} size={64} color="#FFF" style={{ marginBottom: 16 }} />
                        <Text style={styles.packName}>{pack.name}</Text>
                        <Text style={styles.packDescription}>{pack.description}</Text>
                    </LinearGradient>

                    {/* Included scenarios */}
                    <View style={styles.scenariosSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Includes {pack.scenarios.length} Scenarios:
                        </Text>
                        <View style={styles.scenariosList}>
                            {pack.scenarios.map((scenarioId, index) => (
                                <View key={scenarioId} style={[styles.scenarioChip, { backgroundColor: colors.card }]}>
                                    <Icon name="check-circle" size={14} color="#10B981" />
                                    <Text style={[styles.scenarioText, { color: colors.text }]}>
                                        {scenarioId.replace(/_/g, ' ').toUpperCase()}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Purchase options */}
                    <View style={styles.purchaseSection}>
                        {/* Gem purchase */}
                        <TouchableOpacity
                            style={[styles.purchaseButton, !canAffordGems && styles.buttonDisabled]}
                            onPress={handleGemPurchase}
                            disabled={!canAffordGems || loading}
                        >
                            <LinearGradient
                                colors={canAffordGems ? ['#8B5CF6', '#7C3AED'] : ['#6B7280', '#4B5563']}
                                style={styles.buttonGradient}
                            >
                                <Icon name="diamond-stone" size={20} color="#FFF" />
                                <Text style={styles.buttonText}>{pack.priceGems.toLocaleString()} Gems</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={[styles.orText, { color: colors.textSecondary }]}>or</Text>

                        {/* USD purchase */}
                        <TouchableOpacity
                            style={styles.purchaseButton}
                            onPress={handleIAPPurchase}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>
                                    {shopPackages?.[{
                                        'travel': 'pack_travel',
                                        'social': 'pack_social',
                                        'professional': 'pack_health',
                                        'dating': 'pack_dating'
                                    }[packId]]?.product?.priceString || `$${pack.priceDollars} USD`}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Watch Ad to Try Option */}
                    {onWatchAd && (
                        <View style={styles.adTrialSection}>
                            <View style={styles.dividerContainer}>
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or try it once</Text>
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            </View>
                            <TouchableOpacity
                                style={styles.adButton}
                                onPress={() => {
                                    Haptics.medium();
                                    onWatchAd?.();
                                }}
                                disabled={loading}
                            >
                                <Icon name="play-circle" size={20} color="#F59E0B" />
                                <Text style={styles.adButtonText}>Watch Ad for 1 Free Try</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!canAffordGems && (
                        <View style={{ alignItems: 'center', marginTop: 8 }}>
                            <Text style={[styles.warningText, { color: '#EF4444', fontWeight: 'bold' }]}>
                                You need {(pack.priceGems - userGems).toLocaleString()} more gems
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    headerGradient: {
        paddingVertical: 32,
        paddingHorizontal: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        alignItems: 'center',
    },
    packIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    packName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
    },
    packDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    scenariosSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    scenariosList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    scenarioChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    scenarioText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    purchaseSection: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    purchaseButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: 6,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    orText: {
        fontSize: 14,
        fontWeight: '500',
        marginVertical: 4,
    },
    warningText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
    },
    adTrialSection: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 12,
        fontWeight: '500',
        marginHorizontal: 12,
    },
    adButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        gap: 8,
    },
    adButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F59E0B',
    },
});

export default PurchasePackModal;

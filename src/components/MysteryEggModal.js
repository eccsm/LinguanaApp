import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Animated,
    Easing,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import Haptics from '../utils/haptics';

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

// Egg images for animation phases
const EGG_IMAGES = {
    mystery: require('../../assets/images/mystery_egg.png'),
    cracked: require('../../assets/images/cracked_egg.png'),
    broken: require('../../assets/images/broken_egg.png'),
};

// Avatar pool with rarity assignments
// NOTE: Common pool excluded from eggs since shop avatars (Gecko, Chammy, Chatterbox) are buyable directly
const AVATAR_POOL = {
    common: [
        // These are in the shop - not included in eggs
        { id: 'avatar_gecko', name: 'Gecko', image: AVATAR_IMAGES.avatar_gecko },
        { id: 'avatar_chameleon', name: 'Chammy', image: AVATAR_IMAGES.avatar_chameleon },
        { id: 'avatar_chatters', name: 'Chatterbox', image: AVATAR_IMAGES.avatar_chatters },
    ],
    rare: [
        { id: 'avatar_axolotl', name: 'Axel', image: AVATAR_IMAGES.avatar_axolotl },
        { id: 'avatar_dictionary', name: 'Scholar', image: AVATAR_IMAGES.avatar_dictionary },
        { id: 'avatar_fn_lizard', name: 'Fancy', image: AVATAR_IMAGES.avatar_fn_lizard },
        { id: 'avatar_speedy', name: 'Speedy', image: AVATAR_IMAGES.avatar_speedy },
    ],
    legendary: [
        { id: 'avatar_dragon', name: 'Draco', image: AVATAR_IMAGES.avatar_dragon },
        { id: 'avatar_mascott', name: 'Lingo', image: AVATAR_IMAGES.avatar_mascott },
        { id: 'avatar_monitor', name: 'Chief', image: AVATAR_IMAGES.avatar_monitor },
    ],
};

const RARITY_COLORS = {
    common: ['#4CAF50', '#81C784'],
    rare: ['#2196F3', '#64B5F6'],
    legendary: ['#FFD700', '#FFA000'],
};

const RARITY_LABELS = {
    common: 'COMMON',
    rare: 'RARE',
    legendary: 'LEGENDARY',
};

// Gems reward when user owns all avatars
const ALL_OWNED_GEMS_REWARD = 5000;

/**
 * Picks a random avatar based on rarity weights
 * ALWAYS prioritizes giving unowned avatars first
 * If ALL avatars are owned, returns allOwned: true for gems reward
 * @param {Object} weights - { common: 0.7, rare: 0.25, legendary: 0.05 }
 * @param {Array} ownedAvatars - Array of avatar IDs user already owns
 * @returns {{ avatar: Object, rarity: string, allOwned?: boolean, gemsReward?: number } | null}
 */
export const pickRandomAvatar = (weights, ownedAvatars = []) => {
    // First, collect ALL unowned avatars across all rarities (excluding common/shop avatars)
    const allUnownedAvatars = [];

    // Only check rare and legendary pools for eggs (common avatars are in shop)
    for (const rarity of ['rare', 'legendary']) {
        const unowned = AVATAR_POOL[rarity].filter(a => !ownedAvatars.includes(a.id));
        unowned.forEach(avatar => allUnownedAvatars.push({ avatar, rarity }));
    }

    // If user owns ALL egg avatars, return gems reward flag
    if (allUnownedAvatars.length === 0) {
        return {
            avatar: null,
            rarity: 'legendary',
            allOwned: true,
            gemsReward: ALL_OWNED_GEMS_REWARD
        };
    }

    // Determine rarity based on weights
    const roll = Math.random();
    let cumulative = 0;
    let selectedRarity = 'legendary'; // Default to legendary if no match

    for (const [rarity, weight] of Object.entries(weights)) {
        cumulative += weight;
        if (roll <= cumulative) {
            selectedRarity = rarity;
            break;
        }
    }

    // Get available avatars of selected rarity (not owned)
    let pool = AVATAR_POOL[selectedRarity]?.filter(a => !ownedAvatars.includes(a.id)) || [];

    // If all avatars of this rarity are owned, pick from remaining unowned (any rarity)
    if (pool.length === 0) {
        // Prioritize higher rarities when falling back
        const rarityPriority = ['legendary', 'rare'];
        for (const rarity of rarityPriority) {
            pool = AVATAR_POOL[rarity]?.filter(a => !ownedAvatars.includes(a.id)) || [];
            if (pool.length > 0) {
                selectedRarity = rarity;
                break;
            }
        }
    }

    // Safety check (should never happen due to allOwned check above)
    if (pool.length === 0) {
        return {
            avatar: null,
            rarity: 'legendary',
            allOwned: true,
            gemsReward: ALL_OWNED_GEMS_REWARD
        };
    }

    const avatar = pool[Math.floor(Math.random() * pool.length)];
    return { avatar, rarity: selectedRarity, allOwned: false };
};

const MysteryEggModal = ({
    visible,
    onClose,
    eggType = 'common', // 'common' or 'royal'
    onReveal, // Callback with { avatar, rarity, isNew }
    ownedAvatars = [],
}) => {
    const { colors, isDarkMode } = useTheme();
    const [phase, setPhase] = useState('idle'); // 'idle' | 'cracked' | 'breaking' | 'revealed'
    const [revealedAvatar, setRevealedAvatar] = useState(null);
    const [revealedRarity, setRevealedRarity] = useState('common');
    const [gemsReward, setGemsReward] = useState(0); // Gems rewarded when all avatars owned

    // Animation values
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;
    const revealScaleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    // Egg config based on type
    const eggConfig = {
        standard: {
            colors: ['#8B4513', '#D2691E'],
            icon: 'egg',
            // 40% Rare, 60% Legendary - NO common (shop avatars excluded)
            weights: { common: 0, rare: 0.40, legendary: 0.60 },
        },
        royal: {
            colors: ['#FFD700', '#FFA000'],
            icon: 'egg-easter',
            // 100% Legendary only!
            weights: { common: 0, rare: 0, legendary: 1.0 },
        },
    };

    const config = eggConfig[eggType] || eggConfig.common;

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setPhase('idle');
            setRevealedAvatar(null);
            shakeAnim.setValue(0);
            scaleAnim.setValue(1);
            flashAnim.setValue(0);
            revealScaleAnim.setValue(0);
            glowAnim.setValue(0);
        }
    }, [visible]);

    // First tap: mystery egg -> cracked egg
    const handleFirstTap = () => {
        if (phase !== 'idle') return;

        Haptics.medium();

        // Shake animation
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]).start(() => {
            setPhase('cracked');
        });
    };

    // Second tap: cracked egg -> broken egg -> reveal
    const handleSecondTap = () => {
        if (phase !== 'cracked') return;

        Haptics.heavy();
        setPhase('breaking');

        // Pick random avatar
        const result = pickRandomAvatar(config.weights, ownedAvatars);
        if (result) {
            setRevealedAvatar(result.avatar);
            setRevealedRarity(result.rarity);
            // Set gems reward if all avatars owned
            if (result.allOwned && result.gemsReward) {
                setGemsReward(result.gemsReward);
            } else {
                setGemsReward(0);
            }
        }

        // Show broken egg briefly, then reveal
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.delay(300), // Show broken egg for a moment
            Animated.parallel([
                Animated.timing(flashAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            Haptics.success();
            setPhase('revealed');

            // Reveal avatar animation
            Animated.spring(revealScaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();

            // Glow pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        });
    };

    // Handle tap based on current phase
    const handleTapEgg = () => {
        if (phase === 'idle') {
            handleFirstTap();
        } else if (phase === 'cracked') {
            handleSecondTap();
        }
    };

    // Get current egg image based on phase
    const getCurrentEggImage = () => {
        switch (phase) {
            case 'cracked':
                return EGG_IMAGES.cracked;
            case 'breaking':
                return EGG_IMAGES.broken;
            default:
                return EGG_IMAGES.mystery;
        }
    };

    const handleClaim = () => {
        if (onReveal) {
            // If gems reward (all avatars owned), pass that instead
            if (gemsReward > 0) {
                onReveal({ avatar: null, rarity: 'legendary', isNew: false, allOwned: true, gemsReward });
            } else if (revealedAvatar) {
                const isNew = !ownedAvatars.includes(revealedAvatar.id);
                onReveal({ avatar: revealedAvatar, rarity: revealedRarity, isNew, allOwned: false });
            }
        }
        onClose();
    };

    const rarityColors = RARITY_COLORS[revealedRarity] || RARITY_COLORS.common;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(30,30,35,0.98)' : colors.surface }]}>
                    {/* Close button (only when idle or revealed) */}
                    {(phase === 'idle' || phase === 'revealed') && (
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Icon name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        {phase === 'revealed' ? 'You Got...' : 'Mystery Egg'}
                    </Text>

                    {/* Egg / Avatar display area */}
                    <View style={styles.eggContainer}>
                        {/* Flash overlay */}
                        <Animated.View
                            style={[
                                styles.flashOverlay,
                                {
                                    opacity: flashAnim,
                                    backgroundColor: '#FFF',
                                },
                            ]}
                            pointerEvents="none"
                        />

                        {phase !== 'revealed' ? (
                            // Egg - using actual images
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={handleTapEgg}
                                disabled={phase === 'breaking'}
                            >
                                <Animated.View
                                    style={{
                                        transform: [
                                            { translateX: shakeAnim },
                                            { scale: scaleAnim },
                                        ],
                                    }}
                                >
                                    <Image
                                        source={getCurrentEggImage()}
                                        style={styles.eggImage}
                                        resizeMode="contain"
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                        ) : (
                            // Revealed avatar OR gems reward
                            <Animated.View
                                style={{
                                    transform: [{ scale: revealScaleAnim }],
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {/* Glow effect */}
                                <Animated.View
                                    style={[
                                        styles.glowEffect,
                                        {
                                            opacity: glowAnim,
                                            backgroundColor: gemsReward > 0 ? '#06b6d4' : rarityColors[0],
                                        },
                                    ]}
                                />

                                {gemsReward > 0 ? (
                                    // Gems reward UI
                                    <>
                                        <LinearGradient
                                            colors={['#06b6d4', '#0891b2']}
                                            style={styles.avatarContainer}
                                        >
                                            <Icon name="diamond-stone" size={80} color="#FFF" />
                                        </LinearGradient>

                                        {/* Jackpot badge */}
                                        <LinearGradient
                                            colors={['#06b6d4', '#0891b2']}
                                            style={styles.rarityBadge}
                                        >
                                            <Text style={styles.rarityText}>JACKPOT!</Text>
                                        </LinearGradient>

                                        {/* Gems amount */}
                                        <Text style={[styles.avatarName, { color: colors.text }]}>
                                            +{gemsReward.toLocaleString()} 💎
                                        </Text>
                                        <Text style={[styles.gemsSubtext, { color: colors.textSecondary }]}>
                                            You own all avatars!
                                        </Text>
                                    </>
                                ) : (
                                    // Avatar UI
                                    <>
                                        <LinearGradient
                                            colors={rarityColors}
                                            style={styles.avatarContainer}
                                        >
                                            <Image
                                                source={revealedAvatar?.image}
                                                style={styles.avatarImage}
                                                resizeMode="contain"
                                            />
                                        </LinearGradient>

                                        {/* Rarity badge */}
                                        <LinearGradient
                                            colors={rarityColors}
                                            style={styles.rarityBadge}
                                        >
                                            <Text style={styles.rarityText}>
                                                {RARITY_LABELS[revealedRarity]}
                                            </Text>
                                        </LinearGradient>

                                        {/* Avatar name */}
                                        <Text style={[styles.avatarName, { color: colors.text }]}>
                                            {revealedAvatar?.name}
                                        </Text>
                                    </>
                                )}
                            </Animated.View>
                        )}
                    </View>

                    {/* Detailed Description (Only in Idle Phase) */}
                    {phase === 'idle' && (
                        <View style={styles.infoContainer}>
                            <Text style={[styles.infoTitle, { color: colors.text }]}>
                                Contains one of these:
                            </Text>
                            <View style={styles.dropsContainer}>
                                {eggType === 'common' ? (
                                    <>
                                        <View style={styles.dropRow}>
                                            <View style={[styles.dot, { backgroundColor: '#2196F3' }]} />
                                            <Text style={[styles.dropText, { color: colors.textSecondary }]}>
                                                40% Rare (Axel, Scholar, Fancy, Speedy)
                                            </Text>
                                        </View>
                                        <View style={styles.dropRow}>
                                            <View style={[styles.dot, { backgroundColor: '#FFD700' }]} />
                                            <Text style={[styles.dropText, { color: colors.textSecondary }]}>
                                                60% Legendary (Draco, Lingo, Chief)
                                            </Text>
                                        </View>
                                    </>
                                ) : (
                                    <View style={styles.dropRow}>
                                        <View style={[styles.dot, { backgroundColor: '#FFD700' }]} />
                                        <Text style={[styles.dropText, { color: colors.textSecondary }]}>
                                            100% Legendary (Draco, Lingo, Chief)
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Instructions / Actions */}
                    {phase === 'idle' && (
                        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
                            Tap the egg to crack it!
                        </Text>
                    )}

                    {phase === 'cracked' && (
                        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
                            Tap again to open!
                        </Text>
                    )}

                    {phase === 'breaking' && (
                        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
                            Opening...
                        </Text>
                    )}

                    {phase === 'revealed' && (
                        <TouchableOpacity
                            style={styles.claimButton}
                            onPress={handleClaim}
                        >
                            <LinearGradient
                                colors={gemsReward > 0 ? ['#06b6d4', '#0891b2'] : rarityColors}
                                style={styles.claimGradient}
                            >
                                <Text style={styles.claimText}>
                                    {gemsReward > 0 ? 'Claim Gems!' : 'Claim Avatar!'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '85%',
        maxWidth: 320,
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 24,
        marginTop: 8,
    },
    eggContainer: {
        width: 340,
        height: 340,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    flashOverlay: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    egg: {
        width: 280,
        height: 340,
        borderRadius: 140,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    eggImage: {
        width: 300,
        height: 320,
    },
    glowEffect: {
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: 160,
        opacity: 0.4,
    },
    avatarContainer: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
    },
    avatarImage: {
        width: 180,
        height: 180,
        borderRadius: 90,
    },
    rarityBadge: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderRadius: 20,
    },
    rarityText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 1,
    },
    avatarName: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 8,
    },
    gemsSubtext: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
        textAlign: 'center',
    },
    instruction: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    claimButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    claimGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    claimText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    infoContainer: {
        width: '100%',
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 12,
        borderRadius: 12,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    dropsContainer: {
        gap: 6,
    },
    dropRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    dropText: {
        fontSize: 13,
        fontWeight: '500',
    },
});

export default MysteryEggModal;

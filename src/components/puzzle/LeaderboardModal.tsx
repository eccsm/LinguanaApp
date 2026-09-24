/**
 * LeaderboardModal Component
 * Displays weekly puzzle leaderboard (no tabs, just weekly data)
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    ActivityIndicator,
    Image,
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import weeklyGameService, { LeaderboardEntry } from '../../services/weeklyGameService';
import { useTheme } from '../../contexts/ThemeContext';

// ============================================================================
// Types
// ============================================================================

interface LeaderboardModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Current user's ID to highlight their entry */
    userId?: string;
    /** Callback when modal is closed */
    onClose: () => void;
}

// Avatar mapping (same as DailyGameScreen)
const AVATAR_IMAGES: Record<string, any> = {
    'avatar_gecko': require('../../../assets/avatars/gecko.png'),
    'avatar_chameleon': require('../../../assets/avatars/chameleon.png'),
    'avatar_dragon': require('../../../assets/avatars/dragon-b.png'),
    'avatar_axolotl': require('../../../assets/avatars/axolotil.png'),
    'avatar_mascott': require('../../../assets/avatars/mascott.png'),
    'avatar_speedy': require('../../../assets/avatars/speedy_lizard.png'),
};

// ============================================================================
// Component
// ============================================================================

export default function LeaderboardModal({
    visible,
    userId,
    onClose,
}: LeaderboardModalProps) {
    const { colors, isDarkMode, activeTheme } = useTheme();
    const isCyberpunk = activeTheme === 'cyberpunk';
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch weekly leaderboard when modal opens
    useEffect(() => {
        if (visible) {
            fetchLeaderboard();
        }
    }, [visible]);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await weeklyGameService.getLeaderboard('weekly');

            if (data.success) {
                setLeaderboard(data.leaderboard);
            } else {
                setError(data.error || 'Failed to load leaderboard');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const getAvatarSource = (avatar: string | null) => {
        if (avatar && AVATAR_IMAGES[avatar]) {
            return AVATAR_IMAGES[avatar];
        }
        return null; // Return null if user has no avatar - will show initial instead
    };

    const getRankStyle = (rank: number) => {
        if (rank === 1) return styles.rank1;
        if (rank === 2) return styles.rank2;
        if (rank === 3) return styles.rank3;
        return {};
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    // Dynamic styles based on theme
    const themedStyles = {
        container: {
            backgroundColor: colors.background,
        },
        header: {
            backgroundColor: 'transparent',
        },
        closeIcon: colors.text,
        row: {
            // Increased opacity for better visibility
            backgroundColor: isCyberpunk
                ? 'rgba(30, 20, 50, 0.95)'
                : isDarkMode
                    ? 'rgba(55, 65, 81, 0.9)'
                    : 'rgba(248, 249, 250, 0.98)',
            // Cyberpunk glow border
            borderWidth: isCyberpunk ? 1 : 0,
            borderColor: isCyberpunk ? 'rgba(139, 92, 246, 0.5)' : 'transparent',
        },
        currentUserRow: {
            backgroundColor: isCyberpunk
                ? 'rgba(139, 92, 246, 0.4)'
                : isDarkMode
                    ? 'rgba(106, 17, 203, 0.4)'
                    : '#e3f2fd',
            borderColor: isCyberpunk ? '#ff2d95' : colors.primary,
            borderWidth: 2,
        },
        // For rank 1-3 on dark mode, use dark tinted backgrounds
        rank1: isDarkMode ? {
            backgroundColor: isCyberpunk ? 'rgba(255, 215, 0, 0.25)' : 'rgba(255, 215, 0, 0.2)',
            borderColor: '#FFD700',
        } : {},
        rank2: isDarkMode ? {
            backgroundColor: isCyberpunk ? 'rgba(192, 192, 192, 0.25)' : 'rgba(192, 192, 192, 0.2)',
            borderColor: '#C0C0C0',
        } : {},
        rank3: isDarkMode ? {
            backgroundColor: isCyberpunk ? 'rgba(205, 127, 50, 0.25)' : 'rgba(205, 127, 50, 0.2)',
            borderColor: '#CD7F32',
        } : {},
        name: {
            color: colors.text,
        },
        score: {
            color: colors.primary,
        },
        prizesBanner: {
            backgroundColor: isDarkMode ? 'rgba(106, 17, 203, 0.2)' : '#f0f7ff',
            borderColor: isDarkMode ? 'rgba(106, 17, 203, 0.4)' : '#d0e4ff',
        },
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            statusBarTranslucent
        >
            <View style={[styles.container, themedStyles.container]}>
                {/* Minimal Header - just close button */}
                <View style={[styles.header, themedStyles.header]}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="close" size={28} color={themedStyles.closeIcon} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                            Loading leaderboard...
                        </Text>
                    </View>
                ) : error ? (
                    <View style={styles.centered}>
                        <Icon name="alert-circle" size={48} color="#f44336" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={fetchLeaderboard} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                        {/* Weekly prizes banner */}
                        <View style={[styles.prizesBanner, themedStyles.prizesBanner]}>
                            <Text style={[styles.prizesTitle, { color: colors.text }]}>🏆 Weekly Prizes</Text>
                            <View style={styles.prizesRow}>
                                <View style={styles.prizeItem}>
                                    <Text style={styles.prizeEmoji}>🥇</Text>
                                    <Text style={[styles.prizeValue, { color: colors.textSecondary }]}>1000 💎</Text>
                                </View>
                                <View style={styles.prizeItem}>
                                    <Text style={styles.prizeEmoji}>🥈</Text>
                                    <Text style={[styles.prizeValue, { color: colors.textSecondary }]}>750 💎</Text>
                                </View>
                                <View style={styles.prizeItem}>
                                    <Text style={styles.prizeEmoji}>🥉</Text>
                                    <Text style={[styles.prizeValue, { color: colors.textSecondary }]}>500 💎</Text>
                                </View>
                            </View>
                        </View>

                        {leaderboard.map((entry) => (
                            <View
                                key={entry.userId}
                                style={[
                                    styles.row,
                                    themedStyles.row,
                                    entry.userId === userId && [styles.currentUserRow, themedStyles.currentUserRow],
                                    getRankStyle(entry.rank),
                                    entry.rank === 1 && themedStyles.rank1,
                                    entry.rank === 2 && themedStyles.rank2,
                                    entry.rank === 3 && themedStyles.rank3,
                                ]}
                            >
                                {/* Rank */}
                                <View style={styles.rankContainer}>
                                    <Text style={[styles.rankText, { color: colors.textSecondary }]}>{getRankIcon(entry.rank)}</Text>
                                </View>

                                {/* Avatar or Initial */}
                                {getAvatarSource(entry.avatar) ? (
                                    <Image
                                        source={getAvatarSource(entry.avatar)}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.avatarInitial}>
                                            {(entry.username || entry.displayName)?.charAt(0)?.toUpperCase() || '?'}
                                        </Text>
                                    </View>
                                )}

                                {/* Username */}
                                <View style={styles.info}>
                                    <Text style={[styles.name, themedStyles.name]} numberOfLines={1}>
                                        {entry.username || entry.displayName}
                                        {entry.userId === userId && ' (You)'}
                                    </Text>
                                </View>

                                {/* Score */}
                                <Text style={[styles.score, themedStyles.score]}>{entry.score}</Text>
                            </View>
                        ))}

                        {leaderboard.length === 0 && (
                            <View style={styles.centered}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No entries yet this week
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        color: '#666',
        marginTop: 12,
        fontSize: 16,
    },
    errorText: {
        color: '#f44336',
        marginTop: 12,
        fontSize: 16,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: '#4A90D9',
        borderRadius: 20,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
    list: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginVertical: 4,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    currentUserRow: {
        backgroundColor: '#e3f2fd',
        borderWidth: 1,
        borderColor: '#2196f3',
    },
    rank1: {
        backgroundColor: '#fff8e1',
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    rank2: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#9e9e9e',
    },
    rank3: {
        backgroundColor: '#fbe9e7',
        borderWidth: 1,
        borderColor: '#ff7043',
    },
    rankContainer: {
        width: 40,
        alignItems: 'center',
    },
    rankText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    score: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    prizesBanner: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
    },
    prizesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    prizesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    prizeItem: {
        alignItems: 'center',
    },
    prizeEmoji: {
        fontSize: 24,
    },
    prizeValue: {
        fontSize: 12,
        marginTop: 4,
    },
});

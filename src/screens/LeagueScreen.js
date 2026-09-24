import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    Image,
    ImageBackground,
    Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import leagueService from '../services/leagueService';
import Haptics from '../utils/haptics';
import { GAME_BACKGROUNDS } from '../constants/backgrounds';

// Avatar images for league display
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

const LeagueScreen = ({ navigation }) => {
    const { colors, isDarkMode, activeTheme } = useTheme();
    const isCyberpunk = activeTheme === 'cyberpunk';
    const { userProfile, stats } = useApp();
    const [leagueUsers, setLeagueUsers] = useState([]);
    const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0 });
    const [userTier, setUserTier] = useState(leagueService.LEAGUE_TIERS.bronze);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadLeague = useCallback(async () => {
        try {
            const users = await leagueService.buildLeague(userProfile);
            setLeagueUsers(users);

            const tier = leagueService.getUserTier(stats?.xp || 0);
            setUserTier(tier);

            const time = leagueService.getTimeUntilReset();
            setTimeRemaining(time);
        } catch (error) {
            console.error('Failed to load league:', error);
        } finally {
            setLoading(false);
        }
    }, [userProfile, stats]);

    // Reload league data when screen gains focus (after earning stars, etc.)
    useFocusEffect(
        useCallback(() => {
            loadLeague();
        }, [loadLeague])
    );

    // Update timer every minute (separate effect for timer)
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeRemaining(leagueService.getTimeUntilReset());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        Haptics.light();
        await loadLeague();
        setRefreshing(false);
    };

    const getRankStyle = (rank) => {
        if (rank === 1) return { backgroundColor: '#FFD700', color: '#1F2937' };
        if (rank === 2) return { backgroundColor: '#C0C0C0', color: '#1F2937' };
        if (rank === 3) return { backgroundColor: '#CD7F32', color: '#FFF' };
        return { backgroundColor: 'rgba(0,0,0,0.2)', color: colors.text };
    };

    const getZoneStyle = (zone) => {
        if (zone === 'promotion') return { borderLeftColor: '#10B981', borderLeftWidth: 4 };
        if (zone === 'demotion') return { borderLeftColor: '#EF4444', borderLeftWidth: 4 };
        return {};
    };

    const renderUserItem = ({ item, index }) => {
        const rankStyle = getRankStyle(item.rank);
        const zoneStyle = getZoneStyle(item.zone);

        // For current user, use profile data as fallback if cluster data is missing
        const displayAvatar = item.isCurrentUser
            ? (item.avatar || userProfile?.equippedAvatar)
            : item.avatar;
        const displayUsername = item.isCurrentUser
            ? (item.username || userProfile?.username || item.name)
            : (item.username || item.name);

        const avatarImage = displayAvatar ? AVATAR_IMAGES[displayAvatar] : null;

        return (
            <View
                style={[
                    styles.userRow,
                    {
                        // Use more opaque backgrounds for better visibility
                        backgroundColor: item.isCurrentUser
                            ? (isCyberpunk ? 'rgba(139, 92, 246, 0.4)' : isDarkMode ? '#374151' : '#EEF2FF')
                            : (isCyberpunk ? 'rgba(30, 20, 50, 0.95)' : isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.95)'),
                        // Cyberpunk glow border for all cards
                        borderWidth: isCyberpunk ? 1 : 0,
                        borderColor: isCyberpunk ? (item.isCurrentUser ? '#ff2d95' : 'rgba(139, 92, 246, 0.5)') : 'transparent',
                    },
                    item.isCurrentUser && {
                        borderWidth: 2,
                        borderColor: isCyberpunk ? '#ff2d95' : '#FFD700',
                        shadowColor: isCyberpunk ? '#ff2d95' : '#FFD700',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: isCyberpunk ? 0.8 : 0.5,
                        shadowRadius: isCyberpunk ? 12 : 8,
                        elevation: isCyberpunk ? 6 : 3
                    },
                    zoneStyle,
                ]}
            >
                {/* Rank */}
                <View style={[styles.rankBadge, { backgroundColor: rankStyle.backgroundColor }]}>
                    <Text style={[styles.rankText, { color: rankStyle.color }]}>
                        {item.rank}
                    </Text>
                </View>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {avatarImage ? (
                        <Image source={avatarImage} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                            <Icon name="account" size={20} color={colors.textSecondary} />
                        </View>
                    )}
                </View>

                {/* Name */}
                <View style={styles.nameContainer}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                        {displayUsername}
                    </Text>
                    {item.zone === 'promotion' && (
                        <View style={styles.zoneBadge}>
                            <Icon name="arrow-up-bold" size={12} color="#10B981" />
                            <Text style={[styles.zoneText, { color: '#10B981' }]}>Promotion</Text>
                        </View>
                    )}
                    {item.zone === 'demotion' && (
                        <View style={styles.zoneBadge}>
                            <Icon name="arrow-down-bold" size={12} color="#EF4444" />
                            <Text style={[styles.zoneText, { color: '#EF4444' }]}>Demotion</Text>
                        </View>
                    )}
                </View>

                {/* XP */}
                <View style={styles.xpContainer}>
                    <Icon name="star" size={16} color="#F59E0B" />
                    <Text style={[styles.xpText, { color: colors.text }]}>
                        {item.weeklyXP.toLocaleString()}
                    </Text>
                </View>
            </View>
        );
    };

    const ListHeaderComponent = () => (
        <View style={styles.headerContainer}>
            {/* Tier Badge */}
            <LinearGradient
                colors={[userTier.color, userTier.color + '99']}
                style={styles.tierBadge}
            >
                <Text style={styles.tierIcon}>{userTier.icon}</Text>
                <Text style={styles.tierName}>{userTier.name} League</Text>
            </LinearGradient>

            {/* Timer */}
            <View style={[styles.timerContainer, { backgroundColor: colors.card }]}>
                <Icon name="clock-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.timerText, { color: colors.text }]}>
                    Resets in {timeRemaining.days}d {timeRemaining.hours}h
                </Text>
            </View>

            {/* How to Earn Stars Info Card */}
            <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F0F9FF', borderColor: isDarkMode ? '#334155' : '#BAE6FD' }]}>
                <View style={styles.infoHeader}>
                    <Icon name="information" size={20} color="#0EA5E9" />
                    <Text style={[styles.infoTitle, { color: colors.text }]}>How to Earn Stars</Text>
                </View>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Earn <Text style={styles.infoHighlight}>1 ⭐</Text> for every <Text style={styles.infoHighlight}>10 XP</Text> you collect!
                </Text>
                <View style={styles.infoActivities}>
                    <View style={styles.activityItem}>
                        <Icon name="chat" size={14} color="#10B981" />
                        <Text style={[styles.activityText, { color: colors.textSecondary }]}>Conversations</Text>
                    </View>
                    <View style={styles.activityItem}>
                        <Icon name="calendar-check" size={14} color="#F59E0B" />
                        <Text style={[styles.activityText, { color: colors.textSecondary }]}>Daily Challenge</Text>
                    </View>
                    <View style={styles.activityItem}>
                        <Icon name="puzzle" size={14} color="#8B5CF6" />
                        <Text style={[styles.activityText, { color: colors.textSecondary }]}>Weekly Puzzle</Text>
                    </View>
                </View>
            </View>

            {/* Zone Legend - Hide demotion text for Bronze tier */}
            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Top 3: Promotion</Text>
                </View>
                {userTier.name !== 'Bronze' && (
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Bottom 3: Demotion</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <ImageBackground
            source={GAME_BACKGROUNDS.PUZZLE}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

                {/* Header */}
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Icon name="arrow-left" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>
                            Weekly League
                        </Text>
                        <View style={{ width: 24 }} />
                    </View>
                </SafeAreaView>

                {/* Leaderboard */}
                <FlatList
                    data={leagueUsers}
                    renderItem={renderUserItem}
                    keyExtractor={(item, index) => `${item.id}_${index}`}
                    ListHeaderComponent={ListHeaderComponent}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#FFFFFF"
                        />
                    }
                />
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Slight dark overlay for readability
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    headerContainer: {
        padding: 16,
        alignItems: 'center',
    },
    tierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        marginBottom: 16,
    },
    tierIcon: {
        fontSize: 28,
        marginRight: 8,
    },
    tierName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 16,
    },
    timerText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '500',
    },
    infoCard: {
        width: '100%',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 8,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
    infoHighlight: {
        fontWeight: '700',
        color: '#0EA5E9',
    },
    infoActivities: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    activityText: {
        fontSize: 12,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 14,
        fontWeight: '800',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameContainer: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
    },
    zoneBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    zoneText: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 2,
    },
    xpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    xpText: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 4,
    },
});

export default LeagueScreen;

/**
 * LeaderboardsScreen
 * Unified screen for all leaderboards: Daily Challenge, Weekly Puzzle, League
 * Accessible from HomeScreen and after game completion
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    ActivityIndicator,
    Animated,
    useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import leagueService from '../services/leagueService';
import weeklyGameService from '../services/weeklyGameService';
import Haptics from '../utils/haptics';
import Logger from '../utils/logger';
import { GAME_BACKGROUNDS } from '../constants/backgrounds';
import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';

// Avatar images
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

// Tab configuration - using shorter labels for better mobile fit
const TABS = [
    { id: 'daily', label: 'Daily', shortLabel: 'Daily', icon: 'today-outline' },
    { id: 'weekly', label: 'Weekly', shortLabel: 'Weekly', icon: 'calendar-outline' },
    { id: 'league', label: 'League', shortLabel: 'League', icon: 'trophy-outline' },
];

const LeaderboardsScreen = ({ navigation, route }) => {
    const { colors, isDarkMode, activeTheme } = useTheme();
    const isCyberpunk = activeTheme === 'cyberpunk';
    const { user, userProfile, stats } = useApp();
    const { width: screenWidth } = useWindowDimensions();
    const isSmallScreen = screenWidth < 360;

    // Get initial tab from route params (allows navigating directly to a specific tab)
    const initialTab = route?.params?.initialTab || 'daily';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [refreshing, setRefreshing] = useState(false);

    // Animation for tab content fade
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Daily Challenge state
    const [dailyLeaderboard, setDailyLeaderboard] = useState([]);
    const [dailyLoading, setDailyLoading] = useState(true);

    // Weekly Puzzle state
    const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
    const [weeklyLoading, setWeeklyLoading] = useState(true);

    // League state
    const [leagueUsers, setLeagueUsers] = useState([]);
    const [leagueLoading, setLeagueLoading] = useState(true);
    const [userTier, setUserTier] = useState(leagueService.LEAGUE_TIERS?.bronze || { name: 'Bronze', color: '#CD7F32', icon: '🥉' });
    const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0 });

    // Fetch Daily Challenge leaderboard
    const fetchDailyLeaderboard = useCallback(async () => {
        try {
            setDailyLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(
                `${BACKEND_URL}/api/daily/leaderboard?date=${today}&limit=50`,
                { headers: { 'x-client-secret': APP_CLIENT_SECRET } }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.leaderboard) {
                    setDailyLeaderboard(data.leaderboard);
                }
            }
        } catch (error) {
            Logger.error('[LEADERBOARDS] Daily fetch error:', error);
        } finally {
            setDailyLoading(false);
        }
    }, []);

    // Fetch Weekly Puzzle leaderboard
    const fetchWeeklyLeaderboard = useCallback(async () => {
        try {
            setWeeklyLoading(true);
            const data = await weeklyGameService.getLeaderboard('weekly');
            if (data.success && data.leaderboard) {
                setWeeklyLeaderboard(data.leaderboard);
            }
        } catch (error) {
            Logger.error('[LEADERBOARDS] Weekly fetch error:', error);
        } finally {
            setWeeklyLoading(false);
        }
    }, []);

    // Fetch League leaderboard
    const fetchLeagueLeaderboard = useCallback(async () => {
        try {
            setLeagueLoading(true);
            // buildLeague now returns { league, tier, tierKey } object
            const result = await leagueService.buildLeague(userProfile);
            setLeagueUsers(result.league);

            // Use tier from backend response instead of recalculating
            setUserTier(result.tier);

            const time = leagueService.getTimeUntilReset();
            setTimeRemaining(time);
        } catch (error) {
            Logger.error('[LEADERBOARDS] League fetch error:', error);
        } finally {
            setLeagueLoading(false);
        }
    }, [userProfile, stats]);

    // Load data when tab changes or screen focuses
    useFocusEffect(
        useCallback(() => {
            if (activeTab === 'daily') {
                fetchDailyLeaderboard();
            } else if (activeTab === 'weekly') {
                fetchWeeklyLeaderboard();
            } else if (activeTab === 'league') {
                fetchLeagueLeaderboard();
            }
        }, [activeTab, fetchDailyLeaderboard, fetchWeeklyLeaderboard, fetchLeagueLeaderboard])
    );

    // Update league timer every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeRemaining(leagueService.getTimeUntilReset());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        Haptics.light();
        if (activeTab === 'daily') {
            await fetchDailyLeaderboard();
        } else if (activeTab === 'weekly') {
            await fetchWeeklyLeaderboard();
        } else if (activeTab === 'league') {
            await fetchLeagueLeaderboard();
        }
        setRefreshing(false);
    };

    const handleTabChange = (tabId) => {
        if (tabId === activeTab) return;
        Haptics.light();

        // Fade out, change tab, fade in
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            setActiveTab(tabId);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
    };

    const getAvatarSource = (avatar) => {
        if (avatar && AVATAR_IMAGES[avatar]) {
            return AVATAR_IMAGES[avatar];
        }
        return null;
    };

    const getRankDisplay = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRankStyle = (rank) => {
        if (rank === 1) return { backgroundColor: '#FFD700', color: '#1F2937' };
        if (rank === 2) return { backgroundColor: '#C0C0C0', color: '#1F2937' };
        if (rank === 3) return { backgroundColor: '#CD7F32', color: '#FFF' };
        return { backgroundColor: 'rgba(0,0,0,0.2)', color: colors.text };
    };

    // Render Tab Bar - using flex equal width tabs
    const renderTabBar = () => (
        <View style={styles.tabContainer}>
            {TABS.map((tab) => (
                <TouchableOpacity
                    key={tab.id}
                    style={[
                        styles.tabButton,
                        activeTab === tab.id && styles.tabButtonActive,
                    ]}
                    onPress={() => handleTabChange(tab.id)}
                    activeOpacity={0.7}
                >
                    <IonIcon
                        name={tab.icon}
                        size={16}
                        color={activeTab === tab.id ? '#FFF' : 'rgba(255,255,255,0.6)'}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === tab.id && styles.tabTextActive,
                        ]}
                        numberOfLines={1}
                    >
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // Render prizes banner for Daily/Weekly
    const renderPrizesBanner = () => {
        const isDaily = activeTab === 'daily';
        const prizes = isDaily
            ? [
                { emoji: '🥇', value: '100 💎' },
                { emoji: '🥈', value: '75 💎' },
                { emoji: '🥉', value: '50 💎' },
            ]
            : [
                { emoji: '🥇', value: '1000 💎' },
                { emoji: '🥈', value: '750 💎' },
                { emoji: '🥉', value: '500 💎' },
            ];

        return (
            <View style={[styles.prizesBanner, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.prizesTitle}>🏆 {isDaily ? 'Daily' : 'Weekly'} Prizes</Text>
                <View style={styles.prizesRow}>
                    {prizes.map((prize, index) => (
                        <View key={index} style={styles.prizeItem}>
                            <Text style={styles.prizeEmoji}>{prize.emoji}</Text>
                            <Text style={styles.prizeValue}>{prize.value}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    // Render leaderboard entry
    const renderLeaderboardEntry = ({ item, index }) => {
        const isCurrentUser = item.userId === user?.uid || item.isCurrentUser;
        // For league, avatar can be in 'avatar' or 'equippedAvatar' field
        // For current user, fallback to userProfile.equippedAvatar if not in item
        let avatarKey = item.avatar || item.equippedAvatar;
        if (isCurrentUser && !avatarKey && userProfile?.equippedAvatar) {
            avatarKey = userProfile.equippedAvatar;
        }
        const avatarSource = getAvatarSource(avatarKey);
        // For league data: use username, then name. For daily/weekly: use username, then displayName
        const displayName = item.username || item.name || item.displayName || 'Anonymous';
        const rank = item.rank || index + 1;

        // Check if this entry is in demotion zone (for league tab only)
        const isInDemotionZone = activeTab === 'league' && item.zone === 'demotion';

        return (
            <View
                style={[
                    styles.entryRow,
                    {
                        backgroundColor: isCyberpunk
                            ? 'rgba(30, 20, 50, 0.95)'
                            : isDarkMode
                                ? 'rgba(55, 65, 81, 0.9)'
                                : 'rgba(255, 255, 255, 0.95)',
                        borderWidth: isCyberpunk ? 1 : 0,
                        borderColor: isCyberpunk ? 'rgba(139, 92, 246, 0.5)' : 'transparent',
                    },
                    // Demotion zone styling (red-ish background for relegation spots)
                    isInDemotionZone && !isCurrentUser && {
                        backgroundColor: isCyberpunk
                            ? 'rgba(153, 27, 27, 0.85)'
                            : isDarkMode
                                ? 'rgba(153, 27, 27, 0.8)'
                                : 'rgba(254, 202, 202, 1)',
                        borderLeftWidth: 3,
                        borderLeftColor: '#DC2626',
                    },
                    isCurrentUser && {
                        backgroundColor: isCyberpunk
                            ? 'rgba(139, 92, 246, 0.4)'
                            : isDarkMode
                                ? 'rgba(110, 63, 240, 0.5)'
                                : '#E8DCFA',
                        borderWidth: 2,
                        borderColor: isCyberpunk ? '#ff2d95' : '#6e3ff0',
                    },
                    // If current user is in demotion zone, add red border
                    isCurrentUser && isInDemotionZone && {
                        borderColor: '#DC2626',
                    },
                ]}
            >
                {/* Rank */}
                <View style={[styles.rankBadge, { backgroundColor: getRankStyle(rank).backgroundColor }]}>
                    <Text style={[styles.rankText, { color: getRankStyle(rank).color }]}>
                        {getRankDisplay(rank)}
                    </Text>
                </View>

                {/* Avatar */}
                {avatarSource ? (
                    <Image source={avatarSource} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarInitial}>
                            {displayName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                {/* Name */}
                <View style={styles.nameContainer}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                        {displayName}
                        {isCurrentUser && ' (You)'}
                    </Text>
                </View>

                {/* Score */}
                <Text style={[styles.scoreText, { color: colors.primary }]}>
                    {activeTab === 'league' ? item.weeklyXP?.toLocaleString() : item.score?.toLocaleString()}
                    {activeTab === 'league' && ' ⭐'}
                </Text>
            </View>
        );
    };

    // Render League header (tier badge, timer, info card)
    const renderLeagueHeader = () => (
        <View style={styles.leagueHeader}>
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

            {/* How to Earn Info */}
            <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F0F9FF', borderColor: isDarkMode ? '#334155' : '#BAE6FD' }]}>
                <View style={styles.infoHeader}>
                    <Icon name="information" size={20} color="#0EA5E9" />
                    <Text style={[styles.infoTitle, { color: colors.text }]}>How to Earn Stars</Text>
                </View>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Earn <Text style={styles.infoHighlight}>1 ⭐</Text> for every <Text style={styles.infoHighlight}>10 XP</Text> you collect!
                </Text>
            </View>

            {/* Zone Legend */}
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

    // Get current data and loading state
    const getCurrentData = () => {
        if (activeTab === 'daily') return { data: dailyLeaderboard, loading: dailyLoading };
        if (activeTab === 'weekly') return { data: weeklyLeaderboard, loading: weeklyLoading };
        return { data: leagueUsers, loading: leagueLoading };
    };

    const { data: currentData, loading: currentLoading } = getCurrentData();

    return (
        <ImageBackground
            source={GAME_BACKGROUNDS.PUZZLE}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                {/* Header */}
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Icon name="arrow-left" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Icon name="trophy" size={22} color="#FFD700" />
                            <Text style={styles.headerTitle}>Leaderboards</Text>
                        </View>
                        <View style={{ width: 24 }} />
                    </View>
                </SafeAreaView>

                {/* Tab Bar */}
                {renderTabBar()}

                {/* Content with fade animation */}
                <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                    {currentLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFF" />
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={currentData}
                            renderItem={renderLeaderboardEntry}
                            keyExtractor={(item, index) => item.userId || item.id || `${index}`}
                            ListHeaderComponent={() => (
                                <>
                                    {activeTab === 'league' ? renderLeagueHeader() : renderPrizesBanner()}
                                    <View style={[styles.statsBar, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' }]}>
                                        <Icon name="earth" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                        <Text style={styles.statsText}>
                                            {currentData.length} players • {activeTab === 'daily' ? 'Today' : activeTab === 'weekly' ? 'This Week' : 'Weekly League'}
                                        </Text>
                                    </View>
                                </>
                            )}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Icon name="trophy-outline" size={48} color="rgba(255,255,255,0.5)" />
                                    <Text style={styles.emptyText}>No entries yet</Text>
                                    <Text style={styles.emptySubtext}>Be the first to compete!</Text>
                                </View>
                            )}
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
                    )}
                </Animated.View>
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
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
        paddingBottom: 12,
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    tabScrollView: {
        marginHorizontal: 16,
        marginBottom: 12,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 4,
    },
    tabScrollContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 4,
    },
    contentContainer: {
        flex: 1,
    },
    tabButtonActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 12,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    prizesBanner: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    prizesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
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
        color: '#FFFFFF',
        marginTop: 4,
        fontWeight: '600',
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    statsText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '500',
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    rankBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 14,
        fontWeight: '800',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    nameContainer: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
    },
    scoreText: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginTop: 4,
    },
    // League-specific styles
    leagueHeader: {
        alignItems: 'center',
        marginBottom: 12,
    },
    tierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        marginBottom: 12,
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
        marginBottom: 12,
    },
    timerText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    infoCard: {
        width: '100%',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
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
    },
    infoHighlight: {
        fontWeight: '700',
        color: '#0EA5E9',
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
});

export default LeaderboardsScreen;

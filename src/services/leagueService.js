import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Logger from '../utils/logger';
import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';

// Mock names for generating league users (fallback)
const FIRST_NAMES = [
    'Emma', 'Liam', 'Sofia', 'Noah', 'Ava', 'Oliver', 'Isabella', 'Lucas',
    'Mia', 'Ethan', 'Charlotte', 'Mason', 'Amelia', 'Logan', 'Harper', 'James',
    'Evelyn', 'Alexander', 'Aria', 'Sebastian', 'Luna', 'Jack', 'Chloe', 'Henry',
    'Penelope', 'Owen', 'Layla', 'Julian', 'Riley', 'Leo', 'Zoey', 'Adam'
];

const LEAGUE_TIERS = {
    bronze: { name: 'Bronze', minXP: 0, icon: '🥉', color: '#CD7F32' },
    silver: { name: 'Silver', minXP: 500, icon: '🥈', color: '#C0C0C0' },
    gold: { name: 'Gold', minXP: 1500, icon: '🥇', color: '#FFD700' },
    diamond: { name: 'Diamond', minXP: 3500, icon: '💎', color: '#B9F2FF' },
    master: { name: 'Master', minXP: 7000, icon: '👑', color: '#9B59B6' },
};

// Get days since week start (for daily XP progression)
const getDaysSinceWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sunday, 1=Monday, etc.
    // Week starts on Monday, so Monday=0, Sunday=6
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
};

// Available avatars for mock users
const MOCK_AVATARS = [
    'avatar_gecko',
    'avatar_chameleon',
    'avatar_dragon',
    'avatar_axolotl',
    'avatar_mascott',
    'avatar_speedy',
];

// Generate mock users with XP close to the user's level (fallback only)
// Mock users have LOWER XP range than real user to make league beatable
export const generateLeagueUsers = (userXP, count = 9) => {
    const users = [];

    // Shuffle names to get unique ones
    const shuffledNames = [...FIRST_NAMES].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
        // Use modulo to cycle through names if we need more than available
        const name = shuffledNames[i % shuffledNames.length];
        const baseSeed = i * 7919; // Prime number for pseudo-random seed
        // Reduced XP range: 30-80% of user XP (easier to beat)
        const minXP = Math.max(5, Math.floor(userXP * 0.3));
        const maxXP = Math.max(30, Math.floor(userXP * 0.8));
        const xp = Math.floor((baseSeed % (maxXP - minXP + 1))) + minXP;
        // Assign random avatar
        const randomAvatar = MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)];

        users.push({
            id: `mock_user_${i}_${baseSeed}`, // Unique stable ID
            name: name,
            weeklyXP: xp,
            avatar: randomAvatar,
            isCurrentUser: false,
        });
    }

    return users;
};

// Get user's league tier based on total XP
export const getUserTier = (totalXP) => {
    if (totalXP >= LEAGUE_TIERS.master.minXP) return LEAGUE_TIERS.master;
    if (totalXP >= LEAGUE_TIERS.diamond.minXP) return LEAGUE_TIERS.diamond;
    if (totalXP >= LEAGUE_TIERS.gold.minXP) return LEAGUE_TIERS.gold;
    if (totalXP >= LEAGUE_TIERS.silver.minXP) return LEAGUE_TIERS.silver;
    return LEAGUE_TIERS.bronze;
};

// Get time remaining until weekly reset (Sunday midnight UTC)
export const getTimeUntilReset = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;

    const resetDate = new Date(now);
    resetDate.setUTCDate(now.getUTCDate() + daysUntilSunday);
    resetDate.setUTCHours(0, 0, 0, 0);

    const diff = resetDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { days, hours, resetDate };
};

// Get weekly XP for current user from Firestore
export const fetchUserWeeklyXP = async () => {
    const user = auth().currentUser;
    if (!user) return 0;

    try {
        const weekId = getWeekId();
        const doc = await firestore()
            .collection('weeklyAggregatedScores')
            .doc(`${weekId}_${user.uid}`)
            .get();

        return doc.exists ? (doc.data()?.totalScore || 0) : 0;
    } catch (error) {
        Logger.error('[LEAGUE] Failed to fetch weekly XP:', error);
        return 0;
    }
};

// Get week ID in format YYYY-WW using ISO week date system (weeks start on Monday)
export const getWeekId = () => {
    const now = new Date();

    // Get the Thursday of the current week (ISO 8601 - week belongs to year of its Thursday)
    const thursday = new Date(now);
    thursday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + 3);

    // Get the first Thursday of the year
    const firstThursday = new Date(thursday.getFullYear(), 0, 4);
    firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

    // Calculate the week number
    const weekNum = Math.floor((thursday - firstThursday) / (7 * 24 * 60 * 60 * 1000)) + 1;

    return `${thursday.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
};

// Fallback: Build mock-only league (10 users total)
const buildMockLeague = async (userProfile) => {
    const weeklyXP = await fetchUserWeeklyXP();
    const mockUsers = generateLeagueUsers(weeklyXP, 9); // 9 mocks + 1 user = 10

    const currentUser = {
        id: auth().currentUser?.uid || 'current_user',
        name: userProfile?.displayName || 'You',
        weeklyXP: weeklyXP,
        avatar: userProfile?.avatar || null,
        isCurrentUser: true,
    };

    const allUsers = [...mockUsers, currentUser];
    allUsers.sort((a, b) => b.weeklyXP - a.weeklyXP);

    // Top 3 = promotion, Bottom 3 (8-10) = demotion
    allUsers.forEach((user, index) => {
        user.rank = index + 1;
        user.zone = index < 3 ? 'promotion' : (index >= 7 ? 'demotion' : 'safe');
    });

    return allUsers;
};

/**
 * Build league with real + mock users from backend
 * Falls back to mock-only if backend fails
 */
export const buildLeague = async (userProfile) => {
    const user = auth().currentUser;
    if (!user) {
        Logger.warn('[LEAGUE] No user, returning empty league');
        return [];
    }

    const LEAGUE_SIZE = 10;

    try {
        Logger.info('[LEAGUE] Fetching league from backend...');

        const response = await fetch(`${BACKEND_URL}/api/league/get-league`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-secret': APP_CLIENT_SECRET,
            },
            body: JSON.stringify({ userId: user.uid }),
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.league) {
                Logger.info('[LEAGUE] ✅ Got league from backend', {
                    realUsers: data.realUserCount,
                    mockUsers: data.mockUserCount,
                    tier: data.tier?.name,
                    leagueSize: data.league.length,
                });

                // Transform backend response to frontend format
                // Also get tier key to check for bronze demotion
                const tierKey = data.tierKey || data.tier?.key || 'bronze';
                const hasDemotion = tierKey !== 'bronze';

                // Helper to get random avatar for users without one
                const getRandomAvatar = () => MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)];

                let league = data.league.map(u => ({
                    id: u.userId,
                    name: u.displayName || 'Player',
                    username: u.displayName, // Backend already prefers username
                    weeklyXP: u.weeklyScore || 0,
                    // Assign random avatar if missing (for backward compatibility)
                    avatar: u.avatar || getRandomAvatar(),
                    isCurrentUser: u.userId === user.uid,
                    rank: u.rank,
                    zone: u.zone,
                    isRealUser: u.isRealUser,
                }));

                // Safeguard: If backend returned fewer than LEAGUE_SIZE users, add mock users
                if (league.length < LEAGUE_SIZE) {
                    Logger.warn('[LEAGUE] Backend returned fewer users than expected, adding mocks', {
                        received: league.length,
                        expected: LEAGUE_SIZE,
                    });

                    // Find user's XP for generating mocks around it
                    const currentUserEntry = league.find(u => u.isCurrentUser);
                    const userXP = currentUserEntry?.weeklyXP || 0;

                    // Generate additional mocks
                    const mocksNeeded = LEAGUE_SIZE - league.length;
                    const additionalMocks = generateLeagueUsers(userXP, mocksNeeded);

                    league = [...league, ...additionalMocks];

                    // Re-sort and re-rank with new zones (top 3 promote, bottom 3 demote unless bronze)
                    league.sort((a, b) => b.weeklyXP - a.weeklyXP);
                    league.forEach((u, index) => {
                        u.rank = index + 1;
                        // Bronze tier has NO demotion zone
                        u.zone = index < 3 ? 'promotion' : (hasDemotion && index >= 7 ? 'demotion' : 'safe');
                    });
                }

                // Return object with league and tier info from backend
                return {
                    league,
                    tier: data.tier || LEAGUE_TIERS[tierKey] || LEAGUE_TIERS.bronze,
                    tierKey,
                };
            } else {
                // Backend returned ok but data.success is false or no league
                Logger.error('[LEAGUE] Backend returned ok but no valid data:', JSON.stringify(data));
            }
        } else {
            // Backend returned non-ok status
            const errorText = await response.text();
            Logger.error(`[LEAGUE] Backend failed with status ${response.status}:`, errorText);
        }

        Logger.warn('[LEAGUE] Backend failed, using fallback');
        const fallbackLeague = buildMockLeague(userProfile);
        const fallbackTier = getUserTier(userProfile?.xp || 0);
        return { league: fallbackLeague, tier: fallbackTier, tierKey: fallbackTier.key };
    } catch (error) {
        Logger.error('[LEAGUE] Build league failed:', error.message || error);
        const fallbackLeague = buildMockLeague(userProfile);
        const fallbackTier = getUserTier(userProfile?.xp || 0);
        return { league: fallbackLeague, tier: fallbackTier, tierKey: fallbackTier.key };
    }
};

/**
 * Earn stars for league ranking
 * Stars are calculated as XP / 10 and added to the weekly score
 */
export const earnStars = async (earnedXP, userProfile = null) => {
    const user = auth().currentUser;
    if (!user || earnedXP <= 0) {
        Logger.info('[LEAGUE] Cannot earn stars - no user or invalid XP:', { earnedXP });
        return false;
    }

    try {
        const stars = Math.floor(earnedXP / 10);
        if (stars <= 0) {
            Logger.info('[LEAGUE] No stars to award (XP too low):', { earnedXP });
            return false;
        }

        const weekId = getWeekId();
        const docId = `${weekId}_${user.uid}`;

        Logger.info('[LEAGUE] ⭐ Earning stars:', { stars, earnedXP, weekId, userId: user.uid });

        // Update weekly score with display info for backend league matching
        // Prefer username over displayName for league display
        const leagueName = userProfile?.username || userProfile?.displayName || 'Player';
        await firestore()
            .collection('weeklyAggregatedScores')
            .doc(docId)
            .set({
                totalScore: firestore.FieldValue.increment(stars),
                userId: user.uid,
                weekId: weekId,
                displayName: leagueName,
                avatar: userProfile?.equippedAvatar || userProfile?.avatar || null,
                lastUpdated: firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

        Logger.info('[LEAGUE] ✅ Stars earned successfully:', { stars });
        return true;
    } catch (error) {
        Logger.error('[LEAGUE] ❌ Failed to earn stars:', error);
        return false;
    }
};

export default {
    generateLeagueUsers,
    getUserTier,
    getTimeUntilReset,
    fetchUserWeeklyXP,
    buildLeague,
    earnStars,
    LEAGUE_TIERS,
};

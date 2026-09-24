/**
 * Shop Item Service
 * Handles using consumable items from user's inventory
 */
import firestore from '@react-native-firebase/firestore';
import Logger from '../utils/logger';

const shopItemService = {
    /**
     * Use a Streak Freeze to protect streak for today
     * @param {string} userId - User's Firebase UID
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async useStreakFreeze(userId) {
        try {
            const userRef = firestore().collection('users').doc(userId);

            const result = await firestore().runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw new Error('User not found');

                const inventory = userDoc.data().inventory || {};
                const streakFreezeCount = inventory.streakFreeze || 0;

                if (streakFreezeCount < 1) {
                    throw new Error('No Streak Freeze items available');
                }

                // Set freeze active until end of today (midnight)
                const today = new Date();
                today.setHours(23, 59, 59, 999);

                transaction.update(userRef, {
                    'inventory.streakFreeze': firestore.FieldValue.increment(-1),
                    'activeBuffs.streakFreezeUntil': firestore.Timestamp.fromDate(today),
                });

                return { success: true, message: 'Streak protected for today!' };
            });

            Logger.info('[SHOP_SERVICE] Streak Freeze used:', userId);
            return result;
        } catch (error) {
            Logger.error('[SHOP_SERVICE] Streak Freeze error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Use an XP Potion for 2x XP multiplier for 30 minutes
     * @param {string} userId - User's Firebase UID
     * @returns {Promise<{success: boolean, message: string, expiresAt?: Date}>}
     */
    async useXPPotion(userId) {
        try {
            const userRef = firestore().collection('users').doc(userId);

            const result = await firestore().runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw new Error('User not found');

                const inventory = userDoc.data().inventory || {};
                const potionCount = inventory.xpPotion || 0;

                if (potionCount < 1) {
                    throw new Error('No XP Potion items available');
                }

                // Set buff active for 30 minutes
                const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

                transaction.update(userRef, {
                    'inventory.xpPotion': firestore.FieldValue.increment(-1),
                    'activeBuffs.xpMultiplier': 2,
                    'activeBuffs.xpMultiplierUntil': firestore.Timestamp.fromDate(expiresAt),
                });

                return { success: true, message: 'Double XP active for 30 minutes!', expiresAt };
            });

            Logger.info('[SHOP_SERVICE] XP Potion used:', userId);
            return result;
        } catch (error) {
            Logger.error('[SHOP_SERVICE] XP Potion error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Use Streak Repair to restore a broken streak (within 48h)
     * @param {string} userId - User's Firebase UID
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async useStreakRepair(userId) {
        try {
            const userRef = firestore().collection('users').doc(userId);

            const result = await firestore().runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw new Error('User not found');

                const data = userDoc.data();
                const inventory = data.inventory || {};
                const repairCount = inventory.streakRepair || 0;

                if (repairCount < 1) {
                    throw new Error('No Streak Repair items available');
                }

                // Check if streak was broken within 48 hours
                // Use lastPracticeDate to match DB field name
                const lastPractice = data.lastPracticeDate?.toDate?.() || data.lastPracticeDate;
                if (lastPractice) {
                    const hoursSince = (Date.now() - new Date(lastPractice).getTime()) / (1000 * 60 * 60);
                    if (hoursSince > 48) {
                        throw new Error('Streak can only be repaired within 48 hours of breaking');
                    }
                }

                // Restore streak to previous value (or at least 1)
                const previousStreak = data.previousStreak || data.longestStreak || 1;

                transaction.update(userRef, {
                    'inventory.streakRepair': firestore.FieldValue.increment(-1),
                    'currentStreak': previousStreak,
                    'lastPracticeDate': firestore.FieldValue.serverTimestamp(),
                });

                return { success: true, message: `Streak restored to ${previousStreak} days!` };
            });

            Logger.info('[SHOP_SERVICE] Streak Repair used:', userId);
            return result;
        } catch (error) {
            Logger.error('[SHOP_SERVICE] Streak Repair error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Check for active buffs on user account
     * @param {string} userId - User's Firebase UID
     * @returns {Promise<{xpMultiplier: number, streakProtected: boolean}>}
     */
    async checkActiveBuffs(userId) {
        try {
            const userDoc = await firestore().collection('users').doc(userId).get();
            if (!userDoc.exists) return { xpMultiplier: 1, streakProtected: false };

            const data = userDoc.data();
            const buffs = data.activeBuffs || {};
            const now = new Date();

            // Check XP multiplier
            let xpMultiplier = 1;
            if (buffs.xpMultiplierUntil) {
                const expiresAt = buffs.xpMultiplierUntil.toDate?.() || new Date(buffs.xpMultiplierUntil);
                if (expiresAt > now) {
                    xpMultiplier = buffs.xpMultiplier || 2;
                }
            }

            // Check streak protection
            let streakProtected = false;
            if (buffs.streakFreezeUntil) {
                const protectedUntil = buffs.streakFreezeUntil.toDate?.() || new Date(buffs.streakFreezeUntil);
                if (protectedUntil > now) {
                    streakProtected = true;
                }
            }

            return { xpMultiplier, streakProtected };
        } catch (error) {
            Logger.error('[SHOP_SERVICE] Check buffs error:', error);
            return { xpMultiplier: 1, streakProtected: false };
        }
    },

    /**
     * Get user's current inventory
     * @param {string} userId - User's Firebase UID
     * @returns {Promise<Object>}
     */
    async getInventory(userId) {
        try {
            const userDoc = await firestore().collection('users').doc(userId).get();
            if (!userDoc.exists) return {};
            return userDoc.data().inventory || {};
        } catch (error) {
            Logger.error('[SHOP_SERVICE] Get inventory error:', error);
            return {};
        }
    },

    /**
     * Use a Heart Refill potion to restore lives in Daily Challenge
     * @param {string} userId - User's Firebase UID
     * @returns {Promise<boolean>}
     */
    async useHeartRefill(userId) {
        try {
            const userRef = firestore().collection('users').doc(userId);

            const result = await firestore().runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw new Error('User not found');

                const inventory = userDoc.data().inventory || {};
                const refillCount = inventory.heartRefill || 0;

                if (refillCount < 1) {
                    throw new Error('No Heart Refill items available');
                }

                transaction.update(userRef, {
                    'inventory.heartRefill': firestore.FieldValue.increment(-1),
                });

                return true;
            });

            Logger.info('[SHOP_SERVICE] Heart Refill used:', userId);
            return result;
        } catch (error) {
            Logger.error('[SHOP_SERVICE] Heart Refill error:', error);
            return false;
        }
    },

    /**
     * Refund a Heart Refill potion (if game update failed after using)
     * @param {string} userId - User's Firebase UID
     * @returns {Promise<boolean>}
     */
    async refundHeartRefill(userId) {
        try {
            const userRef = firestore().collection('users').doc(userId);
            await userRef.update({
                'inventory.heartRefill': firestore.FieldValue.increment(1),
            });
            Logger.info('[SHOP_SERVICE] Heart Refill refunded:', userId);
            return true;
        } catch (error) {
            Logger.error('[SHOP_SERVICE] Heart Refill refund error:', error);
            return false;
        }
    },
};

export default shopItemService;

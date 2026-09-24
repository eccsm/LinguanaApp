/**
 * Weekly Game Service - API layer for weekly puzzle challenge
 * Handles all backend communication for the puzzle game
 */

import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';
import { PuzzleApiResponse, latinize } from '../models/PuzzleModel';

// ============================================================================
// Response Types
// ============================================================================

export interface SubmitWordResponse {
    success: boolean;
    valid: boolean;
    alreadyFound?: boolean;
    word?: string;
    points?: number;
    totalScore?: number;
    wordsFound?: number;
    totalWords?: number;
    completed?: boolean;
    message?: string;
}

export interface HintResponse {
    success: boolean;
    cell?: {
        row: number;
        col: number;
        letter: string;
    };
    gemsCost?: number;
    gemsRemaining?: number;
    xpCost?: number;
    xpRemaining?: number;
    wordsRevealedByHint?: string[];
    pointsEarned?: number;
    completed?: boolean;
    wordsFound?: number;
    totalWords?: number;
    error?: string;
}

export interface TipResponse {
    success: boolean;
    tip?: {
        meaning: string;
        wordLanguage: string;
        translationLanguage: string;
        wordLength: number;
    };
    gemsCost?: number;
    gemsRemaining?: number;
    error?: string;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    displayName: string;
    username?: string;
    avatar: string | null;
    score: number;
    wordsFound?: number;
    completed?: boolean;
}

export interface LeaderboardResponse {
    success: boolean;
    type: 'daily' | 'weekly';
    puzzleDate?: string;
    weekId?: string;
    leaderboard: LeaderboardEntry[];
    prizes?: { 1: number; 2: number; 3: number };
    error?: string;
}

// ============================================================================
// Service Implementation
// ============================================================================

class WeeklyGameService {
    private baseUrl: string;
    private headers: Record<string, string>;

    constructor() {
        this.baseUrl = BACKEND_URL;
        this.headers = {
            'Content-Type': 'application/json',
            'x-client-secret': APP_CLIENT_SECRET,
        };
    }

    /**
     * Fetches the current week's puzzle challenge
     * @param userId - The user's ID
     * @param dayId - Optional day number (1-7, Mon-Sun). If not provided, returns today's puzzle.
     */
    async getChallenge(userId: string, dayId?: number): Promise<PuzzleApiResponse> {
        try {
            let url = `${this.baseUrl}/api/weekly/challenge?userId=${encodeURIComponent(userId)}`;

            // If a specific day is requested, add it to the query
            if (dayId !== undefined) {
                url += `&dayId=${dayId}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error('[WeeklyGameService] getChallenge error:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch puzzle',
            };
        }
    }

    /**
     * Submits a word attempt to the server
     * @param dayId - Optional day number (1-7, Mon-Sun). If not provided, uses today's puzzle.
     */
    async submitWord(userId: string, word: string, dayId?: number): Promise<SubmitWordResponse> {
        try {
            const normalizedWord = latinize(word);

            const response = await fetch(`${this.baseUrl}/api/weekly/submit`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    userId,
                    word: normalizedWord,
                    dayId,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error('[WeeklyGameService] submitWord error:', error);
            return {
                success: false,
                valid: false,
                message: error.message || 'Failed to submit word',
            };
        }
    }

    /**
     * Uses a hint (costs gems) to reveal a random undiscovered word
     * @param dayId - Optional day number (1-7, Mon-Sun). If not provided, uses today's puzzle.
     */
    async useHint(userId: string, paidByAd: boolean = false, dayId?: number): Promise<HintResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/weekly/hint`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ userId, paidByAd, dayId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error('[WeeklyGameService] useHint error:', error);
            return {
                success: false,
                error: error.message || 'Failed to use hint',
            };
        }
    }

    /**
     * Uses a tip (costs gems) to get a translation hint for an undiscovered word
     * @param dayId - Optional day number (1-7, Mon-Sun). If not provided, uses today's puzzle.
     */
    async useTip(userId: string, paidByAd: boolean = false, dayId?: number): Promise<TipResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/weekly/tip`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ userId, paidByAd, dayId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error('[WeeklyGameService] useTip error:', error);
            return {
                success: false,
                error: error.message || 'Failed to use tip',
            };
        }
    }

    /**
     * Fetches the leaderboard
     * @param type - 'daily' for today's puzzle, 'weekly' for weekly aggregate
     * @param limit - max entries to fetch
     */
    async getLeaderboard(type: 'daily' | 'weekly' = 'daily', limit: number = 50): Promise<LeaderboardResponse> {
        try {
            const url = `${this.baseUrl}/api/weekly/leaderboard?type=${type}&limit=${limit}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error('[WeeklyGameService] getLeaderboard error:', error);
            return {
                success: false,
                type,
                leaderboard: [],
                error: error.message || 'Failed to fetch leaderboard',
            };
        }
    }
}

// Export singleton instance
const weeklyGameService = new WeeklyGameService();
export default weeklyGameService;

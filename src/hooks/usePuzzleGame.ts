/**
 * usePuzzleGame Hook
 * Central state management for the weekly word puzzle game
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    PuzzleState,
    PlacedWord,
    createGridFromWords,
    revealWord,
    revealCell,
    apiWordsToPlacedWords,
    latinize,
    getWordCellKeys,
} from '../models/PuzzleModel';
import weeklyGameService from '../services/weeklyGameService';
import rewardedAdService from '../services/rewardedAdService';
import Haptics from '../utils/haptics';
import sfxService from '../services/sfxService';

// ============================================================================
// Types
// ============================================================================

export type GameState = 'loading' | 'playing' | 'complete' | 'error';

export interface UsePuzzleGameReturn {
    // State
    gameState: GameState;
    puzzle: PuzzleState | null;
    currentWord: string;
    selectedIndices: number[];
    error: string | null;
    isSubmitting: boolean;
    highlightedWordCells: Set<string>; // Cells to highlight for duplicate word

    // Actions
    selectLetter: (index: number) => void;
    clearSelection: () => void;
    submitWord: () => Promise<void>;
    useHint: (userGems: number) => Promise<void>;
    useTip: (userGems: number) => Promise<void>;
    refreshPuzzle: () => Promise<void>;

    // Animation triggers (for parent component)
    lastSubmitResult: 'success' | 'duplicate' | 'invalid' | null;
    clearLastSubmitResult: () => void;

    // Tip state
    activeTip: { meaning: string; wordLanguage: string; wordLength: number } | null;
    clearActiveTip: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

// Type for the showAlert function (same signature as Alert.alert)
type ShowAlertFunction = (
    title: string,
    message?: string,
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
    options?: { type?: string }
) => void;

export function usePuzzleGame(userId: string | undefined, showAlert?: ShowAlertFunction, dayId?: number): UsePuzzleGameReturn {
    // Game state
    const [gameState, setGameState] = useState<GameState>('loading');
    const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Selection state
    const [currentWord, setCurrentWord] = useState('');
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSubmitResult, setLastSubmitResult] = useState<'success' | 'duplicate' | 'invalid' | null>(null);
    const [activeTip, setActiveTip] = useState<{ meaning: string; wordLanguage: string; wordLength: number } | null>(null);
    const [highlightedWordCells, setHighlightedWordCells] = useState<Set<string>>(new Set());

    // Refs for callbacks
    const puzzleRef = useRef<PuzzleState | null>(null);

    // Keep puzzleRef in sync
    useEffect(() => {
        puzzleRef.current = puzzle;
    }, [puzzle]);

    // Reset puzzle state when dayId changes to ensure fresh data
    useEffect(() => {
        setPuzzle(null);
        setGameState('loading');
        setError(null);
        setCurrentWord('');
        setSelectedIndices([]);
        setActiveTip(null);
        setHighlightedWordCells(new Set());
    }, [dayId]);

    // ============================================================================
    // Fetch Puzzle
    // ============================================================================

    const fetchPuzzle = useCallback(async () => {
        if (!userId) {
            setError('User not authenticated');
            setGameState('error');
            return;
        }

        try {
            setGameState('loading');
            setError(null);
            clearSelection();

            // Pass dayId to get the specific day's puzzle (undefined = current day)
            const data = await weeklyGameService.getChallenge(userId, dayId);

            if (data.success && data.words && data.letters) {
                // Convert API words to PlacedWord objects
                const words = apiWordsToPlacedWords(
                    data.words,
                    data.userProgress?.foundWords || []
                );

                // Build grid from words
                const { grid, gridSize } = createGridFromWords(words);

                // Reveal already found words
                let revealedGrid = grid;
                words.filter(w => w.isFound).forEach(w => {
                    revealedGrid = revealWord(revealedGrid, w);
                });

                // Reveal specifically hinted cells
                const revealedCells = new Set(data.userProgress?.revealedCells || []);
                revealedCells.forEach(cellKey => {
                    const [r, c] = cellKey.split(',').map(Number);
                    revealedGrid = revealCell(revealedGrid, r, c);
                });

                const puzzleState: PuzzleState = {
                    puzzleId: data.puzzleId || '',
                    letters: data.letters,
                    words,
                    grid: revealedGrid,
                    gridSize,
                    foundWords: data.userProgress?.foundWords || [],
                    revealedCells,
                    score: data.userProgress?.score || 0,
                    completed: data.userProgress?.completed || false,
                    config: data.config,
                };

                setPuzzle(puzzleState);
                setGameState(puzzleState.completed ? 'complete' : 'playing');
            } else {
                setError(data.error || 'Failed to load puzzle');
                setGameState('error');
            }
        } catch (err: any) {
            console.error('[usePuzzleGame] fetchPuzzle error:', err);
            setError(err.message || 'Network error');
            setGameState('error');
        }
    }, [userId, dayId]);

    // Fetch on mount and when dayId changes
    useEffect(() => {
        fetchPuzzle();
    }, [fetchPuzzle]);

    // ============================================================================
    // Letter Selection
    // ============================================================================

    const selectLetter = useCallback((index: number) => {
        if (!puzzleRef.current) return;

        setSelectedIndices(prev => {
            const beforeLastIndex = prev[prev.length - 2];

            // Check if backtracking
            if (prev.includes(index)) {
                if (prev.length > 1 && beforeLastIndex === index) {
                    // Backtrack - remove last letter
                    const newIndices = prev.slice(0, -1);
                    const newWord = newIndices.map(i => puzzleRef.current!.letters[i]).join('');
                    setCurrentWord(newWord);
                    return newIndices;
                }
                // Already selected but not backtracking - ignore
                return prev;
            }

            // Add new letter
            const newIndices = [...prev, index];
            const newWord = newIndices.map(i => puzzleRef.current!.letters[i]).join('');
            setCurrentWord(newWord);
            return newIndices;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIndices([]);
        setCurrentWord('');
    }, []);

    // ============================================================================
    // Submit Word
    // ============================================================================

    const submitWord = useCallback(async () => {
        const wordToSubmit = currentWord;
        const currentPuzzle = puzzleRef.current;

        // Clear selection immediately for responsive feel
        clearSelection();

        if (!currentPuzzle || !userId || wordToSubmit.length < 3) {
            return;
        }

        const normalizedWord = latinize(wordToSubmit);

        // OPTIMISTIC: Check locally first if word is already found (instant feedback)
        const wordObj = currentPuzzle.words.find(
            w => w.normalizedWord === normalizedWord
        );

        if (wordObj && wordObj.isFound) {
            // Already found - instant feedback with highlighting
            setLastSubmitResult('duplicate');
            sfxService.playAlready();
            Haptics.warning();

            // Highlight the cells of this word
            const cellKeys = getWordCellKeys(wordObj);
            setHighlightedWordCells(new Set(cellKeys));

            // Clear highlight after animation
            setTimeout(() => {
                setHighlightedWordCells(new Set());
            }, 600);

            return; // Skip API call for duplicates
        }

        // OPTIMISTIC: Check if word is valid in puzzle before API
        if (!wordObj) {
            // Word not in puzzle - instant invalid feedback
            setLastSubmitResult('invalid');
            sfxService.play('wrong');
            Haptics.error();
            return; // Skip API call for invalid words
        }

        // Word is valid and not yet found - update UI immediately (optimistic)
        setLastSubmitResult('success');
        sfxService.playPuzzleSuccess();
        Haptics.success();

        // Update puzzle state immediately (optimistic)
        setPuzzle(prev => {
            if (!prev) return prev;

            const updatedWords = prev.words.map(w =>
                w.id === wordObj.id ? { ...w, isFound: true } : w
            );
            const updatedGrid = revealWord(prev.grid, wordObj);
            const updatedFoundWords = [...prev.foundWords, normalizedWord];

            const isComplete = updatedWords.every(w => w.isFound);

            const newState: PuzzleState = {
                ...prev,
                words: updatedWords,
                grid: updatedGrid,
                foundWords: updatedFoundWords,
                score: prev.score + wordObj.points,
                completed: isComplete,
            };

            if (isComplete) {
                setGameState('complete');
            }

            return newState;
        });

        // Background: Sync with server (don't block UI)
        try {
            // Pass dayId to ensure word is saved to the correct day's puzzle
            const result = await weeklyGameService.submitWord(userId, wordToSubmit, dayId);
            // Update score from server if different
            if (result.totalScore !== undefined) {
                setPuzzle(prev => {
                    if (!prev) return prev;
                    return { ...prev, score: result.totalScore! };
                });
            }
            // Sync completion status from server to ensure consistency
            if (result.completed !== undefined && result.completed) {
                setPuzzle(prev => {
                    if (!prev || prev.completed) return prev;
                    setGameState('complete');
                    return { ...prev, completed: true };
                });
            }
        } catch (err) {
            console.error('[usePuzzleGame] submitWord sync error:', err);
            // Word was already optimistically added, so we don't rollback
        }
    }, [currentWord, userId, clearSelection]);
    // ============================================================================
    // Use Hint
    // ============================================================================

    const executeHint = useCallback(async (paidByAd: boolean = false) => {
        if (!userId) return;

        try {
            // Pass dayId to target the correct puzzle
            const result = await weeklyGameService.useHint(userId, paidByAd, dayId);

            if (result.success && result.cell) {
                // Check if puzzle is complete (from backend response)
                const isPuzzleComplete = result.completed || (result.wordsFound === result.totalWords);

                // Reveal the specific cell
                setPuzzle(prev => {
                    if (!prev) return prev;

                    const updatedGrid = revealCell(prev.grid, result.cell!.row, result.cell!.col);
                    const newRevealedCells = new Set(prev.revealedCells);
                    newRevealedCells.add(`${result.cell!.row},${result.cell!.col}`);

                    // Check if any words were fully revealed by hints
                    let updatedWords = prev.words;
                    let updatedFoundWords = prev.foundWords;
                    let updatedScore = prev.score;

                    if (result.wordsRevealedByHint && result.wordsRevealedByHint.length > 0) {
                        // Mark words as found
                        updatedWords = prev.words.map(w =>
                            result.wordsRevealedByHint!.includes(w.word)
                                ? { ...w, isFound: true }
                                : w
                        );
                        updatedFoundWords = [...prev.foundWords, ...result.wordsRevealedByHint];
                        updatedScore = prev.score + (result.pointsEarned || 0);
                    }

                    return {
                        ...prev,
                        grid: updatedGrid,
                        revealedCells: newRevealedCells,
                        words: updatedWords,
                        foundWords: updatedFoundWords,
                        score: updatedScore,
                        completed: isPuzzleComplete,
                    };
                });

                // Handle completion OUTSIDE of setPuzzle callback
                if (isPuzzleComplete) {
                    setGameState('complete');
                }

                // Play sound when hint completes a word
                if (result.wordsRevealedByHint && result.wordsRevealedByHint.length > 0) {
                    sfxService.playPuzzleSuccess();
                }

                Haptics.success();
            } else {
                showAlert?.('Error', result.error || 'Failed to use hint');
            }
        } catch (err: any) {
            console.error('[usePuzzleGame] useHint error:', err);
            showAlert?.('Error', 'Failed to use hint');
        }
    }, [puzzle, userId, dayId, showAlert]);

    const useHint = useCallback(async (userXP: number) => {
        if (!puzzle || !userId) return;

        const hintCost = puzzle.config?.hintCost || 100;

        if (userXP >= hintCost) {
            showAlert?.(
                'Use Hint?',
                `This will cost ${hintCost} XP`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Use Hint',
                        onPress: () => executeHint(),
                    },
                ]
            );
        } else {
            // Not enough XP - offer ad
            showAlert?.(
                'Not Enough XP',
                `You need ${hintCost} XP for a hint. Watch an ad to get a free hint!`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Watch Ad',
                        onPress: async () => {
                            try {
                                if (!rewardedAdService.isAdReady('HINT')) {
                                    showAlert?.('Ad Loading', 'Please wait a moment and try again.');
                                    rewardedAdService.preloadAd('HINT');
                                    return;
                                }

                                const success = await rewardedAdService.showAd(
                                    'HINT',
                                    async () => {
                                        await executeHint(true);
                                    },
                                    () => console.log('[usePuzzleGame] Ad closed'),
                                    (error: any) => {
                                        console.error('[usePuzzleGame] Ad error:', error);
                                        showAlert?.('Error', 'Failed to show ad');
                                    }
                                );

                                if (!success) {
                                    showAlert?.('Error', 'Failed to show ad. Please try again.');
                                }
                            } catch (err) {
                                console.error('[usePuzzleGame] Watch ad error:', err);
                                showAlert?.('Error', 'Failed to load ad');
                            }
                        },
                    },
                ]
            );
        }
    }, [puzzle, userId, executeHint, showAlert]);

    // ============================================================================
    // Use Tip (shows meaning without revealing word)
    // ============================================================================

    const executeTip = useCallback(async (paidByAd: boolean = false) => {
        if (!userId) return;

        try {
            // Pass dayId to target the correct puzzle
            const result = await weeklyGameService.useTip(userId, paidByAd, dayId);

            if (result.success && result.tip) {
                setActiveTip({
                    meaning: result.tip.meaning,
                    wordLanguage: result.tip.wordLanguage,
                    wordLength: result.tip.wordLength,
                });
                Haptics.success();
            } else {
                showAlert?.('Error', result.error || 'Failed to get tip');
            }
        } catch (err: any) {
            console.error('[usePuzzleGame] useTip error:', err);
            showAlert?.('Error', 'Failed to get tip');
        }
    }, [userId, dayId, showAlert]);

    const useTip = useCallback(async (userXP: number) => {
        if (!puzzle || !userId) return;

        const tipCost = 250; // Match backend tipCost

        if (userXP >= tipCost) {
            // User has enough XP - confirm and use
            showAlert?.(
                'Get Translation Tip?',
                `This will cost ${tipCost} XP and show you the meaning of an unfound word.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Use Tip', onPress: () => executeTip() },
                ]
            );
        } else {
            // Not enough XP - offer ad
            showAlert?.(
                'Not Enough XP',
                `You need ${tipCost} XP for a tip. Watch an ad to get a free tip!`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Watch Ad',
                        onPress: async () => {
                            try {
                                if (!rewardedAdService.isAdReady('HINT')) {
                                    showAlert?.('Ad Loading', 'Please wait a moment and try again.');
                                    rewardedAdService.preloadAd('HINT');
                                    return;
                                }

                                const success = await rewardedAdService.showAd(
                                    'HINT',
                                    async () => {
                                        // Reward callback - give free tip
                                        await executeTip(true);
                                    },
                                    () => {
                                        // Close callback
                                        console.log('[usePuzzleGame] Ad closed');
                                    },
                                    (error: any) => {
                                        console.error('[usePuzzleGame] Ad error:', error);
                                        showAlert?.('Error', 'Failed to show ad');
                                    }
                                );

                                if (!success) {
                                    showAlert?.('Error', 'Failed to show ad. Please try again.');
                                }
                            } catch (err) {
                                console.error('[usePuzzleGame] Watch ad error:', err);
                                showAlert?.('Error', 'Failed to load ad');
                            }
                        },
                    },
                ]
            );
        }
    }, [puzzle, userId, executeTip, showAlert]);

    // ============================================================================
    // Helpers
    // ============================================================================

    const clearLastSubmitResult = useCallback(() => {
        setLastSubmitResult(null);
    }, []);

    const clearActiveTip = useCallback(() => {
        setActiveTip(null);
    }, []);

    // ============================================================================
    // Return
    // ============================================================================

    return {
        gameState,
        puzzle,
        currentWord,
        selectedIndices,
        error,
        isSubmitting,
        highlightedWordCells,
        selectLetter,
        clearSelection,
        submitWord,
        useHint,
        useTip,
        refreshPuzzle: fetchPuzzle,
        lastSubmitResult,
        clearLastSubmitResult,
        activeTip,
        clearActiveTip,
    };
}

export default usePuzzleGame;

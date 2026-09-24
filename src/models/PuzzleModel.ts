/**
 * Puzzle Model - Core data types and grid utilities for the weekly word puzzle game
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface Cell {
    row: number;
    col: number;
    letter: string;
    wordIds: string[];  // IDs of words passing through this cell
    isRevealed: boolean;
    isHighlighted: boolean;
}

export interface PlacedWord {
    id: string;
    word: string;
    normalizedWord: string;  // Latinized uppercase version
    lang: string;
    meaning?: string | null; // For tip/hint feature
    row: number;
    col: number;
    direction: 'H' | 'V';
    points: number;
    isFound: boolean;
}

export interface PuzzleState {
    puzzleId: string;
    letters: string[];
    words: PlacedWord[];
    grid: Map<string, Cell>;  // key = "row,col"
    gridSize: { rows: number; cols: number };
    foundWords: string[];
    revealedCells: Set<string>; // key = "row,col"
    score: number;
    completed: boolean;
    config?: {
        hintCost: number;
        completionReward: number;
    };
}

export interface PuzzleApiResponse {
    success: boolean;
    puzzleId?: string;
    letters?: string[];
    words?: Array<{
        word: string;
        lang: string;
        row: number;
        col: number;
        direction: 'H' | 'V';
        points: number;
    }>;
    wordCount?: number;
    config?: {
        hintCost: number;
        completionReward: number;
    };
    userProgress?: {
        foundWords: string[];
        revealedCells?: string[];
        score: number;
        completed: boolean;
    };
    error?: string;
}

// ============================================================================
// Grid Utility Functions
// ============================================================================

/**
 * Creates a grid representation from an array of placed words
 * Each cell knows which letters occupy it and which words pass through
 */
export function createGridFromWords(words: PlacedWord[]): {
    grid: Map<string, Cell>;
    gridSize: { rows: number; cols: number };
} {
    const grid = new Map<string, Cell>();
    let maxRow = 0;
    let maxCol = 0;

    words.forEach((word) => {
        let r = word.row;
        let c = word.col;
        const isHoriz = word.direction === 'H';

        for (let i = 0; i < word.word.length; i++) {
            const key = `${r},${c}`;
            const existing = grid.get(key);

            if (existing) {
                // Cell already exists (intersection point)
                existing.wordIds.push(word.id);
            } else {
                // Create new cell
                grid.set(key, {
                    row: r,
                    col: c,
                    letter: word.word[i],
                    wordIds: [word.id],
                    isRevealed: false,
                    isHighlighted: false,
                });
            }

            maxRow = Math.max(maxRow, r);
            maxCol = Math.max(maxCol, c);

            if (isHoriz) c++;
            else r++;
        }
    });

    return {
        grid,
        gridSize: { rows: maxRow + 1, cols: maxCol + 1 },
    };
}

/**
 * Reveals all cells belonging to a word (when word is found)
 * Returns a new grid with updated cell states
 */
export function revealWord(
    grid: Map<string, Cell>,
    word: PlacedWord
): Map<string, Cell> {
    const newGrid = new Map(grid);
    let r = word.row;
    let c = word.col;
    const isHoriz = word.direction === 'H';

    for (let i = 0; i < word.word.length; i++) {
        const key = `${r},${c}`;
        const cell = newGrid.get(key);
        if (cell) {
            newGrid.set(key, { ...cell, isRevealed: true });
        }
        if (isHoriz) c++;
        else r++;
    }

    return newGrid;
}

/**
 * Highlights cells for visual feedback (e.g., when hovering over a word)
 */
export function highlightCells(
    grid: Map<string, Cell>,
    cellKeys: string[],
    highlight: boolean
): Map<string, Cell> {
    const newGrid = new Map(grid);

    cellKeys.forEach(key => {
        const cell = newGrid.get(key);
        if (cell) {
            newGrid.set(key, { ...cell, isHighlighted: highlight });
        }
    });

    return newGrid;
}

/**
 * Converts API response words to PlacedWord objects
 */
export function apiWordsToPlacedWords(
    apiWords: PuzzleApiResponse['words'],
    foundWords: string[] = []
): PlacedWord[] {
    if (!apiWords) return [];

    return apiWords.map((w, idx) => ({
        id: `word-${idx}`,
        word: w.word,
        normalizedWord: latinize(w.word),
        lang: w.lang || 'en',
        row: w.row,
        col: w.col,
        direction: w.direction,
        points: w.points,
        isFound: foundWords.includes(latinize(w.word)),
    }));
}

/**
 * Converts text to latinized uppercase (removes diacritics)
 */
export function latinize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase();
}

/**
 * Gets the cells that would be affected by a word placement
 */
export function getWordCellKeys(word: PlacedWord): string[] {
    const keys: string[] = [];
    let r = word.row;
    let c = word.col;
    const isHoriz = word.direction === 'H';

    for (let i = 0; i < word.word.length; i++) {
        keys.push(`${r},${c}`);
        if (isHoriz) c++;
        else r++;
    }

    return keys;
}

/**
 * Checks if all words in the puzzle have been found
 */
export function isPuzzleComplete(words: PlacedWord[]): boolean {
    return words.every(w => w.isFound);
}

/**
 * Calculates the total possible score for a puzzle
 */
export function getTotalPossibleScore(words: PlacedWord[]): number {
    return words.reduce((sum, w) => sum + w.points, 0);
}
/**
 * Reveals a specific cell in the grid
 */
export function revealCell(grid: Map<string, Cell>, row: number, col: number): Map<string, Cell> {
    const key = `${row},${col}`;
    const cell = grid.get(key);

    if (!cell) return grid;

    const newGrid = new Map(grid);
    newGrid.set(key, { ...cell, isRevealed: true });
    return newGrid;
}

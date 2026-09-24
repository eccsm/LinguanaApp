/**
 * PuzzleGrid Component
 * Responsive crossword-style grid that adapts to screen size and word placement
 */

import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import GridCell from './GridCell';
import { Cell } from '../../models/PuzzleModel';


// ============================================================================
// Constants
// ============================================================================

const MIN_CELL_SIZE = 24; // Increased from 20
const MAX_CELL_SIZE = 34; // Increased from 30
const DEFAULT_CELL_SIZE = 28; // Increased from 24
const CELL_MARGIN = 2;
const GRID_PADDING = 8;

// Tablet-specific sizing
const TABLET_MIN_WIDTH = 600; // dp - screens 600+ are considered tablets
const TABLET_MIN_CELL_SIZE = 36; // Increased from 32
const TABLET_MAX_CELL_SIZE = 52; // Increased from 48

// ============================================================================
// Types
// ============================================================================

interface PuzzleGridProps {
    /** Grid data as a Map with "row,col" keys */
    grid: Map<string, Cell>;
    /** Grid dimensions in rows and columns */
    gridSize: { rows: number; cols: number };
    /** Set of cell keys that should be highlighted */
    highlightedCells?: Set<string>;
    /** Maximum height for the grid container (as fraction of screen height) */
    maxHeightFraction?: number;
}

// ============================================================================
// Component
// ============================================================================

export default function PuzzleGrid({
    grid,
    gridSize,
    highlightedCells,
    maxHeightFraction = 0.38,
}: PuzzleGridProps) {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Detect tablet based on screen width
    const isTablet = screenWidth >= TABLET_MIN_WIDTH;

    // Use tablet-specific sizing
    const minCellSize = isTablet ? TABLET_MIN_CELL_SIZE : MIN_CELL_SIZE;
    const maxCellSize = isTablet ? TABLET_MAX_CELL_SIZE : MAX_CELL_SIZE;

    // Calculate optimal cell size based on available space
    const { cellSize, needsHorizontalScroll, needsVerticalScroll } = useMemo(() => {
        const availableWidth = screenWidth - GRID_PADDING * 2 - 20; // 20 for container margins
        const availableHeight = screenHeight * maxHeightFraction - GRID_PADDING * 2;

        // Calculate maximum cell size that would fit
        const cellFromWidth = (availableWidth / gridSize.cols) - CELL_MARGIN * 2;
        const cellFromHeight = (availableHeight / gridSize.rows) - CELL_MARGIN * 2;

        // Use the smaller dimension to ensure grid fits, but clamp to min/max
        const optimalSize = Math.min(cellFromWidth, cellFromHeight);
        const clampedSize = Math.max(minCellSize, Math.min(maxCellSize, optimalSize));

        // Determine if scrolling is needed
        const gridWidth = gridSize.cols * (clampedSize + CELL_MARGIN * 2);
        const gridHeight = gridSize.rows * (clampedSize + CELL_MARGIN * 2);

        return {
            cellSize: clampedSize,
            needsHorizontalScroll: gridWidth > availableWidth,
            needsVerticalScroll: gridHeight > availableHeight,
        };
    }, [screenWidth, screenHeight, gridSize, maxHeightFraction, minCellSize, maxCellSize]);

    // Render the grid rows and cells
    const renderGrid = () => (
        <View style={styles.gridBoard}>
            {Array.from({ length: gridSize.rows }).map((_, row) => (
                <View key={`row-${row}`} style={styles.gridRow}>
                    {Array.from({ length: gridSize.cols }).map((_, col) => {
                        const key = `${row},${col}`;
                        const cell = grid.get(key);
                        const isHighlighted = highlightedCells?.has(key) || false;

                        return (
                            <GridCell
                                key={key}
                                cell={cell}
                                size={cellSize}
                                margin={CELL_MARGIN}
                                isHighlighted={isHighlighted}
                            />
                        );
                    })}
                </View>
            ))}
        </View>
    );

    // If scrolling is needed, wrap in ScrollViews
    if (needsHorizontalScroll || needsVerticalScroll) {
        return (
            <View style={[styles.container, { maxHeight: screenHeight * maxHeightFraction }]}>
                <ScrollView
                    horizontal={needsHorizontalScroll}
                    showsHorizontalScrollIndicator={needsHorizontalScroll}
                    contentContainerStyle={styles.scrollContent}
                    bounces={false}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={needsVerticalScroll}
                        contentContainerStyle={styles.scrollContent}
                        nestedScrollEnabled
                        bounces={false}
                    >
                        {renderGrid()}
                    </ScrollView>
                </ScrollView>
            </View>
        );
    }

    // No scrolling needed - render directly
    return (
        <View style={[styles.container, { maxHeight: screenHeight * maxHeightFraction }]}>
            <View style={styles.centeredContainer}>
                {renderGrid()}
            </View>
        </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Transparent container - grid floats over background
        borderRadius: 16,
        marginHorizontal: 10,
        marginVertical: 4,
        overflow: 'hidden',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: GRID_PADDING,
    },
    gridBoard: {
        // Grid is built from rows
    },
    gridRow: {
        flexDirection: 'row',
    },
});

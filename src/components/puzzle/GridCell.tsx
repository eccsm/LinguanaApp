/**
 * GridCell Component
 * Individual cell in the puzzle grid with different states (empty, hidden, revealed, highlighted)
 * Animated highlight effect for duplicate word feedback
 */

import React, { memo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Cell } from '../../models/PuzzleModel';

// ============================================================================
// Types
// ============================================================================

interface GridCellProps {
    /** Cell data (undefined for empty cells where no word passes through) */
    cell: Cell | undefined;
    /** Size of the cell in pixels */
    size: number;
    /** Margin around the cell */
    margin: number;
    /** Whether the cell is highlighted (e.g., during word hover) */
    isHighlighted?: boolean;
}

// ============================================================================
// Component
// ============================================================================

function GridCellComponent({
    cell,
    size,
    margin,
    isHighlighted = false,
}: GridCellProps) {
    // Pulse animation for highlighted cells (duplicate word feedback)
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isHighlighted) {
            // Start pulse animation when highlighted
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 150,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 150,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                { iterations: 2 } // Pulse twice
            ).start();
        } else {
            // Reset scale when not highlighted
            pulseAnim.setValue(1);
        }
    }, [isHighlighted, pulseAnim]);

    // Empty cell (no word passes through this position)
    if (!cell) {
        return (
            <View
                style={[
                    styles.cell,
                    styles.emptyCell,
                    { width: size, height: size, margin },
                ]}
            />
        );
    }

    const isRevealed = cell.isRevealed;
    // Scale font size with cell size, with min/max bounds
    const fontSize = Math.max(12, Math.min(size * 0.6, 24));

    return (
        <Animated.View
            style={[
                styles.cell,
                isRevealed ? styles.revealedCell : styles.hiddenCell,
                isHighlighted && styles.highlightedCell,
                {
                    width: size,
                    height: size,
                    margin,
                    borderRadius: size * 0.15,
                    transform: [{ scale: pulseAnim }],
                },
            ]}
        >
            {isRevealed && (
                <Text
                    style={[
                        styles.letter,
                        { fontSize },
                        isHighlighted && styles.highlightedLetter,
                    ]}
                    allowFontScaling={false}
                >
                    {cell.letter}
                </Text>
            )}
        </Animated.View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCell: {
        backgroundColor: 'transparent',
    },
    hiddenCell: {
        // White cells for unfound words
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.6)',
    },
    revealedCell: {
        // Vibrant green for found words (like Wordscapes)
        backgroundColor: '#4CAF50',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#45a049',
    },
    highlightedCell: {
        backgroundColor: '#FFD700',
        borderColor: '#FFB300',
        borderWidth: 2,
    },
    letter: {
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    highlightedLetter: {
        color: '#1a3a5c',
        textShadowColor: 'transparent',
    },
});

// Memoize to prevent unnecessary re-renders
const GridCell = memo(GridCellComponent);
export default GridCell;

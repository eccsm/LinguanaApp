/**
 * GameHeader Component
 * Header bar with back button, title, and leaderboard button
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// ============================================================================
// Types
// ============================================================================

interface GameHeaderProps {
    /** Title to display */
    title?: string;
    /** Callback when back button is pressed */
    onBack: () => void;
    /** Callback when leaderboard button is pressed */
    onLeaderboard: () => void;
    /** Compact mode for small screens */
    compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function GameHeader({
    title = 'Weekly Puzzle',
    onBack,
    onLeaderboard,
    compact = false,
}: GameHeaderProps) {
    return (
        <View style={[styles.header, compact && styles.headerCompact]}>
            <TouchableOpacity
                onPress={onBack}
                style={[styles.iconButton, compact && styles.iconButtonCompact]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Icon name="arrow-back" size={compact ? 22 : 28} color="#fff" />
            </TouchableOpacity>

            <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>
                {title}
            </Text>

            <TouchableOpacity
                onPress={onLeaderboard}
                style={[styles.iconButton, compact && styles.iconButtonCompact]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Icon name="trophy" size={compact ? 20 : 24} color="#FFD700" />
            </TouchableOpacity>
        </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
    },
    headerCompact: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 2 : 6,
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    iconButtonCompact: {
        padding: 6,
        borderRadius: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    titleCompact: {
        fontSize: 16,
        marginHorizontal: 8,
    },
});

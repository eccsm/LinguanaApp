/**
 * CompleteModal Component
 * Victory modal shown when puzzle is completed
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// ============================================================================
// Types
// ============================================================================

interface CompleteModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Final score */
    score: number;
    /** Number of words found */
    wordsFound: number;
    /** Total words in puzzle */
    totalWords: number;
    /** Callback when done button is pressed */
    onClose: () => void;
    /** Callback when leaderboard button is pressed */
    onViewLeaderboard?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function CompleteModal({
    visible,
    score,
    wordsFound,
    totalWords,
    onClose,
    onViewLeaderboard,
}: CompleteModalProps) {
    const isPerfect = wordsFound === totalWords;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    {/* Trophy Icon */}
                    <View style={styles.iconContainer}>
                        <Icon
                            name={isPerfect ? 'trophy' : 'ribbon'}
                            size={60}
                            color="#FFD700"
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>
                        {isPerfect ? 'Perfect!' : 'Puzzle Complete!'}
                    </Text>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statRow}>
                            <Icon name="star" size={24} color="#FFD700" />
                            <Text style={styles.statLabel}>Score</Text>
                            <Text style={styles.statValue}>{score}</Text>
                        </View>

                        <View style={styles.statRow}>
                            <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                            <Text style={styles.statLabel}>Words</Text>
                            <Text style={styles.statValue}>
                                {wordsFound}/{totalWords}
                            </Text>
                        </View>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {onViewLeaderboard && (
                            <TouchableOpacity
                                onPress={onViewLeaderboard}
                                style={styles.leaderboardButton}
                            >
                                <Icon name="podium" size={20} color="#4A90D9" />
                                <Text style={styles.leaderboardButtonText}>Leaderboard</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={onClose} style={styles.doneButton}>
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
        textAlign: 'center',
    },
    statsContainer: {
        width: '100%',
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 12,
    },
    statLabel: {
        flex: 1,
        fontSize: 16,
        color: '#666',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    leaderboardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f7ff',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
        gap: 8,
        borderWidth: 1,
        borderColor: '#4A90D9',
    },
    leaderboardButtonText: {
        color: '#4A90D9',
        fontSize: 16,
        fontWeight: '600',
    },
    doneButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    doneButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

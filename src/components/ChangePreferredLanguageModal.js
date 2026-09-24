import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useApp } from '../contexts/AppContext';
import { useGamification } from '../features/GamificationFeatures';
import { useTheme } from '../contexts/ThemeContext';
import Logger from '../utils/logger';
import Haptics from '../utils/haptics';
import { LANGUAGES } from '../constants/scenarios';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const COST_GEMS = 10;

/**
 * Modal for changing which language the user wants to LEARN
 * Excludes user's native language and current preferred language
 */
const ChangePreferredLanguageModal = ({ visible, onClose }) => {
    const { userProfile, updateProfile } = useApp();
    const { stats } = useGamification();
    const { colors, isDarkMode } = useTheme();
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [loading, setLoading] = useState(false);

    const availableLanguages = LANGUAGES ? Object.values(LANGUAGES) : [];

    // Filter out native language and current preferred language
    const filteredLanguages = availableLanguages.filter(
        lang => lang.code !== userProfile?.nativeLanguage &&
            lang.code !== userProfile?.preferredLanguage
    );

    const canAfford = (stats?.gems || 0) >= COST_GEMS;

    const handleConfirm = async () => {
        if (!selectedLanguage) {
            Alert.alert('Selection Required', 'Please select a language.');
            return;
        }

        if (!canAfford) {
            Alert.alert('Not Enough Gems', `You need ${COST_GEMS} gems but only have ${stats?.gems || 0}.`);
            return;
        }

        setLoading(true);
        Haptics.light();

        try {
            const user = auth().currentUser;
            if (!user) throw new Error('Not logged in');

            // Deduct gems and update preferred language in one transaction
            const userRef = firestore().collection('users').doc(user.uid);

            await firestore().runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw new Error('User not found');

                const userData = userDoc.data();
                if ((userData.gems || 0) < COST_GEMS) {
                    throw new Error('Not enough gems');
                }

                transaction.update(userRef, {
                    gems: firestore.FieldValue.increment(-COST_GEMS),
                    preferredLanguage: selectedLanguage.code,
                });
            });

            Logger.info('[SHOP] Preferred language changed', {
                newLanguage: selectedLanguage.code,
                cost: COST_GEMS
            });

            Haptics.success();
            Alert.alert(
                'Success! 🎉',
                `Your learning language is now ${selectedLanguage.name}!`,
                [{ text: 'OK', onPress: onClose }]
            );
        } catch (error) {
            Haptics.error();
            Logger.error('Failed to change preferred language:', error);
            Alert.alert('Error', error.message || 'Failed to change language.');
        } finally {
            setLoading(false);
        }
    };

    const currentPreferred = availableLanguages.find(l => l.code === userProfile?.preferredLanguage);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Icon name="book-open-variant" size={40} color="#10B981" />
                        <Text style={[styles.title, { color: colors.text }]}>
                            Change Learning Language
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Currently learning: {currentPreferred?.name || 'Not set'}
                        </Text>
                    </View>

                    {/* Cost Banner */}
                    <View style={[styles.costBanner, !canAfford && styles.costBannerDisabled]}>
                        <Icon name="diamond-stone" size={18} color={canAfford ? "#06b6d4" : "#9CA3AF"} />
                        <Text style={[styles.costText, !canAfford && { color: '#9CA3AF' }]}>
                            {COST_GEMS} Gems
                        </Text>
                    </View>

                    {/* Language List */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {filteredLanguages.length === 0 ? (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No other languages available to learn.
                            </Text>
                        ) : (
                            filteredLanguages.map((language) => (
                                <TouchableOpacity
                                    key={language.code}
                                    style={[
                                        styles.languageButton,
                                        { backgroundColor: isDarkMode ? colors.surfaceElevated : '#F9FAFB' },
                                        selectedLanguage?.code === language.code && styles.languageButtonSelected,
                                    ]}
                                    onPress={() => {
                                        Haptics.selection();
                                        setSelectedLanguage(language);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.flag}>{language.flag}</Text>
                                    <Text style={[
                                        styles.languageName,
                                        { color: colors.text },
                                        selectedLanguage?.code === language.code && styles.languageNameSelected,
                                    ]}>
                                        {language.name}
                                    </Text>
                                    {selectedLanguage?.code === language.code && (
                                        <Icon name="check-circle" size={24} color="#10B981" />
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: colors.border }]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (!selectedLanguage || !canAfford || loading) && styles.confirmButtonDisabled
                            ]}
                            onPress={handleConfirm}
                            disabled={!selectedLanguage || !canAfford || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Icon name="check" size={20} color="#FFF" />
                                    <Text style={styles.confirmText}>Confirm</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginTop: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },
    costBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 16,
        gap: 6,
    },
    costBannerDisabled: {
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
    },
    costText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#06b6d4',
    },
    balanceText: {
        fontSize: 13,
    },
    scrollView: {
        maxHeight: 300,
    },
    scrollContent: {
        paddingBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 20,
    },
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    languageButtonSelected: {
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    flag: {
        fontSize: 28,
        marginRight: 14,
    },
    languageName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    languageNameSelected: {
        color: '#10B981',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#10B981',
        gap: 6,
    },
    confirmButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default ChangePreferredLanguageModal;

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
import { useApp } from '../contexts/AppContext';
import Logger from '../utils/logger';
import { LANGUAGES } from '../constants/scenarios';

/**
 * Modal for selecting which language the user wants to LEARN
 * Shows after native language is set
 * Excludes user's native language from the list
 */
const PreferredLanguageModal = ({ visible, onClose, nativeLanguage }) => {
    const { updateProfile } = useApp();
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [loading, setLoading] = useState(false);

    // Get languages from scenarios (these are languages users can learn)
    const availableLanguages = LANGUAGES ? Object.values(LANGUAGES) : [];

    // Filter out user's native language
    const filteredLanguages = availableLanguages.filter(
        lang => lang.code !== nativeLanguage
    );

    const handleLanguageSelect = (language) => {
        setSelectedLanguage(language);
    };

    const handleContinue = async () => {
        if (!selectedLanguage) {
            Alert.alert('Selection Required', 'Please select a language to continue.');
            return;
        }

        setLoading(true);
        Logger.breadcrumb('Preferred language selected', { language: selectedLanguage.code });

        try {
            await updateProfile({ preferredLanguage: selectedLanguage.code });
            onClose();
        } catch (error) {
            Logger.error('Error setting preferred language', error);
            Alert.alert('Error', 'Failed to save your language preference. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => { }}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>What do you want to learn?</Text>
                        <Text style={styles.subtitle}>
                            Choose the language you want to practice - this will be shown first on your home screen
                        </Text>
                    </View>

                    {/* Language List */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                    >
                        {filteredLanguages.map((language) => (
                            <TouchableOpacity
                                key={language.code}
                                style={[
                                    styles.languageButton,
                                    selectedLanguage?.code === language.code && styles.languageButtonSelected,
                                ]}
                                onPress={() => handleLanguageSelect(language)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.languageContent}>
                                    <Text style={styles.flag}>{language.flag}</Text>
                                    <Text style={[
                                        styles.languageName,
                                        selectedLanguage?.code === language.code && styles.languageNameSelected,
                                    ]}>
                                        {language.name}
                                    </Text>
                                </View>
                                {selectedLanguage?.code === language.code && (
                                    <View style={styles.checkmark}>
                                        <Text style={styles.checkmarkIcon}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !selectedLanguage && styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinue}
                        disabled={loading || !selectedLanguage}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.continueButtonText}>Start Learning</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        width: '90%',
        maxWidth: 480,
        height: '70%',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
        flexShrink: 0,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 20,
    },
    scrollView: {
        flex: 1,
        width: '100%',
        marginBottom: 20,
    },
    scrollContent: {
        paddingBottom: 8,
        flexGrow: 1,
    },
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        minHeight: 60,
    },
    languageButtonSelected: {
        backgroundColor: '#e8f5e9',
        borderColor: '#4CAF50',
    },
    languageContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    flag: {
        fontSize: 28,
        marginRight: 14,
    },
    languageName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    languageNameSelected: {
        color: '#2E7D32',
    },
    checkmark: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    checkmarkIcon: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    continueButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
        flexShrink: 0,
    },
    continueButtonDisabled: {
        backgroundColor: '#cccccc',
        shadowOpacity: 0,
    },
    continueButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default PreferredLanguageModal;

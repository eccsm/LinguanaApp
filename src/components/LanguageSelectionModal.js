import React, { useState, useEffect } from 'react';
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
import { AVAILABLE_LANGUAGES } from '../constants/languages';

const LanguageSelectionModal = ({ visible, onClose }) => {
    const { updateProfile } = useApp();
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLanguageSelect = (language) => {
        setSelectedLanguage(language);
    };

    const handleContinue = async () => {
        if (!selectedLanguage) {
            Alert.alert('Selection Required', 'Please select a language to continue.');
            return;
        }

        setLoading(true);
        Logger.breadcrumb('Native language selected', { language: selectedLanguage.code });

        try {
            await updateProfile({ nativeLanguage: selectedLanguage.code });
            onClose();
        } catch (error) {
            Logger.error('Error setting native language preference', error);
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
                        <Text style={styles.title}>Select Your Native Language</Text>
                        <Text style={styles.subtitle}>
                            Choose your mother tongue - vocabulary meanings will be shown in this language
                        </Text>
                    </View>

                    {/* Language List */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                    >
                        {AVAILABLE_LANGUAGES.map((language, index) => (
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
                                    <View style={styles.languageText}>
                                        <Text style={[
                                            styles.languageName,
                                            selectedLanguage?.code === language.code && styles.languageNameSelected,
                                        ]}>
                                            {language.name}
                                        </Text>
                                        <Text style={[
                                            styles.languageNativeName,
                                            selectedLanguage?.code === language.code && styles.languageNativeNameSelected,
                                        ]}>
                                            {language.nativeName}
                                        </Text>
                                    </View>
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
                            <Text style={styles.continueButtonText}>Continue</Text>
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
        width: '90%', // Changed from 100% to 90% for better mobile look
        maxWidth: 480,
        height: '80%', // Fixed height to ensure ScrollView has space
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
        flexShrink: 0, // Don't shrink header
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
    },
    scrollView: {
        flex: 1, // Now this works because parent has fixed height
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
        minHeight: 70, // Ensure buttons are large enough
    },
    languageButtonSelected: {
        backgroundColor: '#f0e7ff',
        borderColor: '#8a46ff',
    },
    languageContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    flag: {
        fontSize: 32,
        marginRight: 16,
    },
    languageText: {
        flex: 1,
    },
    languageName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    languageNameSelected: {
        color: '#6a28d9',
    },
    languageNativeName: {
        fontSize: 14,
        color: '#666666',
    },
    languageNativeNameSelected: {
        color: '#8a46ff',
    },
    checkmark: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#8a46ff',
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
        backgroundColor: '#8a46ff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#8a46ff',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
        flexShrink: 0, // Don't shrink button
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

export default LanguageSelectionModal;

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Modal,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '../contexts/AlertContext';
import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';
import Haptics from '../utils/haptics';
import Logger from '../utils/logger';
import { version } from '../../package.json';

const FEEDBACK_TYPES = [
    { id: 'bug', label: 'Bug Report', icon: 'bug-outline', color: '#EF4444' },
    { id: 'feature', label: 'Feature Request', icon: 'lightbulb-outline', color: '#F59E0B' },
    { id: 'general', label: 'General Feedback', icon: 'message-text-outline', color: '#3B82F6' },
    { id: 'praise', label: 'Say Thanks!', icon: 'heart-outline', color: '#EC4899' },
];

const FeedbackModal = ({ visible, onClose }) => {
    const { colors } = useTheme();
    const { user } = useApp();
    const { showAlert } = useAlert();

    const [feedbackType, setFeedbackType] = useState('general');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim()) {
            showAlert('Missing Message', 'Please describe your feedback before submitting.');
            return;
        }

        if (message.trim().length < 10) {
            showAlert('Too Short', 'Please provide more details in your feedback.');
            return;
        }

        setLoading(true);
        Haptics.medium();

        try {
            const response = await fetch(`${BACKEND_URL}/api/feedback/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-secret': APP_CLIENT_SECRET,
                },
                body: JSON.stringify({
                    userId: user?.uid || 'anonymous',
                    type: feedbackType,
                    message: message.trim(),
                    rating: rating > 0 ? rating : null,
                    metadata: {
                        platform: Platform.OS,
                        appVersion: version,
                    },
                }),
            });

            const data = await response.json();

            if (data.success) {
                Haptics.success();
                showAlert('Thank You! 🙏', 'Your feedback has been sent to our team.');
                setMessage('');
                setRating(0);
                setFeedbackType('general');
                onClose();
            } else {
                throw new Error(data.error || 'Failed to submit feedback');
            }
        } catch (error) {
            Logger.error('[FEEDBACK] Submit error:', error);
            showAlert('Error', 'Failed to send feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const selectedType = FEEDBACK_TYPES.find(t => t.id === feedbackType);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[styles.container, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Send Feedback</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Feedback Type Selector */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>What's this about?</Text>
                        <View style={styles.typeGrid}>
                            {FEEDBACK_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.typeCard,
                                        { backgroundColor: colors.background },
                                        feedbackType === type.id && { borderColor: type.color, borderWidth: 2 }
                                    ]}
                                    onPress={() => {
                                        Haptics.light();
                                        setFeedbackType(type.id);
                                    }}
                                >
                                    <Icon name={type.icon} size={24} color={type.color} />
                                    <Text style={[styles.typeLabel, { color: colors.text }]}>{type.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Rating (optional) */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>How's your experience? (optional)</Text>
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => {
                                        Haptics.light();
                                        setRating(star === rating ? 0 : star);
                                    }}
                                >
                                    <Icon
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={36}
                                        color={star <= rating ? '#F59E0B' : colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Message Input */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Your message</Text>
                        <TextInput
                            style={[
                                styles.messageInput,
                                {
                                    backgroundColor: colors.background,
                                    color: colors.text,
                                    borderColor: selectedType?.color || colors.primary
                                }
                            ]}
                            placeholder="Describe your feedback, bug, or idea..."
                            placeholderTextColor={colors.textSecondary}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            maxLength={1000}
                            textAlignVertical="top"
                        />
                        <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                            {message.length}/1000
                        </Text>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                { backgroundColor: selectedType?.color || '#8a46ff' },
                                loading && { opacity: 0.6 }
                            ]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Icon name="send" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.submitText}>Send Feedback</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
    },
    closeButton: {
        padding: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 16,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    typeCard: {
        flex: 1,
        minWidth: '45%',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    messageInput: {
        borderWidth: 2,
        borderRadius: 12,
        padding: 14,
        minHeight: 120,
        fontSize: 16,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        marginTop: 4,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 14,
        marginTop: 20,
        marginBottom: 20,
    },
    submitText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default FeedbackModal;

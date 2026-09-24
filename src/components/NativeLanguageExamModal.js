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
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useApp } from '../contexts/AppContext';
import { useGamification } from '../features/GamificationFeatures';
import { useTheme } from '../contexts/ThemeContext';
import Logger from '../utils/logger';
import Haptics from '../utils/haptics';
import { AVAILABLE_LANGUAGES } from '../constants/languages';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const COST_GEMS = 25;
const PASS_THRESHOLD = 80; // 80% required to pass
const TOTAL_QUESTIONS = 10;

// Sample exam questions per language - in production these could come from backend
const EXAM_QUESTIONS = {
    tr: [
        { question: 'How do you say "Hello" in Turkish?', options: ['Merhaba', 'Bonjour', 'Hola', 'Ciao'], correct: 0 },
        { question: 'What does "Teşekkür ederim" mean?', options: ['Goodbye', 'Thank you', 'Please', 'Sorry'], correct: 1 },
        { question: 'How do you say "Water" in Turkish?', options: ['Süt', 'Çay', 'Su', 'Kahve'], correct: 2 },
        { question: 'What does "Günaydın" mean?', options: ['Good night', 'Good morning', 'Goodbye', 'Hello'], correct: 1 },
        { question: 'How do you say "Yes" in Turkish?', options: ['Hayır', 'Belki', 'Evet', 'Tamam'], correct: 2 },
        { question: 'What does "Nasılsın?" mean?', options: ['Where are you?', 'Who are you?', 'How are you?', 'What is this?'], correct: 2 },
        { question: 'How do you say "I love you" in Turkish?', options: ['Seni seviyorum', 'Hoşça kal', 'Özür dilerim', 'Afiyet olsun'], correct: 0 },
        { question: 'What does "Bir" mean?', options: ['Two', 'Three', 'One', 'Zero'], correct: 2 },
        { question: 'How do you say "Friend" in Turkish?', options: ['Aile', 'Arkadaş', 'Anne', 'Baba'], correct: 1 },
        { question: 'What does "İyi akşamlar" mean?', options: ['Good morning', 'Good afternoon', 'Good evening', 'Goodbye'], correct: 2 },
    ],
    en: [
        { question: 'What does "Ephemeral" mean?', options: ['Permanent', 'Short-lived', 'Large', 'Colorful'], correct: 1 },
        { question: 'Which word is a synonym for "Happy"?', options: ['Sad', 'Angry', 'Joyful', 'Tired'], correct: 2 },
        { question: 'What is the past tense of "Go"?', options: ['Goed', 'Gone', 'Went', 'Going'], correct: 2 },
        { question: 'What does "Ubiquitous" mean?', options: ['Rare', 'Present everywhere', 'Ancient', 'Beautiful'], correct: 1 },
        { question: 'Which is correct?', options: ['Their going home', 'They\'re going home', 'There going home', 'Theyre going home'], correct: 1 },
        { question: 'What is a "Metaphor"?', options: ['A type of poem', 'A figure of speech', 'A grammar rule', 'A punctuation mark'], correct: 1 },
        { question: 'What does "Ambiguous" mean?', options: ['Clear', 'Open to interpretation', 'Large', 'Fast'], correct: 1 },
        { question: 'Which sentence is correct?', options: ['Me and him went', 'Him and I went', 'He and I went', 'I and he went'], correct: 2 },
        { question: 'What is the plural of "Child"?', options: ['Childs', 'Children', 'Childes', 'Childern'], correct: 1 },
        { question: 'What does "Serendipity" mean?', options: ['Bad luck', 'Happy accident', 'Repetition', 'Confusion'], correct: 1 },
    ],
    de: [
        { question: 'How do you say "Hello" in German?', options: ['Hallo', 'Bonjour', 'Hola', 'Ciao'], correct: 0 },
        { question: 'What does "Danke" mean?', options: ['Please', 'Thank you', 'Sorry', 'Hello'], correct: 1 },
        { question: 'What is "Schmetterling" in English?', options: ['Bird', 'Butterfly', 'Flower', 'Tree'], correct: 1 },
        { question: 'How do you say "Good morning" in German?', options: ['Guten Tag', 'Guten Morgen', 'Guten Abend', 'Gute Nacht'], correct: 1 },
        { question: 'What does "Ja" mean?', options: ['No', 'Maybe', 'Yes', 'Please'], correct: 2 },
        { question: 'What is "Eins" in English?', options: ['Two', 'Three', 'One', 'Zero'], correct: 2 },
        { question: 'How do you say "Goodbye" in German?', options: ['Hallo', 'Danke', 'Bitte', 'Auf Wiedersehen'], correct: 3 },
        { question: 'What does "Wasser" mean?', options: ['Water', 'Fire', 'Air', 'Earth'], correct: 0 },
        { question: 'What gender is "Mädchen" (girl)?', options: ['Masculine', 'Feminine', 'Neuter', 'Plural'], correct: 2 },
        { question: 'How do you say "I love you" in German?', options: ['Ich liebe dich', 'Guten Tag', 'Danke schön', 'Auf Wiedersehen'], correct: 0 },
    ],
    es: [
        { question: 'How do you say "Hello" in Spanish?', options: ['Hallo', 'Bonjour', 'Hola', 'Ciao'], correct: 2 },
        { question: 'What does "Gracias" mean?', options: ['Please', 'Thank you', 'Sorry', 'Hello'], correct: 1 },
        { question: 'How do you say "Water" in Spanish?', options: ['Agua', 'Fuego', 'Aire', 'Tierra'], correct: 0 },
        { question: 'What does "Buenos días" mean?', options: ['Good night', 'Good morning', 'Goodbye', 'Hello'], correct: 1 },
        { question: 'How do you say "Yes" in Spanish?', options: ['No', 'Tal vez', 'Sí', 'Por favor'], correct: 2 },
        { question: 'What is "Uno" in English?', options: ['Two', 'Three', 'One', 'Zero'], correct: 2 },
        { question: 'How do you say "Please" in Spanish?', options: ['Gracias', 'Por favor', 'De nada', 'Lo siento'], correct: 1 },
        { question: 'What does "Adiós" mean?', options: ['Hello', 'Thank you', 'Goodbye', 'Please'], correct: 2 },
        { question: 'What is "Amigo" in English?', options: ['Enemy', 'Friend', 'Family', 'Stranger'], correct: 1 },
        { question: 'How do you say "I love you" in Spanish?', options: ['Te quiero', 'Buenos días', 'Gracias', 'Adiós'], correct: 0 },
    ],
    fr: [
        { question: 'How do you say "Hello" in French?', options: ['Hallo', 'Bonjour', 'Hola', 'Ciao'], correct: 1 },
        { question: 'What does "Merci" mean?', options: ['Please', 'Thank you', 'Sorry', 'Hello'], correct: 1 },
        { question: 'How do you say "Water" in French?', options: ['Eau', 'Feu', 'Air', 'Terre'], correct: 0 },
        { question: 'What does "Bonsoir" mean?', options: ['Good night', 'Good evening', 'Goodbye', 'Hello'], correct: 1 },
        { question: 'How do you say "Yes" in French?', options: ['Non', 'Peut-être', 'Oui', 'S\'il vous plaît'], correct: 2 },
        { question: 'What is "Un" in English?', options: ['Two', 'Three', 'One', 'Zero'], correct: 2 },
        { question: 'How do you say "Please" in French?', options: ['Merci', 'S\'il vous plaît', 'De rien', 'Pardon'], correct: 1 },
        { question: 'What does "Au revoir" mean?', options: ['Hello', 'Thank you', 'Goodbye', 'Please'], correct: 2 },
        { question: 'What is "Ami" in English?', options: ['Enemy', 'Friend', 'Family', 'Love'], correct: 1 },
        { question: 'How do you say "I love you" in French?', options: ['Je t\'aime', 'Bonjour', 'Merci', 'Au revoir'], correct: 0 },
    ],
};

// Default questions for languages without specific exam
const DEFAULT_QUESTIONS = [
    { question: 'Are you fluent in this language?', options: ['Yes, I am fluent', 'Somewhat', 'Not really', 'No'], correct: 0 },
    { question: 'Can you hold a conversation in this language?', options: ['Yes, easily', 'With some difficulty', 'Barely', 'No'], correct: 0 },
    { question: 'Did you grow up speaking this language?', options: ['Yes', 'Partially', 'No, I learned later', 'No'], correct: 0 },
    { question: 'Can you read newspapers in this language?', options: ['Yes', 'Mostly', 'With difficulty', 'No'], correct: 0 },
    { question: 'Can you write essays in this language?', options: ['Yes', 'Mostly', 'With difficulty', 'No'], correct: 0 },
    { question: 'Do you think in this language naturally?', options: ['Yes', 'Sometimes', 'Rarely', 'Never'], correct: 0 },
    { question: 'Can you understand movies without subtitles?', options: ['Yes', 'Mostly', 'Some parts', 'No'], correct: 0 },
    { question: 'Can you understand regional accents?', options: ['Yes', 'Most of them', 'Some', 'No'], correct: 0 },
    { question: 'Do you know idioms and proverbs?', options: ['Many', 'Some', 'A few', 'None'], correct: 0 },
    { question: 'Are you confident in formal situations?', options: ['Very confident', 'Somewhat', 'Not very', 'Not at all'], correct: 0 },
];

const NativeLanguageExamModal = ({ visible, onClose }) => {
    const { userProfile, updateProfile } = useApp();
    const { stats } = useGamification();
    const { colors, isDarkMode } = useTheme();

    const [step, setStep] = useState('select'); // 'select', 'exam', 'result'
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState(0);
    const [questions, setQuestions] = useState([]);

    // Filter out current native language
    const availableLanguages = AVAILABLE_LANGUAGES.filter(
        lang => lang.code !== userProfile?.nativeLanguage
    );

    const canAfford = (stats?.gems || 0) >= COST_GEMS;

    useEffect(() => {
        if (!visible) {
            // Reset state when modal closes
            setStep('select');
            setSelectedLanguage(null);
            setCurrentQuestion(0);
            setAnswers([]);
            setScore(0);
            setQuestions([]);
        }
    }, [visible]);

    const startExam = () => {
        if (!selectedLanguage) {
            Alert.alert('Selection Required', 'Please select a language first.');
            return;
        }
        if (!canAfford) {
            Alert.alert('Not Enough Gems', `You need ${COST_GEMS} gems but only have ${stats?.gems || 0}.`);
            return;
        }

        // Get questions for selected language
        const langQuestions = EXAM_QUESTIONS[selectedLanguage.code] || DEFAULT_QUESTIONS;
        setQuestions(langQuestions.slice(0, TOTAL_QUESTIONS));
        setStep('exam');
        Haptics.medium();
    };

    const handleAnswer = (answerIndex) => {
        Haptics.light();
        const newAnswers = [...answers, answerIndex];
        setAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // Calculate score
            let correct = 0;
            newAnswers.forEach((answer, idx) => {
                if (answer === questions[idx].correct) correct++;
            });
            const percentage = Math.round((correct / questions.length) * 100);
            setScore(percentage);
            setStep('result');

            if (percentage >= PASS_THRESHOLD) {
                Haptics.success();
            } else {
                Haptics.error();
            }
        }
    };

    const handleConfirmChange = async () => {
        setLoading(true);

        try {
            const user = auth().currentUser;
            if (!user) throw new Error('Not logged in');

            const userRef = firestore().collection('users').doc(user.uid);

            await firestore().runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw new Error('User not found');

                const userData = userDoc.data();
                if ((userData.gems || 0) < COST_GEMS) {
                    throw new Error('Not enough gems');
                }

                // Check if new native would equal preferred - if so, clear preferred
                const updates = {
                    gems: firestore.FieldValue.increment(-COST_GEMS),
                    nativeLanguage: selectedLanguage.code,
                };

                if (userData.preferredLanguage === selectedLanguage.code) {
                    updates.preferredLanguage = null; // Will trigger modal to select new preferred
                }

                transaction.update(userRef, updates);
            });

            Logger.info('[SHOP] Native language changed', {
                newLanguage: selectedLanguage.code,
                score: score,
                cost: COST_GEMS
            });

            Alert.alert(
                'Congratulations! 🎉',
                `You passed with ${score}%! Your native language is now ${selectedLanguage.name}.`,
                [{ text: 'OK', onPress: onClose }]
            );
        } catch (error) {
            Haptics.error();
            Logger.error('Failed to change native language:', error);
            Alert.alert('Error', error.message || 'Failed to change language.');
        } finally {
            setLoading(false);
        }
    };

    const passed = score >= PASS_THRESHOLD;

    const renderSelectStep = () => (
        <>
            <View style={styles.header}>
                <Icon name="translate" size={40} color="#8B5CF6" />
                <Text style={[styles.title, { color: colors.text }]}>
                    Change Native Language
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Prove your fluency with a {TOTAL_QUESTIONS}-question exam
                </Text>
            </View>

            <View style={[styles.costBanner, !canAfford && styles.costBannerDisabled]}>
                <Icon name="diamond-stone" size={18} color={canAfford ? "#06b6d4" : "#9CA3AF"} />
                <Text style={[styles.costText, !canAfford && { color: '#9CA3AF' }]}>
                    {COST_GEMS} Gems
                </Text>
            </View>

            <View style={styles.requirementBox}>
                <Icon name="check-circle" size={18} color="#10B981" />
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                    Score {PASS_THRESHOLD}% or higher to pass
                </Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {availableLanguages.map((language) => (
                    <TouchableOpacity
                        key={language.code}
                        style={[
                            styles.languageButton,
                            { backgroundColor: isDarkMode ? colors.surfaceElevated : '#F9FAFB' },
                            selectedLanguage?.code === language.code && styles.languageButtonSelectedPurple,
                        ]}
                        onPress={() => {
                            Haptics.selection();
                            setSelectedLanguage(language);
                        }}
                    >
                        <Text style={styles.flag}>{language.flag}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.languageName, { color: colors.text }]}>
                                {language.name}
                            </Text>
                            <Text style={[styles.nativeName, { color: colors.textSecondary }]}>
                                {language.nativeName}
                            </Text>
                        </View>
                        {selectedLanguage?.code === language.code && (
                            <Icon name="check-circle" size={24} color="#8B5CF6" />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colors.border }]}
                    onPress={onClose}
                >
                    <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        { backgroundColor: '#8B5CF6' },
                        (!selectedLanguage || !canAfford) && styles.confirmButtonDisabled
                    ]}
                    onPress={startExam}
                    disabled={!selectedLanguage || !canAfford}
                >
                    <Icon name="school" size={20} color="#FFF" />
                    <Text style={styles.confirmText}>Start Exam</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    const renderExamStep = () => (
        <>
            <View style={styles.examHeader}>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${((currentQuestion + 1) / questions.length) * 100}%` }
                            ]}
                        />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                        Question {currentQuestion + 1} of {questions.length}
                    </Text>
                </View>
            </View>

            <View style={styles.questionContainer}>
                <Text style={[styles.questionText, { color: colors.text }]}>
                    {questions[currentQuestion]?.question}
                </Text>
            </View>

            <View style={styles.optionsContainer}>
                {questions[currentQuestion]?.options.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.optionButton,
                            { backgroundColor: isDarkMode ? colors.surfaceElevated : '#F9FAFB' }
                        ]}
                        onPress={() => handleAnswer(index)}
                    >
                        <View style={styles.optionLetter}>
                            <Text style={styles.optionLetterText}>
                                {String.fromCharCode(65 + index)}
                            </Text>
                        </View>
                        <Text style={[styles.optionText, { color: colors.text }]}>
                            {option}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </>
    );

    const renderResultStep = () => (
        <>
            <View style={styles.resultHeader}>
                <View style={[
                    styles.resultIcon,
                    { backgroundColor: passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                ]}>
                    <Icon
                        name={passed ? "check-circle" : "close-circle"}
                        size={60}
                        color={passed ? "#10B981" : "#EF4444"}
                    />
                </View>
                <Text style={[styles.resultTitle, { color: colors.text }]}>
                    {passed ? 'Exam Passed! 🎉' : 'Not Quite There 😔'}
                </Text>
                <Text style={[styles.resultScore, { color: passed ? '#10B981' : '#EF4444' }]}>
                    {score}%
                </Text>
                <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
                    {passed
                        ? `Great job! You can now set ${selectedLanguage?.name} as your native language.`
                        : `You needed ${PASS_THRESHOLD}% to pass. Your gems were not charged.`
                    }
                </Text>
            </View>

            <View style={styles.buttonRow}>
                {passed ? (
                    <>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: colors.border }]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: '#10B981' }]}
                            onPress={handleConfirmChange}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Icon name="check" size={20} color="#FFF" />
                                    <Text style={styles.confirmText}>Confirm Change</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: colors.border, flex: 1 }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.cancelText, { color: colors.text }]}>Close</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: '#8B5CF6', flex: 1 }]}
                            onPress={() => {
                                setStep('select');
                                setCurrentQuestion(0);
                                setAnswers([]);
                                setScore(0);
                            }}
                        >
                            <Icon name="refresh" size={20} color="#FFF" />
                            <Text style={styles.confirmText}>Try Again</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                    {step === 'select' && renderSelectStep()}
                    {step === 'exam' && renderExamStep()}
                    {step === 'result' && renderResultStep()}
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
        maxHeight: '85%',
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
        marginBottom: 12,
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
    requirementBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 16,
    },
    requirementText: {
        fontSize: 13,
    },
    scrollView: {
        maxHeight: 250,
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
    languageButtonSelectedPurple: {
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    flag: {
        fontSize: 28,
        marginRight: 14,
    },
    languageName: {
        fontSize: 16,
        fontWeight: '600',
    },
    nativeName: {
        fontSize: 12,
        marginTop: 2,
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
    // Exam styles
    examHeader: {
        marginBottom: 24,
    },
    progressContainer: {
        alignItems: 'center',
    },
    progressBar: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#8B5CF6',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 13,
        marginTop: 8,
    },
    questionContainer: {
        marginBottom: 24,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 26,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    optionLetter: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    optionLetterText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    optionText: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    // Result styles
    resultHeader: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    resultIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    resultScore: {
        fontSize: 48,
        fontWeight: '800',
        marginBottom: 12,
    },
    resultSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});

export default NativeLanguageExamModal;

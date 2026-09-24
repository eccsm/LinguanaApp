import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Keyboard,
    BackHandler,
    ImageBackground,
    ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '../contexts/AlertContext';
import axios from 'axios';
import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';
import { useSpeechToText } from 'react-native-turbo-stt';
import voiceService from '../services/voiceService';
import interviewService from '../services/interviewService';
import analyticsService from '../services/analyticsService';
import Logger from '../utils/logger';
import { INTERVIEW_STRINGS, getLabel } from '../constants/interviewScenarios';

const BACKGROUND_IMAGES = {
    technical: require('../../assets/backgrounds/technical_background.png'),
    hr: require('../../assets/backgrounds/hr_background.png'),
    system_design: require('../../assets/backgrounds/system_design_backgound.png'),
    case_study: require('../../assets/backgrounds/case_study_background.png'),
};

const InterviewScreen = ({ route, navigation }) => {
    const { category, topic, difficulty, language, mode = 'text' } = route.params; // Default mode is text
    const { colors, isDarkMode, activeTheme } = useTheme();
    const { user, isPro, userProfile } = useApp();
    const { showAlert } = useAlert();
    // Use strings with fallback to English for unsupported languages
    const strings = INTERVIEW_STRINGS[language] || INTERVIEW_STRINGS['en'];

    const isCyberpunk = activeTheme === 'cyberpunk';

    // Helper to strip code for TTS
    const prepareTextForSpeech = (text) => {
        if (!text) return '';
        // Replace code blocks
        let cleanText = text.replace(/```[\s\S]*?```/g, language === 'de' ? " Code-Block. " : " Code block. ");
        // Replace inline code
        cleanText = cleanText.replace(/`[^`]+`/g, language === 'de' ? " Code-Schnipsel. " : " Code snippet. ");
        return cleanText;
    };

    const {
        start: startSTT,
        stop: stopSTT,
        result: sttResult,
        isListening: sttListening
    } = useSpeechToText();

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [isInterviewComplete, setIsInterviewComplete] = useState(false);
    const [isCodeInputMode, setIsCodeInputMode] = useState(false);
    const MAX_QUESTIONS = 10; // Maximum questions per interview session

    const flatListRef = useRef(null);
    const inputRef = useRef(null);

    // Language code to name mapping for interview language instruction
    const LANGUAGE_NAMES = {
        en: 'English', es: 'Spanish', fr: 'French', de: 'German',
        it: 'Italian', pt: 'Portuguese', tr: 'Turkish', ja: 'Japanese',
        ko: 'Korean', zh: 'Chinese', ru: 'Russian', ar: 'Arabic', hi: 'Hindi'
    };
    const languageName = LANGUAGE_NAMES[language] || 'English';

    // Build system prompt with language instruction
    const baseSystemPrompt = category?.systemPrompt
        ? category.systemPrompt(language, topic, difficulty)
        : `You are a professional interviewer. Ask one question at a time. Wait for answers.`;

    // Add language instruction for non-English/German interviews
    const languageInstruction = (language !== 'en' && language !== 'de')
        ? `\n\nCRITICAL LANGUAGE REQUIREMENT: You MUST conduct this entire interview in ${languageName}. ALL your questions, responses, feedback, and evaluations must be written in ${languageName}. The user wants to practice job interviews in ${languageName}.`
        : '';

    const systemPrompt = baseSystemPrompt + languageInstruction;

    // Scroll to bottom helper
    const scrollToBottom = useCallback((animated = true) => {
        if (flatListRef.current && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated });
            }, 100);
        }
    }, [messages.length]);

    // Initialize interview - load saved progress or start fresh
    useEffect(() => {
        const initInterview = async () => {
            Logger.breadcrumb('Interview started', {
                category: category.id,
                topic: topic?.id,
                difficulty: difficulty.id
            });

            // Check for saved progress
            const savedProgress = await interviewService.loadProgress({
                categoryId: category.id,
                topicId: topic?.id,
                difficultyId: difficulty.id
            });

            // Resume if saved progress exists AND has valid content (at least welcome + 1 response)
            if (savedProgress && savedProgress.messages?.length >= 2 && savedProgress.questionCount > 0) {
                Logger.info('Resuming interview from saved progress');
                setMessages(savedProgress.messages || []);
                setQuestionCount(savedProgress.questionCount || 0);
                setIsInterviewComplete(savedProgress.isInterviewComplete || false);
                return;
            } else if (savedProgress) {
                // Corrupted/incomplete saved state - clear it and start fresh
                Logger.warn('Found incomplete saved progress - starting fresh');
                await interviewService.clearProgress({
                    categoryId: category.id,
                    topicId: topic?.id,
                    difficultyId: difficulty.id
                });
            }

            // Start fresh - clear any old progress for THIS interview only
            await interviewService.clearProgress({
                categoryId: category.id,
                topicId: topic?.id,
                difficultyId: difficulty.id
            });

            // Add AI welcome/first question with format explanation
            // Welcome messages for all supported languages
            const welcomeMessages = {
                en: `Welcome to the ${getLabel(category, language)} interview! I'll be your interviewer today.${topic ? ` We'll be focusing on ${getLabel(topic, language)}.` : ''}

I will ask you 10 questions. After each answer, you'll receive the next question. At the end of the interview, you'll receive a comprehensive assessment of your performance with a score and improvement suggestions.

Are you ready to begin?`,
                de: `Willkommen zum ${getLabel(category, language)} Interview! Ich werde heute Ihr Interviewer sein.${topic ? ` Wir werden uns auf ${getLabel(topic, language)} konzentrieren.` : ''}

Ich werde Ihnen 10 Fragen stellen. Nach jeder Antwort erhalten Sie die nächste Frage. Am Ende des Interviews erhalten Sie eine umfassende Bewertung Ihrer Leistung mit Punktzahl und Verbesserungsvorschlägen.

Sind Sie bereit zu beginnen?`,
                tr: `${getLabel(category, language)} mülakatına hoş geldiniz! Bugün görüşmeci ben olacağım.${topic ? ` ${getLabel(topic, language)} konusuna odaklanacağız.` : ''}

Size 10 soru soracağım. Her cevabınızdan sonra bir sonraki soruyu alacaksınız. Mülakatın sonunda performansınızın değerlendirmesini puan ve gelişim önerileriyle birlikte alacaksınız.

Başlamaya hazır mısınız?`,
                es: `¡Bienvenido a la entrevista de ${getLabel(category, language)}! Seré tu entrevistador hoy.${topic ? ` Nos centraremos en ${getLabel(topic, language)}.` : ''}

Te haré 10 preguntas. Después de cada respuesta, recibirás la siguiente pregunta. Al final de la entrevista, recibirás una evaluación completa de tu desempeño con puntuación y sugerencias de mejora.

¿Estás listo para comenzar?`,
                fr: `Bienvenue à l'entretien ${getLabel(category, language)} ! Je serai votre intervieweur aujourd'hui.${topic ? ` Nous nous concentrerons sur ${getLabel(topic, language)}.` : ''}

Je vous poserai 10 questions. Après chaque réponse, vous recevrez la question suivante. À la fin de l'entretien, vous recevrez une évaluation complète de votre performance avec un score et des suggestions d'amélioration.

Êtes-vous prêt à commencer ?`,
                it: `Benvenuto al colloquio ${getLabel(category, language)}! Sarò il tuo intervistatore oggi.${topic ? ` Ci concentreremo su ${getLabel(topic, language)}.` : ''}

Ti farò 10 domande. Dopo ogni risposta, riceverai la domanda successiva. Alla fine del colloquio, riceverai una valutazione completa delle tue prestazioni con punteggio e suggerimenti di miglioramento.

Sei pronto per iniziare?`,
                pt: `Bem-vindo à entrevista de ${getLabel(category, language)}! Serei seu entrevistador hoje.${topic ? ` Vamos focar em ${getLabel(topic, language)}.` : ''}

Farei 10 perguntas. Após cada resposta, você receberá a próxima pergunta. No final da entrevista, você receberá uma avaliação completa do seu desempenho com pontuação e sugestões de melhoria.

Você está pronto para começar?`,
                ja: `${getLabel(category, language)}面接へようこそ！本日は私が面接官を務めます。${topic ? `${getLabel(topic, language)}に焦点を当てます。` : ''}

10の質問をします。各回答の後、次の質問が出されます。面接の最後に、スコアと改善提案を含むパフォーマンスの総合評価を受け取ります。

始める準備はできましたか？`,
                ko: `${getLabel(category, language)} 면접에 오신 것을 환영합니다! 오늘 제가 면접관이 됩니다.${topic ? ` ${getLabel(topic, language)}에 집중하겠습니다.` : ''}

10개의 질문을 드리겠습니다. 각 답변 후 다음 질문을 받게 됩니다. 면접이 끝나면 점수와 개선 제안이 포함된 종합 평가를 받게 됩니다.

시작할 준비가 되셨나요?`,
                zh: `欢迎参加${getLabel(category, language)}面试！今天我将担任你的面试官。${topic ? `我们将专注于${getLabel(topic, language)}。` : ''}

我将问你10个问题。每次回答后，你将收到下一个问题。面试结束时，你将收到带有分数和改进建议的综合绩效评估。

你准备好开始了吗？`,
                ru: `Добро пожаловать на собеседование ${getLabel(category, language)}! Сегодня я буду вашим интервьюером.${topic ? ` Мы сосредоточимся на ${getLabel(topic, language)}.` : ''}

Я задам вам 10 вопросов. После каждого ответа вы получите следующий вопрос. В конце собеседования вы получите комплексную оценку вашей работы с баллом и рекомендациями по улучшению.

Вы готовы начать?`,
                ar: `مرحباً بك في مقابلة ${getLabel(category, language)}! سأكون محاورك اليوم.${topic ? ` سنركز على ${getLabel(topic, language)}.` : ''}

سأطرح عليك 10 أسئلة. بعد كل إجابة، ستتلقى السؤال التالي. في نهاية المقابلة، ستتلقى تقييماً شاملاً لأدائك مع درجة واقتراحات للتحسين.

هل أنت مستعد للبدء؟`,
                hi: `${getLabel(category, language)} साक्षात्कार में आपका स्वागत है! आज मैं आपका साक्षात्कारकर्ता होऊंगा।${topic ? ` हम ${getLabel(topic, language)} पर ध्यान केंद्रित करेंगे।` : ''}

मैं आपसे 10 प्रश्न पूछूंगा। प्रत्येक उत्तर के बाद, आपको अगला प्रश्न मिलेगा। साक्षात्कार के अंत में, आपको अंक और सुधार सुझावों के साथ अपने प्रदर्शन का व्यापक मूल्यांकन प्राप्त होगा।

क्या आप शुरू करने के लिए तैयार हैं?`
            };

            const welcomeMessage = welcomeMessages[language] || welcomeMessages.en;

            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: welcomeMessage,
                timestamp: new Date()
            }]);
        };

        initInterview();

        return () => {
            voiceService.stopSpeaking();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle STT result
    useEffect(() => {
        if (sttResult) setInputText(sttResult.text);
    }, [sttResult]);

    // Scroll when messages change
    useEffect(() => {
        scrollToBottom(true);
    }, [messages.length, scrollToBottom]);

    // Keyboard listener
    useEffect(() => {
        const keyboardListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setTimeout(() => scrollToBottom(true), 150)
        );
        return () => keyboardListener.remove();
    }, [scrollToBottom]);

    // Auto-save progress after each message exchange (protects against crashes)
    useEffect(() => {
        const autoSaveProgress = async () => {
            // Only save if there's real progress (at least welcome + 1 user response)
            const hasRealProgress = messages.length >= 2 && questionCount > 0;

            // Don't save if interview is complete (will be saved to history instead)
            if (!hasRealProgress || isInterviewComplete) return;

            try {
                await interviewService.saveProgress({
                    categoryId: category.id,
                    topicId: topic?.id,
                    difficultyId: difficulty.id,
                    category: { id: category.id, label: getLabel(category, language) },
                    topic: topic ? { id: topic.id, label: getLabel(topic, language) } : null,
                    difficulty: { id: difficulty.id, label: getLabel(difficulty, language) },
                    language,
                    messages,
                    questionCount,
                    isInterviewComplete,
                });
                Logger.debug('[AUTO-SAVE] Interview progress saved');
            } catch (error) {
                Logger.error('[AUTO-SAVE] Failed to save progress:', error);
            }
        };

        autoSaveProgress();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length, questionCount]);

    // Hardware back button handler
    useEffect(() => {
        const backAction = () => {
            handleBack();
            return true; // Prevent default behavior
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [handleBack]);

    const handleSend = async () => {
        if (!inputText.trim() || loading) return;

        // Check for "Feedback" keyword to trigger assessment manually
        const cleanInput = inputText.trim().toLowerCase().replace(/[.,!?;]*$/, '');
        if (cleanInput === 'feedback' || cleanInput === 'feedback please') {
            setInputText('');
            requestFinalFeedback();
            return;
        }

        const userMessage = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role: 'user',
            content: inputText.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setLoading(true);

        try {
            // Build conversation history for AI
            const history = [...messages, userMessage].map(m => ({
                role: m.role,
                content: m.content
            }));

            // Calculate next question number (current questionCount + 1)
            const nextQuestionNum = questionCount + 1;

            // Build enhanced system prompt with question count context
            const questionLimitInstruction = language === 'de'
                ? `\n\nWICHTIG: Dies ist Frage ${nextQuestionNum} von ${MAX_QUESTIONS}. ${nextQuestionNum >= MAX_QUESTIONS
                    ? 'STOPP! Dies ist die LETZTE Frage. Nach der Bewertung dieser Antwort: 1) Stelle ABSOLUT KEINE weitere Frage 2) Keine Folgefragen 3) Keine Klärungsfragen 4) Sage nur kurz "Gut gemacht! Das Interview ist abgeschlossen. Wenn du bereit bist, sage Feedback für deine Bewertung."'
                    : 'Stelle nach der Bewertung dieser Antwort die nächste Frage.'
                }`
                : `\n\nIMPORTANT: This is question ${nextQuestionNum} of ${MAX_QUESTIONS}. ${nextQuestionNum >= MAX_QUESTIONS
                    ? 'STOP! This is the FINAL question. After evaluating this answer: 1) Ask ABSOLUTELY NO more questions 2) No follow-up questions 3) No clarifying questions 4) Simply say "Great job! The interview is now complete. When ready, say Feedback to receive your assessment."'
                    : 'After evaluating this answer, ask the next question.'
                }`;

            const enhancedSystemPrompt = systemPrompt + questionLimitInstruction;

            // Build API messages with enhanced system prompt
            const apiMessages = [
                { role: 'system', content: enhancedSystemPrompt },
                ...history
            ];

            const model = isPro() ? 'gpt-4o' : 'gpt-3.5-turbo';

            console.log('[InterviewScreen] Sending to API:', {
                messageCount: apiMessages.length,
                model,
                systemPromptLength: systemPrompt?.length
            });

            // Call backend API
            const response = await axios.post(
                `${BACKEND_URL}/api/chat`,
                { messages: apiMessages, model: model },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-client-secret': APP_CLIENT_SECRET
                    },
                    timeout: 30000
                }
            );

            console.log('[InterviewScreen] API response received:', response.data?.choices?.length);

            const aiContent = response.data.choices[0].message.content;

            const aiMessage = {
                id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: aiContent,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
            const newCount = questionCount + 1;
            setQuestionCount(newCount);

            // Auto-trigger final assessment after MAX_QUESTIONS
            if (newCount >= MAX_QUESTIONS && !isInterviewComplete) {
                requestFinalFeedback();
            }

            // Speak response if enabled AND in voice mode
            if (userProfile?.autoTTS !== false && mode === 'voice') {
                const speechText = prepareTextForSpeech(aiContent);
                voiceService.speak(speechText, userProfile?.voicePreference);
            }

        } catch (error) {
            Logger.error('Interview AI error', error);
            const errorMessage = {
                id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: language === 'de'
                    ? 'Entschuldigung, es gab ein Problem. Bitte versuchen Sie es erneut.'
                    : 'Sorry, there was an issue. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleMicPress = async () => {
        if (sttListening) {
            await stopSTT();
        } else {
            await startSTT(language === 'de' ? 'de-DE' : 'en-US');
        }
    };

    const renderFormattedText = (text, style) => {
        if (!text) return null;

        // Check for fenced code blocks (```code```)
        const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
        const hasCodeBlocks = codeBlockRegex.test(text);

        if (hasCodeBlocks) {
            // Reset regex
            codeBlockRegex.lastIndex = 0;
            const elements = [];
            let lastIndex = 0;
            let match;
            let keyIndex = 0;

            while ((match = codeBlockRegex.exec(text)) !== null) {
                // Add text before code block
                if (match.index > lastIndex) {
                    const beforeText = text.slice(lastIndex, match.index);
                    elements.push(
                        <Text key={`text-${keyIndex++}`} style={style}>
                            {renderTextWithBold(beforeText)}
                        </Text>
                    );
                }

                // Add code block
                const language = match[1] || '';
                const code = match[2].trim();
                elements.push(
                    <View key={`code-${keyIndex++}`} style={styles.codeBlock}>
                        {language ? (
                            <Text style={styles.codeLanguage}>{language}</Text>
                        ) : null}
                        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                            <Text style={styles.codeText}>{code}</Text>
                        </ScrollView>
                    </View>
                );

                lastIndex = match.index + match[0].length;
            }

            // Add remaining text after last code block
            if (lastIndex < text.length) {
                const afterText = text.slice(lastIndex);
                elements.push(
                    <Text key={`text-${keyIndex++}`} style={style}>
                        {renderTextWithBold(afterText)}
                    </Text>
                );
            }

            return <View>{elements}</View>;
        }

        // Check for inline code (`code`)
        const inlineCodeRegex = /`([^`]+)`/g;
        if (inlineCodeRegex.test(text)) {
            inlineCodeRegex.lastIndex = 0;
            const parts = [];
            let lastIdx = 0;
            let inlineMatch;
            let idx = 0;

            while ((inlineMatch = inlineCodeRegex.exec(text)) !== null) {
                if (inlineMatch.index > lastIdx) {
                    parts.push(text.slice(lastIdx, inlineMatch.index));
                }
                parts.push(
                    <Text key={`inline-${idx++}`} style={styles.inlineCode}>
                        {inlineMatch[1]}
                    </Text>
                );
                lastIdx = inlineMatch.index + inlineMatch[0].length;
            }
            if (lastIdx < text.length) {
                parts.push(text.slice(lastIdx));
            }

            return (
                <Text style={style}>
                    {parts.map((part, i) =>
                        typeof part === 'string' ? renderTextWithBold(part) : part
                    )}
                </Text>
            );
        }

        // No code - just handle bold
        return (
            <Text style={style}>
                {renderTextWithBold(text)}
            </Text>
        );
    };

    // Helper to render bold text
    const renderTextWithBold = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <Text key={index} style={{ fontWeight: 'bold' }}>
                        {part.slice(2, -2)}
                    </Text>
                );
            }
            return part;
        });
    };

    const renderMessage = ({ item }) => {
        const isUser = item.role === 'user';

        // Don't render the system feedback request message
        if (item.isSystemRequest) {
            return null;
        }

        return (
            <View style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.aiBubble,
                item.isFinalFeedback && styles.feedbackBubble,
                {
                    backgroundColor: isUser
                        ? (category.color || colors.primary)
                        : item.isFinalFeedback
                            ? (isDarkMode ? '#1a472a' : '#e8f5e9')
                            : (isDarkMode ? colors.surfaceElevated : '#f0f0f0'),
                    borderWidth: (isCyberpunk && !isUser) ? 1 : 0,
                    borderColor: (isCyberpunk && !isUser) ? colors.border : 'transparent',
                    shadowColor: (isCyberpunk && !isUser) ? colors.glowColor : 'transparent',
                    shadowOpacity: (isCyberpunk && !isUser) ? 0.5 : 0,
                    shadowRadius: (isCyberpunk && !isUser) ? 8 : 0,
                    elevation: (isCyberpunk && !isUser) ? 5 : 0
                }
            ]}>
                {!isUser && (
                    <View style={[styles.aiIcon, {
                        backgroundColor: item.isFinalFeedback
                            ? '#4CAF5020'
                            : (category.color || colors.primary) + '20'
                    }]}>
                        <Icon
                            name={item.isFinalFeedback ? 'trophy' : 'briefcase'}
                            size={16}
                            color={item.isFinalFeedback ? '#4CAF50' : (category.color || colors.primary)}
                        />
                    </View>
                )}
                {isUser ? (
                    <Text style={[styles.userMessageText, { color: '#fff' }]}>
                        {item.content}
                    </Text>
                ) : (
                    renderFormattedText(
                        item.content,
                        [styles.messageText, { color: colors.text }]
                    )
                )}
            </View>
        );
    };

    // Request final comprehensive feedback
    const requestFinalFeedback = async () => {
        if (isInterviewComplete || loading) return;

        setIsInterviewComplete(true);
        setLoading(true);

        const feedbackPrompt = language === 'de'
            ? `Das Interview ist beendet. Bitte gib mir eine umfassende Bewertung meiner Leistung:

1. **Gesamtbewertung**: Bestanden/Nicht bestanden/Grenzwertig
2. **Stärken**: Was habe ich gut gemacht?
3. **Verbesserungsbereiche**: Wo muss ich arbeiten?
4. **Spezifische Empfehlungen**: Konkrete Tipps für jede Schwachstelle
5. **Punktzahl**: X/100 mit Begründung

Sei ehrlich und konstruktiv.`
            : `The interview is complete. Please provide a comprehensive assessment of my performance:

1. **Overall Verdict**: Pass/Fail/Borderline
2. **Strengths**: What did I do well?
3. **Areas for Improvement**: Where do I need to work?
4. **Specific Recommendations**: Concrete tips for each weakness
5. **Score**: X/100 with justification

5. **Score**: X/100 with justification

Be honest and constructive. Give low scores (0-30) for short, lazy, or irrelevant answers.`;

        const feedbackMessage = {
            id: `user_feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role: 'user',
            content: feedbackPrompt,
            timestamp: new Date(),
            isSystemRequest: true // Mark as system request, not user input
        };

        setMessages(prev => [...prev, feedbackMessage]);

        try {
            const history = [...messages, feedbackMessage].map(m => ({
                role: m.role,
                content: m.content
            }));

            const apiMessages = [
                { role: 'system', content: systemPrompt },
                ...history
            ];

            const model = isPro() ? 'gpt-4o' : 'gpt-3.5-turbo';

            const response = await axios.post(
                `${BACKEND_URL}/api/chat`,
                { messages: apiMessages, model: model },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-client-secret': APP_CLIENT_SECRET
                    },
                    timeout: 45000 // Longer timeout for comprehensive feedback
                }
            );

            const aiContent = response.data.choices[0].message.content;

            const aiMessage = {
                id: `ai_feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: aiContent,
                timestamp: new Date(),
                isFinalFeedback: true
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            Logger.error('Final feedback error', error);
            showAlert(
                language === 'de' ? 'Fehler' : 'Error',
                language === 'de' ? 'Feedback konnte nicht geladen werden.' : 'Could not load feedback.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle interview completion - save to history
    const handleInterviewComplete = async () => {
        try {
            // Save to Firebase history - FILTER OUT SYSTEM MESSAGES
            const cleanMessages = messages.filter(m => m.role !== 'system' && !m.isSystemRequest);

            await interviewService.saveToHistory({
                category: getLabel(category, language),
                topic: topic ? getLabel(topic, language) : null,
                difficulty: getLabel(difficulty, language),
                language,
                questionCount,
                messages: cleanMessages,
            });

            // Extract vocabulary from the interview conversation
            if (user?.uid && cleanMessages.length >= 3) {
                const interviewId = `interview_${category.id}_${Date.now()}`;
                Logger.info('[VOCAB] Extracting vocabulary from interview', {
                    interviewId,
                    messageCount: cleanMessages.length,
                    language
                });

                analyticsService.extractVocabulary(
                    user.uid,
                    interviewId,
                    cleanMessages,
                    language === 'de' ? 'de' : 'en',
                    userProfile?.nativeLanguage || 'en'
                ).then(result => {
                    if (result?.success) {
                        Logger.info('[VOCAB] Interview vocabulary extracted', { wordsAdded: result.wordsAdded });
                    }
                }).catch(err => Logger.error('[VOCAB] Interview vocabulary extraction failed', err));
            }

            // Clear saved progress
            await interviewService.clearProgress({
                categoryId: category.id,
                topicId: topic?.id,
                difficultyId: difficulty.id
            });

            // Increment daily interview count (only if not already at daily limit)
            // Extra interviews are consumed when STARTING an interview, not when completing
            const dailyCount = await interviewService.getDailyInterviewCount();
            if (dailyCount < 1) {
                await interviewService.incrementDailyCount();
            }
            // NOTE: We don't consume extra interviews here - they were already consumed
            // when the interview was started (in InterviewSetupScreen)

            Logger.info('Interview completed and saved to history');
        } catch (error) {
            Logger.error('Error completing interview:', error);
        } finally {
            // Always navigate back, even if there was an error
            navigation.goBack();
        }
    };

    // Handle back button - save progress if interview not complete AND has content
    const handleBack = async () => {
        // If interview is complete, run completion logic (save history, increment stats)
        if (isInterviewComplete) {
            await handleInterviewComplete();
            return;
        }

        // Only save if interview has actual content (at least welcome message + 1 user response)
        const hasRealProgress = messages.length >= 2 && questionCount > 0;

        if (hasRealProgress) {
            // Save progress to resume later
            await interviewService.saveProgress({
                categoryId: category.id,
                topicId: topic?.id,
                difficultyId: difficulty.id,
                category: { id: category.id, label: getLabel(category, language) },
                topic: topic ? { id: topic.id, label: getLabel(topic, language) } : null,
                difficulty: { id: difficulty.id, label: getLabel(difficulty, language) },
                language,
                messages,
                questionCount,
                isInterviewComplete,
            });
            Logger.info('Interview progress saved on back');
        } else {
            // User backed out before starting - clear any stale progress for this interview
            await interviewService.clearProgress({
                categoryId: category.id,
                topicId: topic?.id,
                difficultyId: difficulty.id
            });
            Logger.info('Interview not started - cleared stale progress');
        }
        navigation.goBack();
    };

    const bgImage = BACKGROUND_IMAGES[category.id];
    const overlayColor = bgImage
        ? (isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.35)')
        : colors.background;

    const content = (
        <View style={[styles.container, { backgroundColor: bgImage ? overlayColor : colors.background }]}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={[category.color || colors.primary, isDarkMode ? '#1a1a2e' : '#4a148c']}
                style={styles.header}
            >
                <SafeAreaView>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleBack}
                        >
                            <Icon name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>

                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {getLabel(category, language)}
                            </Text>
                            <Text style={styles.headerSubtitle} numberOfLines={1}>
                                {topic ? `${getLabel(topic, language)} • ` : ''}
                                {getLabel(difficulty, language)} • Q{questionCount}/{MAX_QUESTIONS}
                            </Text>
                        </View>
                    </View>
                </SafeAreaView >
            </LinearGradient >

            {/* Chat Area */}
            < KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    onContentSizeChange={() => scrollToBottom(true)}
                />

                {
                    loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={category.color || colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                {language === 'de' ? 'Denke nach...' : 'Thinking...'}
                            </Text>
                        </View>
                    )
                }

                {/* Question Progress - shown during interview */}
                {
                    !isInterviewComplete && questionCount > 0 && (
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            backgroundColor: category.color || colors.primary,
                                            width: `${(questionCount / MAX_QUESTIONS) * 100}%`
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                                {language === 'de'
                                    ? `Frage ${questionCount} von ${MAX_QUESTIONS}`
                                    : `Question ${questionCount} of ${MAX_QUESTIONS}`}
                            </Text>
                        </View>
                    )
                }

                {/* Interview Complete - Back to Home */}
                {
                    isInterviewComplete && (
                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={[styles.endInterviewButton, { backgroundColor: '#4CAF50' }]}
                                onPress={handleInterviewComplete}
                            >
                                <Icon name="arrow-back" size={18} color="#fff" />
                                <Text style={styles.endInterviewText}>
                                    {language === 'de' ? 'Zurück zur Startseite' : 'Back to Home'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )
                }

                {/* Input Area - hidden when interview is complete */}
                {
                    !isInterviewComplete && (
                        <View style={[
                            styles.inputContainer,
                            { backgroundColor: colors.surface, borderTopColor: colors.border },
                            isCyberpunk && {
                                borderTopWidth: 1,
                                borderTopColor: colors.glowColor,
                                shadowColor: colors.glowColor,
                                shadowOffset: { width: 0, height: -2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 5
                            }
                        ]}>
                            <View style={styles.inputRow}>
                                {/* Code Input Toggle - show for technical topics */}
                                {category?.id === 'technical' && (
                                    <TouchableOpacity
                                        style={[
                                            styles.codeInputToggle,
                                            isCodeInputMode && styles.codeInputActive,
                                            { backgroundColor: isCodeInputMode ? '#1e1e1e' : (isDarkMode ? colors.surfaceElevated : '#f0f0f0') }
                                        ]}
                                        onPress={() => setIsCodeInputMode(!isCodeInputMode)}
                                    >
                                        <Icon
                                            name="code-slash"
                                            size={18}
                                            color={isCodeInputMode ? '#9cdcfe' : colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                )}

                                {mode === 'voice' && (
                                    <TouchableOpacity
                                        style={[
                                            styles.micButton,
                                            { backgroundColor: sttListening ? '#ef5350' : (category.color || colors.primary) }
                                        ]}
                                        onPress={handleMicPress}
                                    >
                                        <Icon
                                            name={sttListening ? 'stop' : 'mic'}
                                            size={22}
                                            color="#fff"
                                        />
                                    </TouchableOpacity>
                                )}

                                <TextInput
                                    ref={inputRef}
                                    style={[
                                        styles.textInput,
                                        { backgroundColor: isDarkMode ? colors.surfaceElevated : '#f5f5f5', color: colors.text },
                                        isCodeInputMode && styles.codeTextInput
                                    ]}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    placeholder={isCodeInputMode
                                        ? (language === 'de' ? 'Code eingeben...' : 'Enter code...')
                                        : (language === 'de' ? 'Ihre Antwort...' : 'Your answer...')}
                                    placeholderTextColor={isCodeInputMode ? '#6a6a6a' : colors.textSecondary}
                                    multiline
                                    maxLength={2000}
                                    returnKeyType="send"
                                    blurOnSubmit={false}
                                    onSubmitEditing={handleSend}
                                    autoCorrect={!isCodeInputMode}
                                    autoCapitalize={isCodeInputMode ? 'none' : 'sentences'}
                                    spellCheck={!isCodeInputMode}
                                />

                                <TouchableOpacity
                                    style={[
                                        styles.sendButton,
                                        { backgroundColor: inputText.trim() ? (category.color || colors.primary) : colors.border }
                                    ]}
                                    onPress={handleSend}
                                    disabled={!inputText.trim() || loading}
                                >
                                    <Icon name="send" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )
                }
            </KeyboardAvoidingView>
        </View>
    );

    if (bgImage) {
        return (
            <ImageBackground
                source={bgImage}
                style={{ flex: 1 }}
                resizeMode="cover"
            >
                {content}
            </ImageBackground>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        paddingBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    keyboardContainer: {
        flex: 1,
    },
    messagesList: {
        padding: 16,
        paddingTop: 20,
        paddingBottom: 100,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 14,
        borderRadius: 18,
        marginBottom: 12,
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
        // No flex constraints - let content determine size
    },
    aiBubble: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    aiIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        flexShrink: 0,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        flex: 1,
        flexShrink: 1,
    },
    userMessageText: {
        fontSize: 15,
        lineHeight: 22,
        // No flex constraints - text should expand naturally
    },
    feedbackBubble: {
        borderWidth: 2,
        borderColor: '#4CAF50',
        maxWidth: '95%',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    loadingText: {
        fontSize: 13,
    },
    progressContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    progressBar: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '500',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 10,
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        gap: 6,
    },
    quickActionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    inputContainer: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    micButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    endInterviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    endInterviewText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    // Code block styles
    codeBlock: {
        backgroundColor: '#1e1e1e',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
        overflow: 'hidden',
    },
    codeLanguage: {
        color: '#9cdcfe',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeText: {
        color: '#d4d4d4',
        fontSize: 13,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: 20,
    },
    inlineCode: {
        backgroundColor: '#2d2d2d',
        color: '#ce9178',
        fontSize: 13,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    // Code input toggle
    codeInputToggle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    codeInputActive: {
        backgroundColor: '#1e1e1e',
    },
    codeTextInput: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
    },
});

export default InterviewScreen;

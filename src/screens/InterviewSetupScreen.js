import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Dimensions,
    Modal,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '../contexts/AlertContext';
import { useFocusEffect } from '@react-navigation/native';
import InterviewDropdown from '../components/InterviewDropdown';
import PremiumLimitModal from '../components/PremiumLimitModal';
import interviewService from '../services/interviewService';
import rewardedAdService from '../services/rewardedAdService';
import Logger from '../utils/logger';
import {
    INTERVIEW_CATEGORIES,
    INTERVIEW_STRINGS,
    getCategoriesArray,
    getTopicsArray,
    getDifficultiesArray,
    getLabel,
    DIFFICULTY_LEVELS,
    LANGUAGES,
} from '../constants/interviewScenarios';

const { width } = Dimensions.get('window');

const InterviewSetupScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();
    const { userProfile, isPro } = useApp();
    const { showAlert } = useAlert();

    // State for Interview Settings - always default to English
    const [interviewLanguage, setInterviewLanguage] = useState('en');
    const [interviewMode, setInterviewMode] = useState('text'); // 'text' or 'voice'

    const strings = INTERVIEW_STRINGS[interviewLanguage] || INTERVIEW_STRINGS['en'];

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate');

    // Limit & Ad State
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [loadingAd, setLoadingAd] = useState(false);
    const [adAvailable, setAdAvailable] = useState(true);
    const [savedProgress, setSavedProgress] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null); // 'category' | 'topic' | 'difficulty' | null

    const categories = getCategoriesArray(interviewLanguage);
    const difficulties = getDifficultiesArray(interviewLanguage);

    const category = selectedCategory
        ? Object.values(INTERVIEW_CATEGORIES).find(c => c.id === selectedCategory)
        : null;
    const topics = category ? getTopicsArray(category, interviewLanguage) : [];

    // Reset topic when category changes
    useEffect(() => {
        setSelectedTopic(null);
    }, [selectedCategory]);

    // Preload ad on mount AND check for saved progress
    useEffect(() => {
        rewardedAdService.preloadAd('CHAT');

        // Check for valid saved progress that needs to be resumed
        interviewService.hasValidProgress().then(progress => {
            if (progress) {
                setSavedProgress(progress);
                Logger.info('Found valid saved interview progress - user must resume');
            } else {
                // No saved progress - reset the form to defaults
                setInterviewLanguage('en');
                setSelectedCategory(null);
                setSelectedTopic(null);
                setSelectedDifficulty('intermediate');
                setSavedProgress(null);
            }
        });
    }, []);

    // Check for saved progress on every screen focus (e.g., returning from completed interview)
    // Using a ref to track whether we had progress before to avoid infinite loop
    const hadProgressRef = React.useRef(false);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;

            // Reset any potentially stale UI states when screen gains focus
            setOpenDropdown(null);
            setShowLimitModal(false);
            setLoadingAd(false);

            interviewService.hasValidProgress()
                .then(progress => {
                    if (!isMounted) return;

                    if (progress) {
                        // Has saved progress - user must resume
                        setSavedProgress(progress);
                        hadProgressRef.current = true;
                    } else {
                        // Interview was completed - reset form to defaults
                        if (hadProgressRef.current) {
                            // Only reset if we previously had saved progress (means it was cleared/completed)
                            setInterviewLanguage('en');
                            setSelectedCategory(null);
                            setSelectedTopic(null);
                            setSelectedDifficulty('intermediate');
                        }
                        setSavedProgress(null);
                        hadProgressRef.current = false;
                    }
                })
                .catch(error => {
                    if (!isMounted) return;
                    Logger.error('[InterviewSetup] Error checking saved progress:', error);
                    // On error, reset to defaults to allow fresh start
                    setSavedProgress(null);
                    hadProgressRef.current = false;
                });

            return () => {
                isMounted = false;
            };
        }, []) // Empty dependency array - only run on focus, not on state changes
    );

    const canStart = selectedCategory && selectedDifficulty &&
        (!category?.topics || selectedTopic);

    // Handle Mode Toggle
    const handleModeToggle = (mode) => {
        if (mode === 'voice' && !isPro()) {
            showAlert(
                interviewLanguage === 'de' ? 'Premium Funktion' : 'Premium Feature',
                interviewLanguage === 'de'
                    ? 'Sprachmodus ist nur für Premium-Nutzer verfügbar.'
                    : 'Voice mode is only available for Premium users.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') }
                ]
            );
            return;
        }
        setInterviewMode(mode);
    };

    const handleStartInterview = async () => {
        // If user has valid saved progress, force them to resume it
        if (savedProgress) {
            // Navigate directly to the saved interview
            const savedCategory = Object.values(INTERVIEW_CATEGORIES).find(
                c => c.id === savedProgress.categoryId
            );
            const savedDifficulty = Object.values(DIFFICULTY_LEVELS).find(
                d => d.id === savedProgress.difficultyId
            );
            const savedTopic = savedProgress.topicId && savedCategory?.topics
                ? Object.values(savedCategory.topics).find(t => t.id === savedProgress.topicId)
                : null;

            navigation.navigate('Interview', {
                category: savedCategory,
                topic: savedTopic,
                difficulty: savedDifficulty,
                language: savedProgress.language || interviewLanguage,
                mode: savedProgress.mode || 'text', // Default to text if not saved
            });
            return;
        }

        // Check daily limit
        const isLimitReached = await interviewService.hasReachedDailyLimit(userProfile?.subscriptionTier === 'pro');

        if (isLimitReached) {
            // Check if they have ALREADY watched the ad
            const hasWatchedAd = await interviewService.hasWatchedAdToday();
            setAdAvailable(!hasWatchedAd);
            setShowLimitModal(true);
            return;
        }

        startInterviewNavigation();
    };

    const startInterviewNavigation = async () => {
        const difficulty = Object.values(DIFFICULTY_LEVELS).find(d => d.id === selectedDifficulty);
        const topic = selectedTopic && category?.topics
            ? Object.values(category.topics).find(t => t.id === selectedTopic)
            : null;

        // Consume extra interview if user is over daily limit
        const dailyCount = await interviewService.getDailyInterviewCount();
        if (dailyCount >= 1) {
            // User has already used their free daily interview, consume an extra one
            await interviewService.consumeExtraInterview();
        }

        navigation.navigate('Interview', {
            category: category,
            topic: topic,
            difficulty: difficulty,
            language: interviewLanguage,
            mode: interviewMode,
        });
    };

    const handleWatchAd = async () => {
        // Block ads if user has saved progress they must complete first
        if (savedProgress) {
            showAlert(
                interviewLanguage === 'de' ? 'Interview fortsetzen' : 'Resume Interview',
                interviewLanguage === 'de'
                    ? 'Sie haben ein laufendes Interview. Bitte beenden Sie es zuerst.'
                    : 'You have an ongoing interview. Please complete it first.'
            );
            return;
        }

        setLoadingAd(true);

        // Check if already watched ad today
        const hasWatched = await interviewService.hasWatchedAdToday();
        if (hasWatched) {
            showAlert(
                interviewLanguage === 'de' ? 'Tageslimit erreicht' : 'Daily Limit Reached',
                interviewLanguage === 'de'
                    ? 'Sie können nur 1 Interview pro Tag durch Werbung freischalten. Bitte upgraden Sie auf Premium für unbegrenzten Zugang.'
                    : 'You can only unlock 1 interview per day via ads. Please upgrade to Premium for unlimited access.'
            );
            setLoadingAd(false);
            return;
        }

        // Check if ad is ready
        if (!rewardedAdService.isAdReady('INTERVIEW_LANGUAGE')) {
            showAlert(
                interviewLanguage === 'de' ? 'Werbung lädt noch' : 'Ad Loading',
                interviewLanguage === 'de'
                    ? 'Bitte warten Sie einen Moment und versuchen Sie es erneut.'
                    : 'Please wait a moment and try again.'
            );
            rewardedAdService.preloadAd('INTERVIEW_LANGUAGE');
            setLoadingAd(false);
            return;
        }

        const success = await rewardedAdService.showAd(
            'INTERVIEW_LANGUAGE',
            async (reward) => {
                Logger.info('Ad watched for interview');
                await interviewService.earnExtraInterview();
                await interviewService.markAdWatchedToday();
                setShowLimitModal(false);

                // Small delay to allow modal to close
                setTimeout(() => {
                    startInterviewNavigation();
                }, 500);
            },
            () => setLoadingAd(false),
            (error) => {
                Logger.error('Ad error:', error);
                setLoadingAd(false);
                showAlert('Error', 'Failed to load ad. Please try again.');
            }
        );

        if (!success) setLoadingAd(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Curved Header Background */}
            <View style={styles.headerBackgroundContainer}>
                <LinearGradient
                    colors={isDarkMode ? [colors.primary, '#4a148c'] : ['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                />
            </View>

            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <SafeAreaView style={styles.safeArea}>
                {/* Header Content */}
                <View style={styles.headerContent}>
                    <Icon name="briefcase-outline" size={40} color="#fff" />
                    <Text style={styles.headerTitle}>{strings.title}</Text>
                    <Text style={styles.headerSubtitle}>
                        {interviewLanguage === 'de'
                            ? 'Wählen Sie Ihre Intervieweinstellungen'
                            : 'Choose your interview settings'}
                    </Text>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Language Selection */}
                    <View style={styles.sectionContainer}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {interviewLanguage === 'de' ? 'Sprache' : 'Language'}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
                            {Object.values(LANGUAGES).map((lang) => {
                                const isSelected = interviewLanguage === lang.code;
                                const isLocked = !isPro() && lang.code !== 'en';

                                return (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[
                                            styles.languageButton,
                                            isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                                            { borderColor: colors.border }
                                        ]}
                                        onPress={() => {
                                            if (isLocked) {
                                                showAlert(
                                                    interviewLanguage === 'de' ? 'Sprache freischalten' : 'Unlock Language',
                                                    interviewLanguage === 'de'
                                                        ? `Möchten Sie eine Werbung ansehen, um ${lang.name} für dieses Interview freizuschalten?`
                                                        : `Watch a short ad to unlock ${lang.name} for this interview?`,
                                                    [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        {
                                                            text: 'Watch Ad',
                                                            onPress: async () => {
                                                                setLoadingAd(true);
                                                                const success = await rewardedAdService.showAd(
                                                                    'INTERVIEW_LANGUAGE',
                                                                    () => {
                                                                        setInterviewLanguage(lang.code);
                                                                        setLoadingAd(false);
                                                                    },
                                                                    () => setLoadingAd(false),
                                                                    () => {
                                                                        setLoadingAd(false);
                                                                        showAlert('Error', 'Failed to load ad.');
                                                                    }
                                                                );
                                                                if (!success) setLoadingAd(false);
                                                            }
                                                        }
                                                    ]
                                                );
                                            } else {
                                                setInterviewLanguage(lang.code);
                                            }
                                        }}
                                    >
                                        <Text style={{ fontSize: 24, marginBottom: 4 }}>{lang.flag}</Text>
                                        <Text style={[
                                            styles.languageText,
                                            isSelected ? { color: '#fff' } : { color: colors.text }
                                        ]}>{lang.name}</Text>

                                        {isLocked && !isSelected && (
                                            <View style={styles.adBadge}>
                                                <Icon name="play-circle" size={12} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Mode Selection */}
                    <View style={styles.sectionContainer}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {interviewLanguage === 'de' ? 'Modus' : 'Mode'}
                        </Text>
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    interviewMode === 'text' && { backgroundColor: colors.primary }
                                ]}
                                onPress={() => handleModeToggle('text')}
                            >
                                <Icon name="chatbubble-ellipses-outline" size={18} color={interviewMode === 'text' ? '#fff' : colors.text} style={{ marginRight: 6 }} />
                                <Text style={[
                                    styles.toggleText,
                                    interviewMode === 'text' ? { color: '#fff' } : { color: colors.text }
                                ]}>{interviewLanguage === 'de' ? 'Text' : 'Text'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    interviewMode === 'voice' && { backgroundColor: colors.primary }
                                ]}
                                onPress={() => handleModeToggle('voice')}
                            >
                                <Icon name="mic-outline" size={18} color={interviewMode === 'voice' ? '#fff' : colors.text} style={{ marginRight: 6 }} />
                                <Text style={[
                                    styles.toggleText,
                                    interviewMode === 'voice' ? { color: '#fff' } : { color: colors.text }
                                ]}>{interviewLanguage === 'de' ? 'Sprache' : 'Voice'}</Text>
                                {!isPro() && (
                                    <View style={styles.lockBadge}>
                                        <Icon name="lock-closed" size={12} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Category Selection */}
                    <InterviewDropdown
                        label={strings.categoryLabel}
                        value={selectedCategory}
                        options={categories}
                        onSelect={(val) => {
                            setSelectedCategory(val);
                            setOpenDropdown(null);
                        }}
                        placeholder={strings.selectCategory}
                        isOpen={openDropdown === 'category'}
                        onToggle={(open) => setOpenDropdown(open ? 'category' : null)}
                    />

                    {/* Topic Selection (if category has topics) */}
                    {
                        topics.length > 0 && (
                            <InterviewDropdown
                                label={strings.topicLabel}
                                value={selectedTopic}
                                options={topics}
                                onSelect={(val) => {
                                    setSelectedTopic(val);
                                    setOpenDropdown(null);
                                }}
                                placeholder={strings.selectTopic}
                                isOpen={openDropdown === 'topic'}
                                onToggle={(open) => setOpenDropdown(open ? 'topic' : null)}
                            />
                        )
                    }

                    {/* Difficulty Selection */}
                    <InterviewDropdown
                        label={strings.difficultyLabel}
                        value={selectedDifficulty}
                        options={difficulties}
                        onSelect={(val) => {
                            setSelectedDifficulty(val);
                            setOpenDropdown(null);
                        }}
                        placeholder={strings.selectDifficulty}
                        isOpen={openDropdown === 'difficulty'}
                        onToggle={(open) => setOpenDropdown(open ? 'difficulty' : null)}
                    />

                    {/* Category Info Card */}
                    {
                        category && (
                            <View style={[styles.infoCard, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#f8f9fa', borderColor: category.color }]}>
                                <View style={[styles.infoIconContainer, { backgroundColor: category.color + '20' }]}>
                                    <Icon name={category.icon} size={28} color={category.color} />
                                </View>
                                <Text style={[styles.infoTitle, { color: colors.text }]}>
                                    {getLabel(category, interviewLanguage)}
                                </Text>
                                <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
                                    {category.description?.[interviewLanguage] || category.description?.en}
                                </Text>

                                {category.id === 'mixed' && (
                                    <View style={styles.flowContainer}>
                                        <Text style={[styles.flowLabel, { color: colors.textSecondary }]}>
                                            {interviewLanguage === 'de' ? 'Interview-Ablauf:' : 'Interview Flow:'}
                                        </Text>
                                        <View style={styles.flowSteps}>
                                            {category.flow?.map((step, index) => {
                                                const stepCat = INTERVIEW_CATEGORIES[step];
                                                return (
                                                    <View key={step} style={styles.flowStep}>
                                                        <View style={[styles.flowDot, { backgroundColor: stepCat?.color || colors.primary }]} />
                                                        <Text style={[styles.flowText, { color: colors.text }]}>
                                                            {getLabel(stepCat, interviewLanguage)}
                                                        </Text>
                                                        {index < category.flow.length - 1 && (
                                                            <Icon name="chevron-forward" size={14} color={colors.textSecondary} style={styles.flowArrow} />
                                                        )}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )
                    }

                    {/* Start Button */}
                    <TouchableOpacity
                        style={[
                            styles.startButton,
                            {
                                backgroundColor: canStart ? (category?.color || colors.primary) : colors.border,
                                opacity: canStart ? 1 : 0.6
                            }
                        ]}
                        onPress={handleStartInterview}
                        disabled={!canStart}
                    >
                        <Icon name="play" size={22} color="#fff" />
                        <Text style={styles.startButtonText}>{strings.startInterview}</Text>
                    </TouchableOpacity>

                    {/* Tips Section */}
                    {/* Tips Section */}
                    <View style={[styles.tipsContainer, { backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : '#F0F7FF', borderColor: isDarkMode ? 'rgba(33, 150, 243, 0.3)' : '#D6E4FF', borderWidth: 1 }]}>
                        <View style={styles.tipsHeader}>
                            <Icon name="sparkles-outline" size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                            <Text style={[styles.tipsTitle, { color: isDarkMode ? '#60A5FA' : '#2563EB' }]}>
                                {interviewLanguage === 'de' ? 'Profi-Tipps' : 'Pro Tips'}
                            </Text>
                        </View>

                        <View style={styles.tipItem}>
                            <View style={[styles.tipIconBox, { backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.2)' : '#DBEAFE' }]}>
                                <Icon name="mic-outline" size={18} color={isDarkMode ? '#93C5FD' : '#3B82F6'} />
                            </View>
                            <View style={styles.tipContent}>
                                <Text style={[styles.tipLabel, { color: colors.text }]}>
                                    {interviewLanguage === 'de' ? 'Klar Sprechen' : 'Speak Clearly'}
                                </Text>
                                <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                                    {interviewLanguage === 'de' ? 'Sprechen Sie in Ihrem natürlichen Tempo.' : 'Speak at your natural pace.'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.tipItem}>
                            <View style={[styles.tipIconBox, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
                                <Icon name="analytics-outline" size={18} color={isDarkMode ? '#6EE7B7' : '#10B981'} />
                            </View>
                            <View style={styles.tipContent}>
                                <Text style={[styles.tipLabel, { color: colors.text }]}>
                                    {interviewLanguage === 'de' ? 'Feedback Erhalten' : 'Get Feedback'}
                                </Text>
                                <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                                    {interviewLanguage === 'de' ? 'Sagen Sie "Feedback" für eine Analyse.' : 'Say "Feedback" to analyze your answer.'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.tipItem}>
                            <View style={[styles.tipIconBox, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                                <Icon name="star-outline" size={18} color={isDarkMode ? '#FCD34D' : '#F59E0B'} />
                            </View>
                            <View style={styles.tipContent}>
                                <Text style={[styles.tipLabel, { color: colors.text }]}>
                                    {interviewLanguage === 'de' ? 'STAR Methode' : 'STAR Method'}
                                </Text>
                                <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                                    {interviewLanguage === 'de' ? 'Strukturieren Sie Ihre Antworten.' : 'Structure your answers effectively.'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView >
            </SafeAreaView >

            {/* Limit Reached Modal */}

            < PremiumLimitModal
                visible={showLimitModal}
                mode="INTERVIEW"
                onClose={() => setShowLimitModal(false)}
                onWatchAd={handleWatchAd}
                adsWatchedToday={adAvailable ? 0 : 1}
                maxAdsPerDay={1}
            />
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Curved Header Background
    headerBackgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 280,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        zIndex: 0,
    },
    headerGradient: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    safeArea: {
        flex: 1,
        zIndex: 1,
    },
    headerContent: {
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 6,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    infoCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
    },
    infoIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    infoDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    flowContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128,128,128,0.2)',
    },
    flowLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    flowSteps: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    flowStep: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    flowDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    flowText: {
        fontSize: 13,
        fontWeight: '500',
    },
    flowArrow: {
        marginHorizontal: 6,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        marginBottom: 24,
        gap: 8,
    },
    startButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
    tipsContainer: {
        borderRadius: 14,
        padding: 16,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    tipsTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    tipText: {
        fontSize: 13,
        marginBottom: 6,
        lineHeight: 18,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tipIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    tipContent: {
        flex: 1,
    },
    tipLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    tipDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        marginLeft: 4,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: 4,
        gap: 8,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    lockBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#FF5252',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    languageButton: {
        width: 80,
        height: 80,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    languageText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    adBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#FF9800',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
});

export default InterviewSetupScreen;

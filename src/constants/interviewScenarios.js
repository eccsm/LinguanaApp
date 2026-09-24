/**
 * Interview Scenarios Configuration
 * Supports: English (en), German (de)
 */

// Localized strings for UI
export const INTERVIEW_STRINGS = {
    en: {
        title: 'Job Interview Practice',
        selectCategory: 'Select Interview Type',
        selectTopic: 'Select Topic',
        selectDifficulty: 'Select Difficulty',
        startInterview: 'Start Interview',
        feedback: 'Get Feedback',
        nextQuestion: 'Next Question',
        endInterview: 'End Interview',
        categoryLabel: 'Category',
        topicLabel: 'Topic',
        difficultyLabel: 'Difficulty',
    },
    de: {
        title: 'Vorstellungsgespräch Übung',
        selectCategory: 'Interviewtyp auswählen',
        selectTopic: 'Thema auswählen',
        selectDifficulty: 'Schwierigkeit auswählen',
        startInterview: 'Interview starten',
        feedback: 'Feedback erhalten',
        nextQuestion: 'Nächste Frage',
        endInterview: 'Interview beenden',
        categoryLabel: 'Kategorie',
        topicLabel: 'Thema',
        difficultyLabel: 'Schwierigkeit',
    }
};

// Difficulty levels
export const DIFFICULTY_LEVELS = {
    BEGINNER: {
        id: 'beginner',
        labels: { en: 'Beginner / Junior', de: 'Anfänger / Junior' },
        icon: 'leaf-outline',
        promptModifier: {
            en: 'Ask task-level, fundamental questions appropriate for someone with 0-2 years experience.',
            de: 'Stellen Sie aufgabenbezogene, grundlegende Fragen für jemanden mit 0-2 Jahren Erfahrung.'
        }
    },
    INTERMEDIATE: {
        id: 'intermediate',
        labels: { en: 'Intermediate', de: 'Mittelstufe' },
        icon: 'trending-up-outline',
        promptModifier: {
            en: 'Ask module-level implementation questions for 2-5 years experience.',
            de: 'Stellen Sie Fragen auf Modulebene für 2-5 Jahre Erfahrung.'
        }
    },
    SENIOR: {
        id: 'senior',
        labels: { en: 'Senior', de: 'Senior' },
        icon: 'star-outline',
        promptModifier: {
            en: 'Ask system-level debugging and architecture questions for 5-8 years experience.',
            de: 'Stellen Sie Fragen zu System-Debugging und Architektur für 5-8 Jahre Erfahrung.'
        }
    },
    LEAD: {
        id: 'lead',
        labels: { en: 'Lead / Architect', de: 'Lead / Architekt' },
        icon: 'shield-checkmark-outline',
        promptModifier: {
            en: 'Ask architectural decisions, trade-offs, and leadership questions for 8+ years experience.',
            de: 'Stellen Sie Fragen zu Architekturentscheidungen und Führung für 8+ Jahre Erfahrung.'
        }
    }
};

// Technical sub-topics
export const TECHNICAL_TOPICS = {
    JAVA_CORE: {
        id: 'java_core',
        labels: { en: 'Java Core', de: 'Java Grundlagen' },
        icon: 'code-slash-outline',
        keywords: ['OOP', 'Collections', 'Exceptions', 'Generics', 'Streams']
    },
    SPRING_BOOT: {
        id: 'spring_boot',
        labels: { en: 'Spring Boot', de: 'Spring Boot' },
        icon: 'leaf-outline',
        keywords: ['Dependency Injection', 'Beans', 'Configuration', 'Annotations']
    },
    JPA_HIBERNATE: {
        id: 'jpa_hibernate',
        labels: { en: 'JPA / Hibernate', de: 'JPA / Hibernate' },
        icon: 'server-outline',
        keywords: ['Entities', 'Transactions', 'Lazy Loading', 'Caching']
    },
    REST_API: {
        id: 'rest_api',
        labels: { en: 'REST API & HTTP', de: 'REST API & HTTP' },
        icon: 'globe-outline',
        keywords: ['HTTP Methods', 'Status Codes', 'Headers', 'Authentication']
    },
    MICROSERVICES: {
        id: 'microservices',
        labels: { en: 'Microservices', de: 'Microservices' },
        icon: 'git-network-outline',
        keywords: ['Service Discovery', 'API Gateway', 'Circuit Breaker', 'Saga']
    },
    CONCURRENCY: {
        id: 'concurrency',
        labels: { en: 'Concurrency', de: 'Nebenläufigkeit' },
        icon: 'git-branch-outline',
        keywords: ['Threads', 'Locks', 'ExecutorService', 'CompletableFuture']
    },
    SQL: {
        id: 'sql',
        labels: { en: 'SQL & Databases', de: 'SQL & Datenbanken' },
        icon: 'library-outline',
        keywords: ['Joins', 'Indexes', 'Query Optimization', 'Transactions']
    },
    DEVOPS: {
        id: 'devops',
        labels: { en: 'CI/CD & DevOps', de: 'CI/CD & DevOps' },
        icon: 'rocket-outline',
        keywords: ['Docker', 'Kubernetes', 'Jenkins', 'Testing']
    },
    REACT_NATIVE: {
        id: 'react_native',
        labels: { en: 'React Native', de: 'React Native' },
        icon: 'phone-portrait-outline',
        keywords: ['Components', 'Hooks', 'Navigation', 'State Management']
    }
};

// System Design topics
export const SYSTEM_DESIGN_TOPICS = {
    ARCHITECTURE: {
        id: 'architecture',
        labels: { en: 'High-level Architecture', de: 'High-Level Architektur' },
        icon: 'business-outline'
    },
    DATABASES: {
        id: 'databases',
        labels: { en: 'Databases & Storage', de: 'Datenbanken & Speicher' },
        icon: 'server-outline'
    },
    CACHING: {
        id: 'caching',
        labels: { en: 'Caching Strategies', de: 'Caching-Strategien' },
        icon: 'flash-outline'
    },
    SCALABILITY: {
        id: 'scalability',
        labels: { en: 'Scalability', de: 'Skalierbarkeit' },
        icon: 'trending-up-outline'
    },
    MESSAGING: {
        id: 'messaging',
        labels: { en: 'Messaging & Events', de: 'Messaging & Events' },
        icon: 'mail-outline'
    },
    API_GATEWAY: {
        id: 'api_gateway',
        labels: { en: 'API Gateway', de: 'API Gateway' },
        icon: 'swap-horizontal-outline'
    }
};

// HR/Behavioral topics
export const HR_TOPICS = {
    MOTIVATION: {
        id: 'motivation',
        labels: { en: 'Motivation & Background', de: 'Motivation & Hintergrund' },
        icon: 'heart-outline'
    },
    CONFLICT: {
        id: 'conflict',
        labels: { en: 'Conflict Resolution', de: 'Konfliktlösung' },
        icon: 'hand-left-outline'
    },
    OWNERSHIP: {
        id: 'ownership',
        labels: { en: 'Ownership & Accountability', de: 'Verantwortung & Rechenschaft' },
        icon: 'flag-outline'
    },
    COMMUNICATION: {
        id: 'communication',
        labels: { en: 'Communication Style', de: 'Kommunikationsstil' },
        icon: 'chatbubbles-outline'
    },
    ADAPTABILITY: {
        id: 'adaptability',
        labels: { en: 'Adaptability', de: 'Anpassungsfähigkeit' },
        icon: 'sync-outline'
    }
};

// Leadership topics
export const LEADERSHIP_TOPICS = {
    MENTORING: {
        id: 'mentoring',
        labels: { en: 'Mentoring Developers', de: 'Entwickler Mentoring' },
        icon: 'people-outline'
    },
    DECISIONS: {
        id: 'decisions',
        labels: { en: 'Architectural Decisions', de: 'Architekturentscheidungen' },
        icon: 'git-compare-outline'
    },
    ALIGNMENT: {
        id: 'alignment',
        labels: { en: 'Cross-team Alignment', de: 'Teamübergreifende Abstimmung' },
        icon: 'link-outline'
    },
    PRESSURE: {
        id: 'pressure',
        labels: { en: 'Handling Pressure', de: 'Umgang mit Druck' },
        icon: 'timer-outline'
    }
};

// Case Study topics
export const CASE_STUDY_TOPICS = {
    REQUIREMENTS: {
        id: 'requirements',
        labels: { en: 'Requirement Clarification', de: 'Anforderungsklärung' },
        icon: 'document-text-outline'
    },
    EDGE_CASES: {
        id: 'edge_cases',
        labels: { en: 'Edge Case Reasoning', de: 'Edge-Case Analyse' },
        icon: 'warning-outline'
    },
    RISK_ANALYSIS: {
        id: 'risk_analysis',
        labels: { en: 'Risk/Impact Analysis', de: 'Risiko/Auswirkungsanalyse' },
        icon: 'analytics-outline'
    },
    BUSINESS_CONTEXT: {
        id: 'business_context',
        labels: { en: 'Business Context', de: 'Geschäftskontext' },
        icon: 'briefcase-outline'
    }
};

// Main interview categories
export const INTERVIEW_CATEGORIES = {
    HR_BEHAVIORAL: {
        id: 'hr',
        labels: { en: 'HR / Behavioral', de: 'HR / Verhaltens' },
        icon: 'people-outline',
        color: '#4CAF50',
        topics: HR_TOPICS,
        description: {
            en: 'Practice answering questions about your background, motivation, and soft skills.',
            de: 'Üben Sie Fragen zu Ihrem Hintergrund, Ihrer Motivation und Soft Skills.'
        },
        systemPrompt: (lang, topic, difficulty) => lang === 'de'
            ? `Sie sind ein professioneller HR-Interviewer, der ein Verhaltensinterview führt.
${topic ? `Schwerpunkt: ${topic.labels.de}` : ''}
${difficulty.promptModifier.de}

REGELN:
1. Stellen Sie EINE Frage auf einmal
2. Warten Sie auf die Antwort des Kandidaten
3. Bleiben Sie professionell und freundlich
4. Beantworten Sie niemals Ihre eigenen Fragen
5. Verwenden Sie die STAR-Methode wenn angemessen

Bei Antwort "Feedback" → Geben Sie strukturierte Bewertung. SEIEN SIE STRENG. Geben Sie niedrige Punktzahlen (0-30) für kurze, faule Antworten.
Bei Antwort "Weiter" → Stellen Sie die nächste Frage`
            : `You are a professional HR interviewer conducting a behavioral interview.
${topic ? `Focus area: ${topic.labels.en}` : ''}
${difficulty.promptModifier.en}

RULES:
1. Ask ONE question at a time
2. Wait for the candidate's answer
3. Stay professional and friendly
4. Never answer your own questions
5. Use STAR method when appropriate

On "Feedback" → Provide structured evaluation. BE STRICT. Give low scores (0-30) for short, lazy, or irrelevant answers (e.g., "yes", "no", "idk").
On "Next" → Ask the next question`
    },

    TECHNICAL: {
        id: 'technical',
        labels: { en: 'Technical Interview', de: 'Technisches Interview' },
        icon: 'code-outline',
        color: '#2196F3',
        topics: TECHNICAL_TOPICS,
        description: {
            en: 'Practice technical questions about programming, frameworks, and best practices.',
            de: 'Üben Sie technische Fragen zu Programmierung, Frameworks und Best Practices.'
        },
        systemPrompt: (lang, topic, difficulty) => lang === 'de'
            ? `Sie sind ein erfahrener technischer Interviewer.
${topic ? `Thema: ${topic.labels.de} (${topic.keywords?.join(', ') || ''})` : ''}
${difficulty.promptModifier.de}

REGELN:
1. Stellen Sie EINE technische Frage auf einmal
2. Fragen Sie nach Code-Beispielen oder Erklärungen wenn nötig
3. Haken Sie bei unvollständigen Antworten nach
4. Bewerten Sie sowohl Wissen als auch Problemlösungsfähigkeit
5. Beantworten Sie niemals Ihre eigenen Fragen

Bei "Feedback" → Bewerten Sie technische Tiefe und Genauigkeit. SEIEN SIE STRENG.
Bei "Weiter" → Stellen Sie die nächste Frage zum Thema`
            : `You are an experienced technical interviewer.
${topic ? `Topic: ${topic.labels.en} (${topic.keywords?.join(', ') || ''})` : ''}
${difficulty.promptModifier.en}

RULES:
1. Ask ONE technical question at a time
2. Ask for code examples or explanations when appropriate
3. Follow up on incomplete answers
4. Evaluate both knowledge and problem-solving ability
5. Never answer your own questions

On "Feedback" → Evaluate technical depth and accuracy. BE STRICT. Give low scores for vague or incorrect answers.
On "Next" → Ask the next question on this topic`
    },

    SYSTEM_DESIGN: {
        id: 'system_design',
        labels: { en: 'System Design', de: 'System Design' },
        icon: 'git-network-outline',
        color: '#9C27B0',
        topics: SYSTEM_DESIGN_TOPICS,
        description: {
            en: 'Practice designing scalable systems and discussing architectural trade-offs.',
            de: 'Üben Sie das Entwerfen skalierbarer Systeme und diskutieren Sie architektonische Trade-offs.'
        },
        systemPrompt: (lang, topic, difficulty) => lang === 'de'
            ? `Sie sind ein System Design Interviewer für Senior-Positionen.
${topic ? `Fokus: ${topic.labels.de}` : ''}
${difficulty.promptModifier.de}

REGELN:
1. Beginnen Sie mit einem offenen Design-Problem
2. Lassen Sie den Kandidaten Anforderungen klären
3. Fragen Sie nach spezifischen Komponenten und Trade-offs
4. Diskutieren Sie Skalierbarkeit und Fehlertoleranz
5. Beantworten Sie niemals Ihre eigenen Fragen

Bei "Feedback" → Bewerten Sie die Architekturentscheidungen. SEIEN SIE STRENG.
Bei "Weiter" → Stellen Sie die nächste Frage`
            : `You are a System Design interviewer for senior positions.
${topic ? `Focus: ${topic.labels.en}` : ''}
${difficulty.promptModifier.en}

RULES:
1. Start with an open-ended design problem
2. Let the candidate clarify requirements
3. Ask about specific components and trade-offs
4. Discuss scalability and fault tolerance
5. Never answer your own questions

On "Feedback" → Evaluate architectural decisions. BE STRICT.
On "Next" → Ask the next question

Example problems: Design Twitter/Uber/Netflix (simplified based on experience level)`
    },

    CASE_STUDY: {
        id: 'case_study',
        labels: { en: 'Case Study', de: 'Fallstudie' },
        icon: 'bulb-outline',
        color: '#FF9800',
        topics: CASE_STUDY_TOPICS,
        description: {
            en: 'Practice analyzing business problems and proposing solutions.',
            de: 'Üben Sie die Analyse von Geschäftsproblemen und das Vorschlagen von Lösungen.'
        },
        systemPrompt: (lang, topic, difficulty) => lang === 'de'
            ? `Sie sind ein Case Study Interviewer.
${topic ? `Fokus: ${topic.labels.de}` : ''}
${difficulty.promptModifier.de}

REGELN:
1. Präsentieren Sie ein realistisches Geschäftsszenario
2. Lassen Sie den Kandidaten klärende Fragen stellen
3. Bewerten Sie strukturiertes Denken
4. Fragen Sie nach Edge-Cases und Risiken
5. Beantworten Sie niemals Ihre eigenen Fragen

Bei "Feedback" → Bewerten Sie die Analyse und Lösungsvorschläge.
Bei "Weiter" → Stellen Sie die nächste Frage`
            : `You are a Case Study interviewer.
${topic ? `Focus: ${topic.labels.en}` : ''}
${difficulty.promptModifier.en}

RULES:
1. Present a realistic business scenario
2. Let the candidate ask clarifying questions
3. Evaluate structured thinking
4. Ask about edge cases and risks
5. Never answer your own questions

On "Feedback" → Evaluate analysis and proposed solutions.
On "Next" → Ask the next question`
    },

    LEADERSHIP: {
        id: 'leadership',
        labels: { en: 'Leadership', de: 'Führung' },
        icon: 'shield-outline',
        color: '#E91E63',
        topics: LEADERSHIP_TOPICS,
        description: {
            en: 'Practice leadership and management interview questions.',
            de: 'Üben Sie Führungs- und Management-Interviewfragen.'
        },
        systemPrompt: (lang, topic, difficulty) => lang === 'de'
            ? `Sie sind ein Leadership Interviewer für Senior/Lead-Positionen.
${topic ? `Fokus: ${topic.labels.de}` : ''}
${difficulty.promptModifier.de}

REGELN:
1. Fragen Sie nach konkreten Führungserfahrungen
2. Bewerten Sie Entscheidungsfindung und Teamführung
3. Fragen Sie nach schwierigen Situationen und deren Lösung
4. Beantworten Sie niemals Ihre eigenen Fragen

Bei "Feedback" bewerten Sie Führungsqualitäten und Reife.
Bei "Weiter" stellen Sie die nächste Frage.`
            : `You are a Leadership interviewer for senior/lead positions.
${topic ? `Focus: ${topic.labels.en}` : ''}
${difficulty.promptModifier.en}

RULES:
1. Ask about concrete leadership experiences
2. Evaluate decision-making and team management
3. Ask about difficult situations and resolutions
4. Never answer your own questions

On "Feedback" evaluate leadership qualities and maturity.
On "Next" ask the next question.`
    },

    EMAIL_WRITING: {
        id: 'email_writing',
        labels: { en: 'Email Writing', de: 'E-Mail Schreiben' },
        icon: 'mail-outline',
        color: '#00BCD4',
        topics: null,
        description: {
            en: 'Practice writing professional business emails.',
            de: 'Üben Sie das Schreiben professioneller Geschäfts-E-Mails.'
        },
        systemPrompt: (lang, _, difficulty) => lang === 'de'
            ? `Sie sind ein Business-Kommunikationscoach, der dem Benutzer hilft, professionelle E-Mails auf Deutsch zu schreiben.
${difficulty.promptModifier.de}

REGELN:
1. Geben Sie ein E-Mail-Szenario vor (z.B. Beschwerde, Anfrage, Follow-up, Entschuldigung)
2. Lassen Sie den Benutzer die E-Mail schreiben
3. Korrigieren Sie Ton, Formalität und Grammatik
4. Erklären Sie geschäftliche Formulierungen

Bei "Feedback" bewerten Sie die E-Mail-Qualität.
Bei "Weiter" geben Sie ein neues E-Mail-Szenario.`
            : `You are a business communication coach helping the user write professional emails in English.
${difficulty.promptModifier.en}

RULES:
1. Present an email scenario (e.g., complaint, inquiry, follow-up, apology, request)
2. Let the user write the email
3. Correct tone, formality, and grammar
4. Teach professional business phrases

On "Feedback" evaluate the email quality.
On "Next" give a new email scenario.`
    },

    OFFICE_JARGON: {
        id: 'office_jargon',
        labels: { en: 'Office Jargon', de: 'Bürojargon' },
        icon: 'business-outline',
        color: '#FF5722',
        topics: null,
        description: {
            en: 'Learn corporate speak and business buzzwords.',
            de: 'Lernen Sie Unternehmensjargon und Business-Buzzwords.'
        },
        systemPrompt: (lang, _, difficulty) => lang === 'de'
            ? `Sie sind ein Kollege in einem modernen Tech-Unternehmen, der viel Firmenjargon verwendet.
${difficulty.promptModifier.de}

STIL:
- Verwenden Sie Buzzwords wie: Synergien, Bandwidth, Deep Dive, Circle back, Touch base, Action items, Leverage, Low-hanging fruit
- Führen Sie ein Arbeitsgespräch mit vielen dieser Phrasen
- Erklären Sie Jargon wenn der Benutzer fragt

Bei "Feedback" erklären Sie alle verwendeten Begriffe.
Bei "Weiter" setzen Sie das Gespräch fort.`
            : `You are a colleague at a modern tech company who uses lots of corporate jargon.
${difficulty.promptModifier.en}

STYLE:
- Use buzzwords like: synergy, bandwidth, deep dive, circle back, touch base, action items, leverage, low-hanging fruit, move the needle, boil the ocean
- Have a work conversation packed with these phrases
- Explain jargon when the user asks

On "Feedback" explain all terms used.
On "Next" continue the conversation.`
    },

    MIXED_MODE: {
        id: 'mixed',
        labels: { en: 'Mixed Mode', de: 'Gemischter Modus' },
        icon: 'shuffle-outline',
        color: '#607D8B',
        topics: null,
        description: {
            en: 'Complete interview simulation covering HR, Technical, System Design, and Leadership.',
            de: 'Komplette Interviewsimulation mit HR, Technik, System Design und Führung.'
        },
        flow: ['HR_BEHAVIORAL', 'TECHNICAL', 'SYSTEM_DESIGN', 'LEADERSHIP', 'CASE_STUDY'],
        questionsPerCategory: { HR_BEHAVIORAL: 2, TECHNICAL: 3, SYSTEM_DESIGN: 2, LEADERSHIP: 2, CASE_STUDY: 1 }
    },

    FULL_SIMULATION: {
        id: 'full_sim',
        labels: { en: 'Full Simulation', de: 'Vollständige Simulation' },
        icon: 'play-circle-outline',
        color: '#795548',
        topics: null,
        description: {
            en: 'Realistic end-to-end interview experience with a virtual recruiter.',
            de: 'Realistische End-to-End Interviewerfahrung mit virtuellem Recruiter.'
        },
        systemPrompt: (lang, _, difficulty) => lang === 'de'
            ? `Sie sind ein erfahrener Tech-Recruiter, der ein vollständiges Vorstellungsgespräch führt.
${difficulty.promptModifier.de}

Beginnen Sie mit einer freundlichen Begrüßung und führen Sie durch:
1. Kurze Vorstellung und Warmup
2. Hintergrund und Motivation (2-3 Fragen)
3. Technische Fragen (3-4 Fragen)
4. Situative Fragen (2 Fragen)
5. Fragen des Kandidaten an Sie
6. Abschluss und nächste Schritte

Bleiben Sie professionell aber freundlich. Beantworten Sie niemals Ihre eigenen Fragen.

Bei "Feedback" geben Sie eine umfassende Bewertung.
Bei "Weiter" fahren Sie mit dem nächsten Schritt fort.`
            : `You are an experienced tech recruiter conducting a complete job interview.
${difficulty.promptModifier.en}

Start with a friendly greeting and guide through:
1. Brief introduction and warmup
2. Background and motivation (2-3 questions)
3. Technical questions (3-4 questions)
4. Situational questions (2 questions)
5. Candidate questions for you
6. Closing and next steps

Stay professional but friendly. Never answer your own questions.

On "Feedback" provide a comprehensive evaluation.
On "Next" proceed to the next step.`
    }
};

// Helper to get localized label - handles both original format (labels) and saved format (label)
export const getLabel = (item, langCode) => {
    if (!item) return '';
    // Original format: item.labels.en/de
    if (item.labels) {
        return item.labels[langCode] || item.labels.en || '';
    }
    // Saved progress format: item.label (string)
    if (item.label) {
        return item.label;
    }
    // Last resort: use id if available
    return item.id || '';
};

// Helper to get all topics for a category as array
export const getTopicsArray = (category, langCode) => {
    if (!category?.topics) return [];
    return Object.values(category.topics).map(topic => ({
        ...topic,
        label: getLabel(topic, langCode)
    }));
};

// Helper to get all categories as array
export const getCategoriesArray = (langCode) => {
    return Object.values(INTERVIEW_CATEGORIES).map(cat => ({
        ...cat,
        label: getLabel(cat, langCode),
        descriptionText: cat.description?.[langCode] || cat.description?.en || ''
    }));
};

// Helper to get all difficulties as array
export const getDifficultiesArray = (langCode) => {
    return Object.values(DIFFICULTY_LEVELS).map(diff => ({
        ...diff,
        label: getLabel(diff, langCode)
    }));
};

export const LANGUAGES = {
    en: { code: 'en', name: 'English', flag: '🇬🇧' },
    es: { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    fr: { code: 'fr', name: 'French', flag: '🇫🇷' },
    de: { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    it: { code: 'it', name: 'Italian', flag: '🇮🇹' },
    pt: { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    tr: { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    ja: { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    ko: { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    zh: { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    ru: { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    ar: { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    hi: { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
};

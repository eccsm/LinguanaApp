/**
 * Available languages for native language selection
 * These are languages users might speak as their mother tongue
 */
export const AVAILABLE_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

/**
 * Get language details by language code
 * @param {string} code - Language code (e.g., 'es', 'fr')
 * @returns {object|null} Language object or null if not found
 */
export const getLanguageByCode = (code) => {
    return AVAILABLE_LANGUAGES.find(lang => lang.code === code) || null;
};

/**
 * Get display name for a language (combines flag + name)
 * @param {string} code - Language code
 * @returns {string} Display name with flag
 */
export const getLanguageDisplayName = (code) => {
    const language = getLanguageByCode(code);
    return language ? `${language.flag} ${language.name}` : 'Unknown';
};

/**
 * Get native name for a language (combines flag + native name)
 * @param {string} code - Language code
 * @returns {string} Native name with flag
 */
export const getLanguageNativeName = (code) => {
    const language = getLanguageByCode(code);
    return language ? `${language.flag} ${language.nativeName}` : 'Unknown';
};

/**
 * Utility helper functions
 */

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'Never';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

/**
 * Format timestamp to readable time
 */
export const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Never';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(timestamp);
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  // Support international characters (Turkish ı, ö, ç, ş, İ, etc.)
  // This regex supports Unicode characters in the local part and domain
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
  return emailRegex.test(email);
};

/**
 * Calculate streak status
 */
export const getStreakStatus = (lastPracticeDate) => {
  if (!lastPracticeDate) return 'start';

  const lastDate = lastPracticeDate.toDate ? lastPracticeDate.toDate() : new Date(lastPracticeDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastDate) / 86400000);

  if (diffDays === 0) return 'active'; // Practiced today
  if (diffDays === 1) return 'continue'; // Can continue streak
  return 'broken'; // Streak broken
};

/**
 * Get greeting based on time of day
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Calculate usage percentage
 */
export const calculateUsagePercentage = (current, limit) => {
  if (limit === 0) return 0;
  return Math.min((current / limit) * 100, 100);
};

/**
 * Get language flag emoji
 */
export const getLanguageFlag = (languageCode) => {
  const flags = {
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇵🇹',
    ja: '🇯🇵',
    ko: '🇰🇷',
    zh: '🇨🇳'
  };
  return flags[languageCode] || '🌍';
};

/**
 * Parse correction from AI response
 */
export const parseCorrection = (message) => {
  const correctionMarkers = ['✅ Corrección:', '✅ Correction:', '✅ 訂正:', '✅ 수정:'];

  for (const marker of correctionMarkers) {
    if (message.includes(marker)) {
      const parts = message.split(marker);
      return {
        response: parts[0].trim(),
        correction: parts[1].trim()
      };
    }
  }

  return {
    response: message,
    correction: null
  };
};

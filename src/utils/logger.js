/**
 * Production-Ready Logger with Firebase Crashlytics
 * 
 * Like Log4j in Spring Boot:
 * - Logs are NEVER shown to users (no red error boxes)
 * - Developers can trace logs in console/remote services
 * - User-facing errors are handled separately via Alerts
 * - Errors automatically sent to Firebase Crashlytics for tracking
 * 
 * Usage:
 * import Logger from '../utils/logger';
 * 
 * Logger.debug('Debug message');
 * Logger.info('User signed in', { userId: '123' });
 * Logger.warn('API rate limit approaching');
 * Logger.error('Sign-in failed', error);
 */

import crashlytics from '@react-native-firebase/crashlytics';

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

class AppLogger {
    constructor() {
        // In production, only show errors
        // In development, show everything
        this.currentLevel = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
        this.enableConsole = true;
        this.crashlyticsEnabled = true;
        this.currentCategory = null;
    }

    /**
     * Format log message with timestamp, level, and optional category
     */
    formatMessage(level, category, ...args) {
        const timestamp = new Date().toISOString();
        const categoryTag = category ? `[${category}]` : '';
        return [`[${timestamp}] [${level}]${categoryTag}`, ...args];
    }

    /**
     * Internal log method
     * IMPORTANT: Always uses console.log (never console.error)
     * This prevents React Native red error boxes from appearing
     */
    _log(level, category, ...args) {
        if (this.enableConsole) {
            const formattedMessage = this.formatMessage(level, category, ...args);
            // ALWAYS use console.log to avoid red error boxes
            console.log(...formattedMessage);
        }

        // Send to Firebase Crashlytics
        this._sendToCrashlytics(level, category, args);
    }

    /**
     * Send logs to Firebase Crashlytics
     */
    _sendToCrashlytics(level, category, args) {
        if (!this.crashlyticsEnabled) return;

        try {
            // Convert args to string for logging
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');

            const categoryTag = category ? `[${category}]` : '';
            const fullMessage = `[${level}]${categoryTag} ${message}`;

            // Log to Crashlytics
            crashlytics().log(fullMessage);

            // For errors, also record the error
            if (level === 'ERROR') {
                const error = args.find(arg => arg instanceof Error);
                if (error) {
                    crashlytics().recordError(error);
                } else {
                    // Create a custom error for non-Error objects
                    crashlytics().recordError(new Error(fullMessage));
                }
            }
        } catch (error) {
            // Silently fail - don't break app if Crashlytics fails
            console.log('Failed to send to Crashlytics:', error);
        }
    }

    /**
     * Set user ID for Crashlytics tracking
     */
    setUserId(userId) {
        try {
            if (this.crashlyticsEnabled && userId) {
                crashlytics().setUserId(userId);
            }
        } catch (error) {
            console.log('Failed to set Crashlytics user ID:', error);
        }
    }

    /**
     * Set custom attributes for Crashlytics
     */
    setAttribute(key, value) {
        try {
            if (this.crashlyticsEnabled) {
                crashlytics().setAttribute(key, String(value));
            }
        } catch (error) {
            console.log('Failed to set Crashlytics attribute:', error);
        }
    }

    /**
     * Set multiple custom attributes at once
     */
    setAttributes(attributes) {
        try {
            if (this.crashlyticsEnabled && typeof attributes === 'object') {
                Object.entries(attributes).forEach(([key, value]) => {
                    crashlytics().setAttribute(key, String(value));
                });
            }
        } catch (error) {
            console.log('Failed to set Crashlytics attributes:', error);
        }
    }

    /**
     * Record a breadcrumb for tracking user journey
     */
    breadcrumb(message, data = {}) {
        try {
            const breadcrumbMsg = typeof data === 'object' && Object.keys(data).length > 0
                ? `${message} | ${JSON.stringify(data)}`
                : message;

            if (this.crashlyticsEnabled) {
                crashlytics().log(`[BREADCRUMB] ${breadcrumbMsg}`);
            }

            if (this.enableConsole && __DEV__) {
                console.log(`🍞 [BREADCRUMB] ${breadcrumbMsg}`);
            }
        } catch (error) {
            console.log('Failed to record breadcrumb:', error);
        }
    }

    /**
     * Set a custom key for better crash tracking
     */
    setCustomKey(key, value) {
        try {
            if (this.crashlyticsEnabled) {
                // Firebase Crashlytics supports custom keys for better filtering
                crashlytics().setAttribute(key, String(value));
            }
        } catch (error) {
            console.log('Failed to set custom key:', error);
        }
    }

    /**
     * Debug level - detailed information for debugging
     */
    debug(...args) {
        if (this.currentLevel <= LOG_LEVELS.DEBUG) {
            this._log('DEBUG', this.currentCategory, ...args);
        }
    }

    /**
     * Info level - general information
     */
    info(...args) {
        if (this.currentLevel <= LOG_LEVELS.INFO) {
            this._log('INFO', this.currentCategory, ...args);
        }
    }

    /**
     * Log level - alias for info
     */
    log(...args) {
        this.info(...args);
    }

    /**
     * Warn level - warnings
     */
    warn(...args) {
        if (this.currentLevel <= LOG_LEVELS.WARN) {
            this._log('WARN', this.currentCategory, ...args);
        }
    }

    /**
     * Error level - errors and exceptions
     * IMPORTANT: This does NOT show red boxes to users
     * It logs to console and sends to Crashlytics
     */
    error(...args) {
        if (this.currentLevel <= LOG_LEVELS.ERROR) {
            this._log('ERROR', this.currentCategory, ...args);
        }
    }

    /**
     * Create a visual divider in logs
     */
    divider(title = '') {
        const line = '═'.repeat(60);
        const message = title ? `${line}\n  ${title}\n${line}` : line;

        if (this.enableConsole) {
            console.log(message);
        }

        if (this.crashlyticsEnabled) {
            try {
                crashlytics().log(message);
            } catch (error) {
                console.log('Failed to log divider to Crashlytics:', error);
            }
        }
    }

    /**
     * Start a new section with a category
     */
    startSection(category, description = '') {
        this.currentCategory = category;
        const title = description ? `${category}: ${description}` : category;
        this.divider(`▶ START: ${title}`);
        this.breadcrumb(`Section started: ${category}`, { description });
    }

    /**
     * End the current section
     */
    endSection(category = null) {
        const sectionName = category || this.currentCategory || 'Section';
        this.divider(`◀ END: ${sectionName}`);
        this.breadcrumb(`Section ended: ${sectionName}`);
        this.currentCategory = null;
    }

    /**
     * Log with a specific category (without changing current category)
     */
    withCategory(category) {
        return {
            debug: (...args) => {
                if (this.currentLevel <= LOG_LEVELS.DEBUG) {
                    this._log('DEBUG', category, ...args);
                }
            },
            info: (...args) => {
                if (this.currentLevel <= LOG_LEVELS.INFO) {
                    this._log('INFO', category, ...args);
                }
            },
            warn: (...args) => {
                if (this.currentLevel <= LOG_LEVELS.WARN) {
                    this._log('WARN', category, ...args);
                }
            },
            error: (...args) => {
                if (this.currentLevel <= LOG_LEVELS.ERROR) {
                    this._log('ERROR', category, ...args);
                }
            }
        };
    }

    /**
     * Disable Crashlytics reporting
     */
    disableCrashlytics() {
        this.crashlyticsEnabled = false;
        crashlytics().setCrashlyticsCollectionEnabled(false);
    }

    /**
     * Enable Crashlytics reporting
     */
    enableCrashlytics() {
        this.crashlyticsEnabled = true;
        crashlytics().setCrashlyticsCollectionEnabled(true);
    }

    /**
     * Disable console output
     */
    disableConsole() {
        this.enableConsole = false;
    }

    /**
     * Enable console output
     */
    enableConsoleOutput() {
        this.enableConsole = true;
    }

    /**
     * Set the minimum log level
     */
    setLevel(level) {
        this.currentLevel = level;
    }
}

// Export singleton instance
const Logger = new AppLogger();

export default Logger;
export { LOG_LEVELS };

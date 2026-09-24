/**
 * Haptic Feedback Utility
 * Provides tactile feedback for user interactions
 */

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Haptic options
const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Light tap feedback - for button presses, selections
 */
export const lightImpact = () => {
  ReactNativeHapticFeedback.trigger('impactLight', options);
};

/**
 * Medium tap feedback - for confirmations, card flips
 */
export const mediumImpact = () => {
  ReactNativeHapticFeedback.trigger('impactMedium', options);
};

/**
 * Heavy tap feedback - for important actions, achievements
 */
export const heavyImpact = () => {
  ReactNativeHapticFeedback.trigger('impactHeavy', options);
};

/**
 * Success feedback - for correct answers, completions
 */
export const success = () => {
  ReactNativeHapticFeedback.trigger('notificationSuccess', options);
};

/**
 * Warning feedback - for almost there, close calls
 */
export const warning = () => {
  ReactNativeHapticFeedback.trigger('notificationWarning', options);
};

/**
 * Error feedback - for wrong answers, failures
 */
export const error = () => {
  ReactNativeHapticFeedback.trigger('notificationError', options);
};

/**
 * Selection feedback - for scrolling through options
 */
export const selection = () => {
  ReactNativeHapticFeedback.trigger('selection', options);
};

/**
 * Rigid feedback - for reaching limits, boundaries
 */
export const rigid = () => {
  ReactNativeHapticFeedback.trigger('rigid', options);
};

/**
 * Soft feedback - for subtle interactions
 */
export const soft = () => {
  ReactNativeHapticFeedback.trigger('soft', options);
};

/**
 * Clock tick - for timer countdown
 */
export const clockTick = () => {
  ReactNativeHapticFeedback.trigger('clockTick', options);
};

export default {
  light: lightImpact,
  medium: mediumImpact,
  heavy: heavyImpact,
  success,
  warning,
  error,
  selection,
  rigid,
  soft,
  clockTick,
};

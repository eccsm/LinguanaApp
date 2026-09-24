import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  Keyboard,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BlurView } from '@react-native-community/blur';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '../contexts/AlertContext';
import { isValidEmail } from '../utils/helpers';
import Logger from '../utils/logger';
import firebaseService from '../services/firebaseService';

// Create dedicated logger for auth operations
const AuthLogger = Logger.withCategory('AUTH');

// Password strength analyzer
const analyzePassword = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'`~]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;

  let strength = 'weak';
  let color = '#EF4444'; // Red
  let percentage = 20;

  if (passedChecks >= 5) {
    strength = 'strong';
    color = '#10B981'; // Green
    percentage = 100;
  } else if (passedChecks >= 4) {
    strength = 'good';
    color = '#F59E0B'; // Yellow
    percentage = 75;
  } else if (passedChecks >= 3) {
    strength = 'fair';
    color = '#F97316'; // Orange
    percentage = 50;
  }

  return { checks, strength, color, percentage, passedChecks };
};

// Password Strength Indicator Component
const PasswordStrengthIndicator = ({ password }) => {
  const analysis = useMemo(() => analyzePassword(password), [password]);
  const { checks, strength, color, percentage } = analysis;

  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: percentage,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  if (!password) return null;

  return (
    <View style={strengthStyles.container}>
      {/* Strength Bar */}
      <View style={strengthStyles.barContainer}>
        <Animated.View
          style={[
            strengthStyles.bar,
            {
              backgroundColor: color,
              width: barWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              })
            }
          ]}
        />
      </View>

      {/* Strength Label */}
      <View style={strengthStyles.labelRow}>
        <Text style={[strengthStyles.label, { color }]}>
          {strength === 'weak' && '🔓 Weak'}
          {strength === 'fair' && '🔐 Fair'}
          {strength === 'good' && '🔒 Good'}
          {strength === 'strong' && '🛡️ Strong'}
        </Text>
      </View>

      {/* Requirements */}
      <View style={strengthStyles.requirements}>
        <View style={strengthStyles.reqRow}>
          <Text style={[strengthStyles.reqItem, checks.length && strengthStyles.reqPassed]}>
            {checks.length ? '✓' : '○'} 8+ characters
          </Text>
          <Text style={[strengthStyles.reqItem, checks.uppercase && strengthStyles.reqPassed]}>
            {checks.uppercase ? '✓' : '○'} Uppercase
          </Text>
        </View>
        <View style={strengthStyles.reqRow}>
          <Text style={[strengthStyles.reqItem, checks.number && strengthStyles.reqPassed]}>
            {checks.number ? '✓' : '○'} Number
          </Text>
          <Text style={[strengthStyles.reqItem, checks.special && strengthStyles.reqPassed]}>
            {checks.special ? '✓' : '○'} Special (!@#$)
          </Text>
        </View>
      </View>
    </View>
  );
};

const strengthStyles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },
  barContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  requirements: {
    marginTop: 8,
  },
  reqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  reqItem: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    flex: 1,
  },
  reqPassed: {
    color: '#10B981',
  },
});

const AuthScreen = ({ navigation }) => {
  const { signIn, signUp, signInWithGoogle, signInWithApple, signInWithFacebook, resetPassword } = useApp();
  const { showAlert } = useAlert();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false); // NEW: Email form collapsed by default
  const keyboardShift = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current; // For form expansion animation

  // Animated values for floating background blobs
  const blob1Anim = useRef(new Animated.Value(0)).current;
  const blob2Anim = useRef(new Animated.Value(0)).current;

  // Animate background blobs
  useEffect(() => {
    const animateBlobs = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(blob1Anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
            Animated.timing(blob1Anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(blob2Anim, { toValue: 1, duration: 5000, useNativeDriver: true }),
            Animated.timing(blob2Anim, { toValue: 0, duration: 5000, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    animateBlobs();
  }, [blob1Anim, blob2Anim]);

  // Toggle email form with animation
  const toggleEmailForm = () => {
    const toValue = showEmailForm ? 0 : 1;
    setShowEmailForm(!showEmailForm);
    Animated.spring(formAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false, // height animation can't use native driver
    }).start();
  };

  useEffect(() => {
    // Track screen view
    Logger.breadcrumb('AuthScreen opened');

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event) => {
      const keyboardHeight = event?.endCoordinates?.height ?? 0;
      const shiftValue = -Math.min(keyboardHeight * 0.85, 320);
      const duration = Platform.OS === 'ios' ? event?.duration ?? 260 : 220;

      Animated.timing(keyboardShift, {
        toValue: shiftValue,
        duration,
        useNativeDriver: true,
      }).start();

      setIsKeyboardVisible(true);
    };

    const handleKeyboardHide = (event) => {
      const duration = Platform.OS === 'ios' ? event?.duration ?? 200 : 200;

      Animated.timing(keyboardShift, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start();

      setIsKeyboardVisible(false);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardShift]);

  const handleAuth = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    if (isSignUp) {
      // Check password complexity for signup
      const analysis = analyzePassword(password);

      if (!analysis.checks.length) {
        showAlert('Weak Password', 'Password must be at least 8 characters long');
        return;
      }

      if (!analysis.checks.uppercase) {
        showAlert('Weak Password', 'Password must contain at least one uppercase letter');
        return;
      }

      if (!analysis.checks.special) {
        showAlert('Weak Password', 'Password must contain at least one special character (!@#$%^&*)');
        return;
      }

      if (analysis.passedChecks < 4) {
        showAlert('Weak Password', 'Please create a stronger password with uppercase, numbers, and special characters');
        return;
      }

      if (!displayName) {
        showAlert('Error', 'Please enter your name');
        return;
      }

      // Check if email already exists
      setCheckingEmail(true);
      try {
        const existingUser = await firebaseService.findUserByEmail(email);
        if (existingUser) {
          setCheckingEmail(false);
          showAlert(
            'Email Already Registered',
            'An account with this email already exists. Would you like to sign in instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign In', onPress: () => setIsSignUp(false) }
            ]
          );
          return;
        }
      } catch (error) {
        AuthLogger.error('Email check error:', error);
        // Continue with signup even if check fails
      }
      setCheckingEmail(false);
    } else {
      // For sign in, just check minimum length
      if (password.length < 6) {
        showAlert('Error', 'Password must be at least 6 characters');
        return;
      }
    }

    const authType = isSignUp ? 'signup' : 'signin';
    Logger.breadcrumb(`Email ${authType} attempt`, { email: email.replace(/(.{2}).*(@.*)/, '$1***$2') });
    AuthLogger.info(`Starting email ${authType}...`);

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
        Logger.breadcrumb('Email signup successful');
        AuthLogger.info('✅ User signed up successfully');
        // Show welcome message for new users
        showAlert('Welcome to Linguana! 🦎', 'Your account is ready. Let\'s start learning!');
      } else {
        await signIn(email, password);
        Logger.breadcrumb('Email signin successful');
        AuthLogger.info('✅ User signed in successfully');
      }
      // Navigation handled automatically by App.tsx conditional rendering
    } catch (error) {
      Logger.breadcrumb(`Email ${authType} failed`, { errorCode: error.code });
      AuthLogger.error(`❌ ${authType} failed:`, error.message, { code: error.code });

      let errorMessage = error.message || 'An error occurred. Please try again.';

      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        showAlert(
          'Email Already Registered',
          'An account with this email already exists. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => setIsSignUp(false) }
          ]
        );
        return;
      }

      showAlert('Authentication Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Logger.breadcrumb('Google sign-in attempt');
    AuthLogger.info('Starting Google sign-in...');

    setLoading(true);
    try {
      await signInWithGoogle();
      Logger.breadcrumb('Google sign-in successful');
      AuthLogger.info('✅ Google sign-in successful');
      // Navigation handled automatically by App.tsx conditional rendering
    } catch (error) {
      Logger.breadcrumb('Google sign-in failed', { errorCode: error.code });
      AuthLogger.error('❌ Google sign-in failed:', error.message, { code: error.code });
      showAlert('Error', 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    Logger.breadcrumb('Apple sign-in attempt');
    AuthLogger.info('Starting Apple sign-in...');

    setLoading(true);
    try {
      await signInWithApple();
      Logger.breadcrumb('Apple sign-in successful');
      AuthLogger.info('✅ Apple sign-in successful');
      // Navigation handled automatically by App.tsx conditional rendering
    } catch (error) {
      Logger.breadcrumb('Apple sign-in failed', { errorCode: error.code });
      AuthLogger.error('❌ Apple sign-in failed:', error.message, { code: error.code });
      showAlert('Error', 'Failed to sign in with Apple. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    Logger.breadcrumb('Facebook sign-in attempt');
    AuthLogger.info('Starting Facebook sign-in...');

    setLoading(true);
    try {
      await signInWithFacebook();
      Logger.breadcrumb('Facebook sign-in successful');
      AuthLogger.info('✅ Facebook sign-in successful');
      // Navigation handled automatically by App.tsx conditional rendering
    } catch (error) {
      Logger.breadcrumb('Facebook sign-in failed', { errorCode: error.code });
      AuthLogger.error('❌ Facebook sign-in failed:', error.message, { code: error.code });
      showAlert('Error', 'Failed to sign in with Facebook. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Logger.breadcrumb('Password reset flow started');
    setResetEmail(email);
    setShowForgotPassword(true);
  };

  const handleSendResetEmail = async () => {
    if (!resetEmail) {
      showAlert('Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(resetEmail)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    Logger.breadcrumb('Password reset email requested', { email: resetEmail.replace(/(.{2}).*(@.*)/, '$1***$2') });
    AuthLogger.info('Sending password reset email...');

    setLoading(true);
    try {
      await resetPassword(resetEmail);
      Logger.breadcrumb('Password reset email sent');
      AuthLogger.info('✅ Password reset email sent successfully');
      showAlert(
        'Success',
        'Password reset email sent! Please check your inbox.',
        [{
          text: 'OK',
          onPress: () => {
            setShowForgotPassword(false);
            setResetEmail('');
          }
        }]
      );
    } catch (error) {
      Logger.breadcrumb('Password reset failed', { errorCode: error.code });
      AuthLogger.error('❌ Password reset failed:', error.message, { code: error.code });

      let errorMessage = 'Failed to send password reset email. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }

      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      {/* Animated Gradient Background Layers */}
      <View style={styles.gradientBase} />
      <Animated.View
        style={[
          styles.gradientOverlay1,
          {
            transform: [
              { translateX: blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 25] }) },
              { translateY: blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
            ]
          }
        ]}
      />
      <Animated.View
        style={[
          styles.gradientOverlay2,
          {
            transform: [
              { translateX: blob2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
              { translateY: blob2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) },
            ]
          }
        ]}
      />
      <Animated.View
        style={[
          styles.gradientOverlay3,
          {
            transform: [
              { translateX: blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
              { translateY: blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
            ]
          }
        ]}
      />
      <Animated.View
        style={[
          styles.gradientOverlay4,
          {
            transform: [
              { translateX: blob2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
              { translateY: blob2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
            ]
          }
        ]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isKeyboardVisible && styles.scrollContentKeyboard]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.authWrapper,
              isKeyboardVisible && styles.authWrapperKeyboard,
              { transform: [{ translateY: keyboardShift }] }
            ]}
          >
            {/* Header */}
            <View style={styles.authHeader}>
              <Image
                source={require('../../assets/images/linguana_auth_screen.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.authTitle}>LINGUANA</Text>
              <Text style={styles.authSubtitle}>
                Sign in or create an account
              </Text>
            </View>

            {/* Form */}
            <View style={styles.authForm}>
              {/* Social Sign In Buttons - WITH GLASSMORPHISM */}
              <View style={styles.socialRow}>
                {/* Google Button */}
                <TouchableOpacity
                  style={styles.glassButton}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {Platform.OS === 'ios' ? (
                    <BlurView
                      style={styles.glassBlur}
                      blurType="light"
                      blurAmount={20}
                      reducedTransparencyFallbackColor="white"
                    />
                  ) : null}
                  <View style={styles.glassOverlay} />
                  <View style={styles.glassBorder} />
                  <View style={styles.glassContent}>
                    <Image
                      source={require('../../assets/images/google.png')}
                      style={styles.socialIcon}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>

                {/* Apple Sign-In - iOS only */}
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.glassButton}
                    onPress={handleAppleSignIn}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <BlurView
                      style={styles.glassBlur}
                      blurType="light"
                      blurAmount={20}
                      reducedTransparencyFallbackColor="white"
                    />
                    <View style={styles.glassOverlay} />
                    <View style={styles.glassBorder} />
                    <View style={styles.glassContent}>
                      <Image
                        source={require('../../assets/images/apple.png')}
                        style={styles.socialIcon}
                        resizeMode="contain"
                      />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Meta/Facebook Button */}
                <TouchableOpacity
                  style={styles.glassButton}
                  onPress={handleFacebookSignIn}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {Platform.OS === 'ios' ? (
                    <BlurView
                      style={styles.glassBlur}
                      blurType="light"
                      blurAmount={20}
                      reducedTransparencyFallbackColor="white"
                    />
                  ) : null}
                  <View style={styles.glassOverlay} />
                  <View style={styles.glassBorder} />
                  <View style={styles.glassContent}>
                    <Image
                      source={require('../../assets/images/meta_icon.png')}
                      style={styles.socialIcon}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>

                {/* Email Button - Opens form */}
                <TouchableOpacity
                  style={[styles.glassButton, showEmailForm && styles.glassButtonActive]}
                  onPress={toggleEmailForm}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {Platform.OS === 'ios' ? (
                    <BlurView
                      style={styles.glassBlur}
                      blurType="light"
                      blurAmount={20}
                      reducedTransparencyFallbackColor="white"
                    />
                  ) : null}
                  <View style={[styles.glassOverlay, showEmailForm && styles.glassOverlayActive]} />
                  <View style={[styles.glassBorder, showEmailForm && styles.glassBorderActive]} />
                  <View style={styles.glassContent}>
                    <Icon name="email-outline" size={24} color={showEmailForm ? '#8a46ff' : '#6B7280'} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Collapsible Email Form */}
              <Animated.View
                style={[
                  styles.emailFormContainer,
                  {
                    maxHeight: formAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 400], // Enough for signup form
                    }),
                    opacity: formAnim,
                    marginTop: formAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 20],
                    }),
                  },
                ]}
              >
                {!showForgotPassword ? (
                  // Login/Signup Form
                  <>
                    {isSignUp && (
                      <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Your Name</Text>
                        <TextInput
                          style={styles.fieldInput}
                          placeholder="John Doe"
                          placeholderTextColor="rgba(243, 230, 255, 0.7)"
                          value={displayName}
                          onChangeText={setDisplayName}
                          autoCapitalize="words"
                        />
                      </View>
                    )}

                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Email Address</Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="you@example.com"
                        placeholderTextColor="rgba(243, 230, 255, 0.7)"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Password</Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="••••••••"
                        placeholderTextColor="rgba(243, 230, 255, 0.7)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                      {isSignUp && <PasswordStrengthIndicator password={password} />}
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleAuth}
                      disabled={loading || checkingEmail}
                      activeOpacity={0.8}
                    >
                      {(loading || checkingEmail) ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {isSignUp ? 'Create Account' : 'Sign In'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Sign Up / Sign In Toggle */}
                    <TouchableOpacity
                      style={styles.toggleButton}
                      onPress={() => setIsSignUp(!isSignUp)}
                      disabled={loading}
                    >
                      <Text style={styles.toggleButtonText}>
                        {isSignUp
                          ? 'Already have an account? Sign In'
                          : "Don't have an account? Sign Up"}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Forgot Password Form
                  <>
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Email Address</Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="you@example.com"
                        placeholderTextColor="rgba(243, 230, 255, 0.7)"
                        value={resetEmail}
                        onChangeText={setResetEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleSendResetEmail}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                      )}
                    </TouchableOpacity>

                    {/* Back to Sign In */}
                    <TouchableOpacity
                      style={styles.toggleButton}
                      onPress={() => {
                        setShowForgotPassword(false);
                        setResetEmail('');
                      }}
                      disabled={loading}
                    >
                      <Text style={styles.toggleButtonText}>
                        Back to Sign In
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            </View>

            {/* Footer */}
            {!showForgotPassword && (
              <View style={styles.authFooter}>
                <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
                  <Text style={styles.footerLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3d2f9b', // Base purple
  },
  gradientBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8e52f2',
  },
  gradientOverlay1: {
    position: 'absolute',
    top: '-20%',
    left: '-20%',
    width: '60%',
    height: '60%',
    borderRadius: 9999,
    backgroundColor: 'rgba(200, 155, 255, 0.45)',
  },
  gradientOverlay2: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: '50%',
    height: '50%',
    borderRadius: 9999,
    backgroundColor: 'rgba(148, 109, 255, 0.28)',
  },
  gradientOverlay3: {
    position: 'absolute',
    bottom: '-10%',
    left: '-10%',
    width: '60%',
    height: '60%',
    borderRadius: 9999,
    backgroundColor: 'rgba(197, 107, 229, 0.35)',
  },
  gradientOverlay4: {
    position: 'absolute',
    bottom: '-15%',
    right: '-15%',
    width: '70%',
    height: '70%',
    borderRadius: 9999,
    backgroundColor: 'rgba(50, 70, 200, 0.32)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  scrollContentKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 24,
    paddingBottom: 180,
  },
  authWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  authWrapperKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 0,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  authSubtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#e3d7ff',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  authForm: {
    marginTop: 22,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#e3d7ff',
    marginBottom: 6,
  },
  fieldInput: {
    width: '100%',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#FFFFFF',
    fontSize: 14,
  },
  primaryButton: {
    width: '100%',
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: '#8a46ff',
    padding: 13,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#e3d7ff',
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#e3d7ff',
    textAlign: 'center',
    flexShrink: 0,
    minWidth: 120,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  // Circular Glass Button Styles
  glassButton: {
    width: 64,
    height: 64,
    borderRadius: 32, // Perfect circle
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible', // Don't clip shadow on Android
    position: 'relative',
    // Shadow for depth
    shadowColor: '#6A11CB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Android needs background for elevation
  },
  glassBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'ios'
      ? 'rgba(255, 255, 255, 0.25)'  // More transparent on iOS (blur does the work)
      : 'rgba(255, 255, 255, 0.75)', // Semi-transparent on Android
    borderRadius: 32,
  },
  glassOverlayActive: {
    backgroundColor: Platform.OS === 'ios'
      ? 'rgba(138, 70, 255, 0.35)'  // Purple tint when active
      : 'rgba(138, 70, 255, 0.25)',
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  glassBorderActive: {
    borderColor: '#8a46ff',
    borderWidth: 2.5,
  },
  glassContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  glassButtonActive: {
    transform: [{ scale: 1.05 }], // Slightly larger when active
  },
  socialIcon: {
    width: 28,
    height: 28,
  },
  emailFormContainer: {
    overflow: 'hidden',
  },
  socialIconText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1877f2',
  },
  authFooter: {
    alignItems: 'center',
    marginTop: 4,
  },
  footerLink: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default AuthScreen;

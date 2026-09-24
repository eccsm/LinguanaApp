import React, { useState, useEffect } from 'react';
import { LogBox } from 'react-native';

// Suppress React Native Firebase deprecated API warnings
// TODO: Migrate to modular API in future (getApp() instead of firebase())
LogBox.ignoreLogs([
  'This method is deprecated',
  'as well as all React Native Firebase namespaced API',
]);
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppProvider, useApp } from './src/contexts/AppContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AlertProvider } from './src/contexts/AlertContext';
import { WalkthroughProvider } from './src/contexts/WalkthroughContext';
import WalkthroughOverlay from './src/components/WalkthroughOverlay';
import NoInternetModal from './src/components/NoInternetModal';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import ReviewSessionScreen from './src/screens/ReviewSessionScreen';
import SessionCompleteScreen from './src/screens/SessionCompleteScreen';
import DailyGameScreen from './src/screens/DailyGameScreen';
import WeeklyGameScreen from './src/screens/WeeklyGameScreen';
import InterviewSetupScreen from './src/screens/InterviewSetupScreen';
import InterviewScreen from './src/screens/InterviewScreen';
import LanguageSelectionModal from './src/components/LanguageSelectionModal';
import StreakRepairModal from './src/components/StreakRepairModal';
import Logger from './src/utils/logger';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import ShopScreen from './src/screens/ShopScreen';
import LeagueScreen from './src/screens/LeagueScreen';
import SpeedSwipeScreen from './src/screens/SpeedSwipeScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import LeaderboardsScreen from './src/screens/LeaderboardsScreen';

const Stack = createStackNavigator();

// Initialize Google Mobile Ads SDK with test device configuration
const initializeAds = async () => {
  try {
    // Configure test device IDs for development
    if (__DEV__) {
      await mobileAds().setRequestConfiguration({
        // Add your test device ID here
        testDeviceIdentifiers: ['9D96CA3CADDE4ECC5FAD71ED733EE72A', 'EMULATOR'],
        // Maximum ad content rating
        maxAdContentRating: MaxAdContentRating.PG,
        // Optional: enforce child-directed treatment
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });
      Logger.info('[ADMOB] Test device configuration set');
    }

    // Initialize the SDK
    const adapterStatuses = await mobileAds().initialize();
    Logger.info('[ADMOB] Initialization complete:', adapterStatuses);
  } catch (error) {
    Logger.error('[ADMOB] Initialization failed:', error);
  }
};

initializeAds();

const AppNavigator = () => {
  const { user, loading, userProfile, stats } = useApp();
  const { colors } = useTheme();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showStreakRepairModal, setShowStreakRepairModal] = useState(false);
  const [brokenStreakValue, setBrokenStreakValue] = useState(0);

  useEffect(() => {
    if (user && userProfile) {
      if (userProfile.preferredLanguage === null || userProfile.preferredLanguage === undefined) {
        setShowLanguageModal(true);
      } else {
        setShowLanguageModal(false);
      }

      // Check for broken streak
      if (stats?.isStreakBroken && stats?.brokenStreakValue > 0) {
        setBrokenStreakValue(stats.brokenStreakValue);
        setShowStreakRepairModal(true);
      }
    } else {
      setShowLanguageModal(false);
    }
  }, [user, userProfile, stats]);

  if (loading) {
    return null;
  }

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          cardStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        {!user ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                title: '',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ReviewSession"
              component={ReviewSessionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DailyGame"
              component={DailyGameScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="WeeklyGame"
              component={WeeklyGameScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SessionComplete"
              component={SessionCompleteScreen}
              options={{
                headerShown: false,
                presentation: 'card',
                cardStyleInterpolator: ({ current: { progress } }) => ({
                  cardStyle: {
                    opacity: progress,
                  },
                }),
              }}
            />
            <Stack.Screen
              name="Shop"
              component={ShopScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InterviewSetup"
              component={InterviewSetupScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Interview"
              component={InterviewScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="League"
              component={LeagueScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SpeedSwipe"
              component={SpeedSwipeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Inventory"
              component={InventoryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Leaderboards"
              component={LeaderboardsScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
      <LanguageSelectionModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
      <StreakRepairModal
        visible={showStreakRepairModal}
        brokenStreak={brokenStreakValue}
        onClose={() => setShowStreakRepairModal(false)}
        onRepair={(streak: number) => {
          Logger.info('[STREAK] Repaired streak:', streak);
          setShowStreakRepairModal(false);
        }}
        onAcceptDefeat={() => {
          Logger.info('[STREAK] User accepted defeat');
          setShowStreakRepairModal(false);
        }}
      />
      <WalkthroughOverlay />
      <NoInternetModal />
    </>
  );
};



// Main App Component
const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertProvider>
          <AppProvider>
            <WalkthroughProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </WalkthroughProvider>
          </AppProvider>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;

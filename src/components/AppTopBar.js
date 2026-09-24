import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GemBadge, StreakBadge } from './HeaderBadges';
import { useTheme } from '../contexts/ThemeContext';
import Haptics from '../utils/haptics';

/**
 * AppTopBar - Consistent top bar for all screens
 * Shows: Back button (optional), Gems, Streak, Shop shortcut
 * 
 * Props:
 * - showBackButton: boolean (default: true)
 * - onBack: function (optional, defaults to navigation.goBack)
 * - showShop: boolean (default: true)
 * - showGems: boolean (default: true)
 * - showStreak: boolean (default: true)
 * - transparent: boolean (default: false)
 * - onStreakPress: function (optional)
 */
const AppTopBar = ({
    showBackButton = true,
    onBack,
    showShop = false,
    showGems = true,
    showStreak = true,
    transparent = false,
    onStreakPress,
}) => {
    const navigation = useNavigation();
    const { colors, isDarkMode } = useTheme();

    const handleBack = () => {
        Haptics.light();
        if (onBack) {
            onBack();
        } else {
            navigation.goBack();
        }
    };

    const handleShopPress = () => {
        Haptics.light();
        navigation.navigate('Shop');
    };

    return (
        <View style={[
            styles.container,
            !transparent && { backgroundColor: isDarkMode ? colors.background : colors.background },
        ]}>
            {/* Left Section - Back Button */}
            <View style={styles.leftSection}>
                {showBackButton && (
                    <TouchableOpacity
                        onPress={handleBack}
                        style={[styles.backButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    >
                        <Icon name="arrow-left" size={22} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Right Section - Badges */}
            <View style={styles.rightSection}>
                {showGems && <GemBadge onPress={handleShopPress} />}
                {showStreak && <StreakBadge onPress={onStreakPress} />}
                {showShop && (
                    <TouchableOpacity
                        onPress={handleShopPress}
                        style={[styles.shopButton, { backgroundColor: isDarkMode ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)' }]}
                    >
                        <Icon name="cart" size={18} color="#8B5CF6" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
        paddingBottom: 8,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shopButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AppTopBar;

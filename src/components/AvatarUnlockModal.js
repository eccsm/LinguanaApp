import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';

const AvatarUnlockModal = ({ visible, onClose, avatar, onGoToShop }) => {
    const { colors, isDarkMode } = useTheme();

    if (!avatar) return null;

    // Avatar Categories
    const SHOP_AVATARS = ['avatar_gecko', 'avatar_chameleon', 'avatar_chatters'];
    const RARE_AVATARS = ['avatar_axolotl', 'avatar_dictionary', 'avatar_fn_lizard', 'avatar_speedy'];
    const LEGENDARY_AVATARS = ['avatar_dragon', 'avatar_mascott', 'avatar_monitor'];

    const isShopAvatar = SHOP_AVATARS.includes(avatar.id);
    const isRare = RARE_AVATARS.includes(avatar.id);
    const isLegendary = LEGENDARY_AVATARS.includes(avatar.id);

    let sourceText = "Mystery Eggs";
    let subText = "Visit the Shop to get Mystery Eggs and try your luck!";
    let iconName = "egg-easter";

    if (isShopAvatar) {
        sourceText = "Shop";
        subText = "Visit the Shop to purchase it.";
        iconName = "store";
    } else if (isRare) {
        sourceText = "Standard Eggs";
        subText = "Found exclusively in Standard Eggs!";
    } else if (isLegendary) {
        sourceText = "Standard & Royal Eggs";
        subText = "Found in both Standard and Royal Eggs!";
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF' }]}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Icon name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Header Image */}
                    <View style={styles.imageContainer}>
                        <LinearGradient
                            colors={['#FFD700', '#FFA000']}
                            style={styles.imageBackground}
                        >
                            <Image
                                source={avatar.image}
                                style={styles.avatarImage}
                                resizeMode="contain"
                            />
                            <View style={styles.lockBadge}>
                                <Icon name="lock" size={20} color="#FFF" />
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Content */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        Unlock {avatar.name}
                    </Text>

                    {isShopAvatar ? (
                        <>
                            <Text style={[styles.description, { color: colors.textSecondary }]}>
                                This avatar is available directly in the <Text style={{ fontWeight: 'bold', color: '#F59E0B' }}>Shop</Text>!
                            </Text>

                            <View style={styles.eggPreview}>
                                <Icon name="store" size={40} color="#F59E0B" />
                                <Icon name="arrow-right" size={24} color={colors.textSecondary} />
                                <Image
                                    source={avatar.image}
                                    style={{ width: 40, height: 40, borderRadius: 20 }}
                                />
                            </View>

                            <Text style={[styles.subDescription, { color: colors.textSecondary }]}>
                                Visit the Shop to purchase it.
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.description, { color: colors.textSecondary }]}>
                                This exclusive avatar can be found inside <Text style={{ fontWeight: 'bold', color: '#F59E0B' }}>{sourceText}</Text>!
                            </Text>

                            <View style={styles.eggPreview}>
                                <Icon name="egg-easter" size={40} color="#F59E0B" />
                                <Icon name="arrow-right" size={24} color={colors.textSecondary} />
                                <Image
                                    source={avatar.image}
                                    style={{ width: 40, height: 40, borderRadius: 20 }}
                                />
                            </View>

                            <Text style={[styles.subDescription, { color: colors.textSecondary }]}>
                                {subText}
                            </Text>
                        </>
                    )}

                    {/* Action Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            onClose();
                            onGoToShop();
                        }}
                    >
                        <LinearGradient
                            colors={['#F59E0B', '#D97706']}
                            style={styles.buttonGradient}
                        >
                            <Icon name="basket" size={24} color="#FFF" />
                            <Text style={styles.buttonText}>Go to Shop</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 8,
    },
    imageContainer: {
        marginTop: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    imageBackground: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    avatarImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    lockBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#EF4444',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    eggPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
        padding: 16,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 16,
    },
    subDescription: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
        opacity: 0.8,
    },
    actionButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
});

export default AvatarUnlockModal;

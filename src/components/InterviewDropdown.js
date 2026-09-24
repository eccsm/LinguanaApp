import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const InterviewDropdown = ({
    label,
    value,
    options,
    onSelect,
    placeholder,
    disabled = false,
    isOpen: controlledIsOpen,
    onToggle
}) => {
    const { colors, isDarkMode } = useTheme();
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    // Support both controlled and uncontrolled modes
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

    const selectedOption = options?.find(opt => opt.id === value);

    const handleSelect = (option) => {
        console.log('[InterviewDropdown] Item selected:', option.id);
        onSelect(option.id);
        if (onToggle) {
            onToggle(false);
        } else {
            setInternalIsOpen(false);
        }
    };

    const handleDropdownPress = () => {
        console.log('[InterviewDropdown] Dropdown pressed');
        if (!disabled) {
            if (onToggle) {
                onToggle(!isOpen);
            } else {
                setInternalIsOpen(!isOpen);
            }
        }
    };

    return (
        <View style={[styles.container, { zIndex: isOpen ? 1000 : 1 }]}>
            {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}

            <TouchableOpacity
                style={[
                    styles.dropdown,
                    {
                        backgroundColor: isDarkMode ? colors.surfaceElevated : '#f5f5f5',
                        borderColor: isOpen ? colors.primary : (disabled ? colors.border : colors.primary),
                        opacity: disabled ? 0.5 : 1
                    }
                ]}
                onPress={handleDropdownPress}
                activeOpacity={disabled ? 1 : 0.7}
            >
                {selectedOption?.icon && (
                    <View style={[styles.iconContainer, { backgroundColor: (selectedOption.color || colors.primary) + '20' }]}>
                        <Icon name={selectedOption.icon} size={20} color={selectedOption.color || colors.primary} />
                    </View>
                )}
                <Text
                    style={[
                        styles.selectedText,
                        { color: selectedOption ? colors.text : colors.textSecondary }
                    ]}
                    numberOfLines={1}
                >
                    {selectedOption?.label || placeholder || 'Select...'}
                </Text>
                <Icon
                    name={isOpen ? "chevron-up-outline" : "chevron-down-outline"}
                    size={20}
                    color={colors.textSecondary}
                />
            </TouchableOpacity>

            {/* Dropdown Options - renders inline below the button */}
            {isOpen && (
                <View style={[
                    styles.optionsContainer,
                    {
                        backgroundColor: isDarkMode ? colors.surfaceElevated : '#fff',
                        borderColor: colors.border
                    }
                ]}>
                    <ScrollView
                        style={styles.optionsScroll}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                    >
                        {options?.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.optionItem,
                                    {
                                        backgroundColor: item.id === value
                                            ? (item.color || colors.primary) + '15'
                                            : 'transparent',
                                        borderBottomColor: index < options.length - 1 ? colors.border : 'transparent'
                                    }
                                ]}
                                onPress={() => handleSelect(item)}
                            >
                                {item.icon && (
                                    <View style={[styles.optionIcon, { backgroundColor: (item.color || colors.primary) + '20' }]}>
                                        <Icon name={item.icon} size={20} color={item.color || colors.primary} />
                                    </View>
                                )}
                                <View style={styles.optionTextContainer}>
                                    <Text style={[styles.optionText, { color: colors.text }]}>{item.label}</Text>
                                    {item.descriptionText && (
                                        <Text style={[styles.optionDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                                            {item.descriptionText}
                                        </Text>
                                    )}
                                </View>
                                {item.id === value && (
                                    <Icon name="checkmark-circle" size={20} color={item.color || colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        position: 'relative',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    selectedText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    optionsContainer: {
        // Changed from absolute to inline to avoid clipping in ScrollView
        marginTop: 4,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    optionsScroll: {
        // No maxHeight - show all options inline
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    optionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionText: {
        fontSize: 15,
        fontWeight: '500',
    },
    optionDescription: {
        fontSize: 12,
        marginTop: 2,
    },
});

export default InterviewDropdown;

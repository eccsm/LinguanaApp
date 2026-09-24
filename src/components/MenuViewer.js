import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

const MenuViewer = ({ visible, onClose, menuType, language, onSelectItem }) => {
    const { colors, isDarkMode } = useTheme();

    // Dynamic styles based on theme
    const dynamicStyles = {
        content: {
            backgroundColor: colors.background,
        },
        title: {
            color: colors.text,
        },
        categoryTitle: {
            color: colors.primary,
        },
        menuItem: {
            backgroundColor: isDarkMode ? colors.surfaceElevated : '#f8f9fa',
        },
        itemName: {
            color: colors.text,
        },
        itemDesc: {
            color: colors.textSecondary,
        },
        itemPrice: {
            color: colors.primary,
        },
        sectionTitle: {
            color: colors.text,
        },
        infoBox: {
            backgroundColor: isDarkMode ? 'rgba(255, 152, 0, 0.15)' : '#fff3e0',
        },
        infoText: {
            color: isDarkMode ? '#ffb74d' : '#e65100',
        },
        reservationCard: {
            backgroundColor: isDarkMode ? 'rgba(76, 175, 80, 0.15)' : '#e8f5e9',
            borderColor: isDarkMode ? '#66bb6a' : '#4caf50',
        },
        reservationText: {
            color: isDarkMode ? '#81c784' : '#2e7d32',
        },
        flightCard: {
            backgroundColor: isDarkMode ? colors.surfaceElevated : '#f8f9fa',
            borderColor: isDarkMode ? colors.border : '#e0e0e0',
        },
        boardingPass: {
            backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.15)' : '#fff8e1',
            borderColor: isDarkMode ? '#ffd54f' : '#ffc107',
        },
        phraseCard: {
            backgroundColor: isDarkMode ? colors.surfaceElevated : '#f0f0f0',
        },
        phraseText: {
            color: colors.text,
        },
    };

    // Helper to get dynamic dates
    const getDynamicDates = () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        const formatDate = (date, code) => {
            const months = {
                tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
                en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
                fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
                de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
                it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
                pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
                ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
                ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
                ru: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
            };
            const monthNames = months[code] || months.en;
            return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        };

        return {
            today: formatDate(today, language.code),
            tomorrow: formatDate(tomorrow, language.code),
            dayAfter: formatDate(dayAfter, language.code)
        };
    };

    // Icon mapping for menu items
    const getIconForItem = (iconEmoji, category) => {
        const iconMap = {
            // Food & Drinks
            '☕': 'cafe-outline',
            '🍵': 'cafe-outline',
            '🥐': 'restaurant-outline',
            '🍰': 'ice-cream-outline',
            '🥪': 'fast-food-outline',
            '🍽️': 'restaurant-outline',
            '🍷': 'wine-outline',
            '🍺': 'beer-outline',
            '🥗': 'leaf-outline',
            '🍕': 'pizza-outline',
            '🍔': 'fast-food-outline',
            '🍟': 'fast-food-outline',
            '🥤': 'cafe-outline',
            // Clothing
            '👕': 'shirt-outline',
            '👖': 'body-outline',
            '👗': 'woman-outline',
            '👟': 'footsteps-outline',
            '🧥': 'shirt-outline',
            '👜': 'bag-outline',
            '🥾': 'footsteps-outline',
            '🔗': 'link-outline',
            // Hotel
            '🛏️': 'bed-outline',
            '🏨': 'business-outline',
            '✨': 'sparkles-outline',
            '🍽️': 'restaurant-outline',
            '💪': 'fitness-outline',
            '💆': 'body-outline',
            '🅿️': 'car-outline',
            // Directions
            '📍': 'location-outline',
            '🎯': 'navigate-outline',
            '🏪': 'storefront-outline',
            '🏛️': 'business-outline',
            '⛪': 'business-outline',
            '🏥': 'medical-outline',
            '🏦': 'business-outline',
            // Airport
            '✈️': 'airplane-outline',
            '🚪': 'enter-outline',
            '📅': 'calendar-outline',
            '⏰': 'time-outline',
            '🎫': 'ticket-outline',
            '📝': 'document-text-outline',
        };
        return iconMap[iconEmoji] || 'ellipse-outline';
    };

    // Get menu data based on type
    const getMenuData = () => {
        const dates = getDynamicDates();

        switch (menuType) {
            case 'cafe':
                const { CAFE_MENUS } = require('../constants/cafeMenus');
                return CAFE_MENUS[language.code];
            case 'restaurant':
                const { RESTAURANT_MENUS } = require('../constants/restaurantMenus');
                return RESTAURANT_MENUS[language.code];
            case 'shopping':
                const { SHOPPING_CATALOGS } = require('../constants/shoppingCatalogs');
                return SHOPPING_CATALOGS[language.code];
            case 'hotel':
                const { HOTEL_INFO } = require('../constants/hotelInfo');
                const hotelData = HOTEL_INFO[language.code];
                if (hotelData?.sampleReservation) {
                    hotelData.sampleReservation.checkIn = dates.today;
                    hotelData.sampleReservation.checkOut = dates.dayAfter;
                }
                return hotelData;
            case 'airport':
                const { AIRPORT_INFO } = require('../constants/airportInfo');
                const airportData = AIRPORT_INFO[language.code];
                if (airportData?.sampleFlight) {
                    airportData.sampleFlight.departure.date = dates.today;
                    airportData.sampleFlight.arrival.date = dates.today;
                }
                return airportData;
            case 'directions':
                const { DIRECTIONS_MAPS } = require('../constants/directionsMap');
                return DIRECTIONS_MAPS[language.code];
            default:
                return null;
        }
    };

    const menuData = getMenuData();
    if (!menuData) return null;

    const handleItemPress = (itemName) => {
        if (onSelectItem) onSelectItem(itemName);
        onClose();
    };

    // Render Shopping Catalog
    const renderShopping = () => {
        if (menuData.items) {
            const { currency, items } = menuData;
            return (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.titleRow}>
                        <Icon name="bag-handle-outline" size={28} color={colors.primary} />
                        <Text style={[styles.title, dynamicStyles.title]}>CATALOG</Text>
                    </View>
                    {items.map((item, i) => (
                        <TouchableOpacity key={i} style={[styles.menuItem, dynamicStyles.menuItem]} onPress={() => handleItemPress(item.name)}>
                            <View style={styles.itemLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                    <Icon name={getIconForItem(item.icon)} size={24} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemName, dynamicStyles.itemName]}>{item.name}</Text>
                                    <Text style={[styles.itemDesc, dynamicStyles.itemDesc]}>{item.category}</Text>
                                    <Text style={[styles.itemDesc, dynamicStyles.itemDesc]}>Sizes: {item.sizes?.join(', ')}</Text>
                                    <Text style={[styles.itemDesc, dynamicStyles.itemDesc]}>Colors: {item.colors?.join(', ')}</Text>
                                </View>
                            </View>
                            <Text style={[styles.itemPrice, dynamicStyles.itemPrice]}>{currency}{item.price}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            );
        } else if (menuData.categories) {
            const { storeName, categories } = menuData;
            return (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.titleRow}>
                        <Icon name="bag-handle-outline" size={28} color={colors.primary} />
                        <Text style={[styles.title, dynamicStyles.title]}>{storeName || 'STORE'}</Text>
                    </View>
                    {Object.keys(categories).map((cat, idx) => (
                        <View key={idx} style={styles.category}>
                            <Text style={[styles.categoryTitle, dynamicStyles.categoryTitle]}>{cat}</Text>
                            {categories[cat].map((item, i) => (
                                <TouchableOpacity key={i} style={[styles.menuItem, dynamicStyles.menuItem]} onPress={() => handleItemPress(item.name)}>
                                    <View style={styles.itemLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                            <Icon name={getIconForItem(item.icon)} size={24} color={colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.itemName, dynamicStyles.itemName]}>{item.name}</Text>
                                            {item.size && <Text style={[styles.itemDesc, dynamicStyles.itemDesc]}>Size: {item.size}</Text>}
                                        </View>
                                    </View>
                                    <Text style={[styles.itemPrice, dynamicStyles.itemPrice]}>{item.price}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            );
        }
        return null;
    };

    // Render Hotel Info
    const renderHotel = () => {
        const { hotelName, roomTypes, checkInTime, checkOutTime, amenities, facilities, sampleReservation, location } = menuData;

        const rooms = roomTypes || [];
        const checkIn = checkInTime || menuData.checkIn;
        const checkOut = checkOutTime || menuData.checkOut;
        const hotelAmenities = amenities || (facilities ? facilities.map(f => f.name) : []);

        return (
            <ScrollView style={styles.scrollView}>
                <View style={styles.titleRow}>
                    <Icon name="business-outline" size={28} color={colors.primary} />
                    <Text style={[styles.title, dynamicStyles.title]}>{hotelName}</Text>
                </View>
                {location && <Text style={[styles.hotelLocation, dynamicStyles.itemDesc]}><Icon name="location-outline" size={14} color={colors.textSecondary} /> {location}</Text>}

                <View style={styles.sectionHeader}>
                    <Icon name="bed-outline" size={20} color={colors.text} />
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Room Types</Text>
                </View>
                {rooms.map((room, i) => (
                    <TouchableOpacity key={i} style={[styles.roomCard, dynamicStyles.menuItem]} onPress={() => handleItemPress(room.name || room.type)}>
                        <View style={styles.roomHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                <Icon name={getIconForItem(room.icon)} size={24} color={colors.primary} />
                            </View>
                            <Text style={[styles.roomName, dynamicStyles.itemName]}>{room.name || room.type}</Text>
                            <Text style={[styles.roomPrice, dynamicStyles.itemPrice]}>
                                {menuData.currency || ''}{room.price}
                            </Text>
                        </View>
                        <View style={styles.roomFeatures}>
                            {room.features?.map((f, j) => (
                                <Text key={j} style={[styles.featureTag, { backgroundColor: colors.primary + '15', color: colors.primary }]}>{f}</Text>
                            ))}
                            {room.amenities && <Text style={[styles.featureTag, { backgroundColor: colors.primary + '15', color: colors.primary }]}>{room.amenities}</Text>}
                        </View>
                    </TouchableOpacity>
                ))}

                {hotelAmenities.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Icon name="sparkles-outline" size={20} color={colors.text} />
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Amenities</Text>
                        </View>
                        <View style={styles.amenitiesRow}>
                            {hotelAmenities.map((a, i) => (
                                <Text key={i} style={[styles.amenityTag, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#f0f0f0', color: colors.text }]}>{a}</Text>
                            ))}
                        </View>
                    </>
                )}

                <View style={[styles.infoBox, dynamicStyles.infoBox]}>
                    <View style={styles.infoRow}>
                        <Icon name="enter-outline" size={18} color={dynamicStyles.infoText.color} />
                        <Text style={[styles.infoText, dynamicStyles.infoText]}>Check-in: {checkIn}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="exit-outline" size={18} color={dynamicStyles.infoText.color} />
                        <Text style={[styles.infoText, dynamicStyles.infoText]}>Check-out: {checkOut}</Text>
                    </View>
                </View>

                {sampleReservation && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Icon name="document-text-outline" size={20} color={colors.text} />
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Your Reservation</Text>
                        </View>
                        <View style={[styles.reservationCard, dynamicStyles.reservationCard]}>
                            <Text style={[styles.reservationText, dynamicStyles.reservationText]}>Confirmation: {sampleReservation.confirmationNumber}</Text>
                            <Text style={[styles.reservationText, dynamicStyles.reservationText]}>Guest: {sampleReservation.guestName}</Text>
                            <Text style={[styles.reservationText, dynamicStyles.reservationText]}>Room: {sampleReservation.roomType}</Text>
                            <Text style={[styles.reservationText, dynamicStyles.reservationText]}>Check-in: {sampleReservation.checkIn}</Text>
                            <Text style={[styles.reservationText, dynamicStyles.reservationText]}>Check-out: {sampleReservation.checkOut}</Text>
                            <Text style={[styles.reservationText, dynamicStyles.reservationText]}>Nights: {sampleReservation.nights}</Text>
                        </View>
                    </>
                )}
            </ScrollView>
        );
    };

    // Render Airport Info
    const renderAirport = () => {
        const { airportName, sampleFlight, commonPhrases } = menuData;

        if (!sampleFlight) {
            return (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.titleRow}>
                        <Icon name="airplane-outline" size={28} color={colors.primary} />
                        <Text style={[styles.title, dynamicStyles.title]}>{airportName}</Text>
                    </View>
                    <Text style={[{ textAlign: 'center', marginTop: 20 }, dynamicStyles.itemDesc]}>
                        Flight information available
                    </Text>
                </ScrollView>
            );
        }

        return (
            <ScrollView style={styles.scrollView}>
                <View style={styles.titleRow}>
                    <Icon name="airplane-outline" size={28} color={colors.primary} />
                    <Text style={[styles.title, dynamicStyles.title]}>{airportName}</Text>
                </View>

                <View style={[styles.flightCard, dynamicStyles.flightCard]}>
                    <View style={styles.flightHeader}>
                        <Text style={[styles.flightNumber, dynamicStyles.itemName]}>{sampleFlight.flightNumber}</Text>
                        <Text style={[styles.airline, dynamicStyles.itemDesc]}>{sampleFlight.airline}</Text>
                    </View>

                    <View style={styles.flightRoute}>
                        <View style={styles.flightPoint}>
                            <Text style={[styles.flightTime, dynamicStyles.itemName]}>{sampleFlight.departure?.time}</Text>
                            <Text style={[styles.flightAirport, dynamicStyles.itemDesc]}>{sampleFlight.departure?.airport}</Text>
                            <Text style={[styles.flightTerminal, dynamicStyles.itemDesc]}>{sampleFlight.departure?.terminal}</Text>
                        </View>
                        <View style={styles.flightArrow}>
                            <Icon name="airplane" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.flightPoint}>
                            <Text style={[styles.flightTime, dynamicStyles.itemName]}>{sampleFlight.arrival?.time}</Text>
                            <Text style={[styles.flightAirport, dynamicStyles.itemDesc]}>{sampleFlight.arrival?.airport}</Text>
                            <Text style={[styles.flightTerminal, dynamicStyles.itemDesc]}>{sampleFlight.arrival?.terminal}</Text>
                        </View>
                    </View>

                    <View style={[styles.flightInfo, { backgroundColor: colors.primary + '15' }]}>
                        <View style={styles.flightInfoItem}>
                            <Icon name="calendar-outline" size={14} color={colors.primary} />
                            <Text style={[styles.flightInfoText, { color: colors.primary }]}>{sampleFlight.departure?.date}</Text>
                        </View>
                        <View style={styles.flightInfoItem}>
                            <Icon name="enter-outline" size={14} color={colors.primary} />
                            <Text style={[styles.flightInfoText, { color: colors.primary }]}>Gate: {sampleFlight.departure?.gate}</Text>
                        </View>
                        <View style={styles.flightInfoItem}>
                            <Icon name="time-outline" size={14} color={colors.primary} />
                            <Text style={[styles.flightInfoText, { color: colors.primary }]}>Boarding: {sampleFlight.boardingTime}</Text>
                        </View>
                    </View>
                </View>

                {sampleFlight.passenger && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Icon name="ticket-outline" size={20} color={colors.text} />
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Boarding Pass</Text>
                        </View>
                        <View style={[styles.boardingPass, dynamicStyles.boardingPass]}>
                            <Text style={[styles.passengerName, dynamicStyles.itemName]}>{sampleFlight.passenger.name}</Text>
                            <View style={styles.passengerDetails}>
                                <Text style={dynamicStyles.itemDesc}>Booking: {sampleFlight.passenger.bookingRef}</Text>
                                <Text style={dynamicStyles.itemDesc}>Seat: {sampleFlight.passenger.seat}</Text>
                                <Text style={dynamicStyles.itemDesc}>Class: {sampleFlight.passenger.class}</Text>
                                <Text style={dynamicStyles.itemDesc}>Baggage: {sampleFlight.passenger.baggage}</Text>
                            </View>
                        </View>
                    </>
                )}

                {commonPhrases && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Icon name="chatbubble-ellipses-outline" size={20} color={colors.text} />
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Useful Phrases</Text>
                        </View>
                        <View style={styles.phrasesGrid}>
                            {Object.entries(commonPhrases).map(([key, value], i) => (
                                <TouchableOpacity key={i} style={[styles.phraseCard, dynamicStyles.phraseCard]} onPress={() => handleItemPress(value)}>
                                    <Text style={[styles.phraseText, dynamicStyles.phraseText]}>{value}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>
        );
    };

    // Render content based on menu type
    const renderContent = () => {
        if (menuType === 'cafe' || menuType === 'restaurant') {
            const { categories, currency } = menuData;
            if (!categories) {
                return (
                    <ScrollView style={styles.scrollView}>
                        <View style={styles.titleRow}>
                            <Icon name={menuType === 'restaurant' ? 'restaurant-outline' : 'cafe-outline'} size={28} color={colors.primary} />
                            <Text style={[styles.title, dynamicStyles.title]}>MENU</Text>
                        </View>
                        <Text style={[{ textAlign: 'center' }, dynamicStyles.itemDesc]}>Menu not available for this language</Text>
                    </ScrollView>
                );
            }
            return (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.titleRow}>
                        <Icon name={menuType === 'restaurant' ? 'restaurant-outline' : 'cafe-outline'} size={28} color={colors.primary} />
                        <Text style={[styles.title, dynamicStyles.title]}>MENU</Text>
                    </View>
                    {Object.keys(categories).map((cat, idx) => (
                        <View key={idx} style={styles.category}>
                            <Text style={[styles.categoryTitle, dynamicStyles.categoryTitle]}>{cat}</Text>
                            {categories[cat].map((item, i) => (
                                <TouchableOpacity key={i} style={[styles.menuItem, dynamicStyles.menuItem]} onPress={() => handleItemPress(item.name)}>
                                    <View style={styles.itemLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                            <Icon name={getIconForItem(item.icon)} size={24} color={colors.primary} />
                                        </View>
                                        <View>
                                            <Text style={[styles.itemName, dynamicStyles.itemName]}>{item.name}</Text>
                                            {item.description && <Text style={[styles.itemDesc, dynamicStyles.itemDesc]}>{item.description}</Text>}
                                        </View>
                                    </View>
                                    <Text style={[styles.itemPrice, dynamicStyles.itemPrice]}>{currency}{item.price}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            );
        }

        if (menuType === 'shopping') {
            return renderShopping();
        }

        if (menuType === 'hotel') {
            return renderHotel();
        }

        if (menuType === 'airport') {
            return renderAirport();
        }

        if (menuType === 'directions') {
            const { currentLocation, landmarks, nearbyPlaces } = menuData;
            return (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.titleRow}>
                        <Icon name="map-outline" size={28} color={colors.primary} />
                        <Text style={[styles.title, dynamicStyles.title]}>MAP</Text>
                    </View>
                    <View style={[styles.youAreHere, { backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.15)' : '#e3f2fd', borderColor: isDarkMode ? '#42a5f5' : '#2196f3' }]}>
                        <View style={styles.youAreHereRow}>
                            <Icon name="location" size={24} color={isDarkMode ? '#42a5f5' : '#1976d2'} />
                            <Text style={[styles.youAreHereText, { color: isDarkMode ? '#42a5f5' : '#1976d2' }]}>You are here</Text>
                        </View>
                        <Text style={[styles.currentLocation, dynamicStyles.itemName]}>{currentLocation}</Text>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Icon name="navigate-outline" size={20} color={colors.text} />
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Nearby Landmarks</Text>
                    </View>
                    {landmarks?.map((l, i) => (
                        <TouchableOpacity key={i} style={[styles.landmarkCard, dynamicStyles.menuItem]} onPress={() => handleItemPress(l.name)}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                <Icon name={getIconForItem(l.icon)} size={24} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.landmarkName, dynamicStyles.itemName]}>{l.name}</Text>
                                <Text style={[styles.landmarkDetails, dynamicStyles.itemDesc]}>{l.distance} {l.direction} • {l.time}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}

                    <View style={styles.sectionHeader}>
                        <Icon name="storefront-outline" size={20} color={colors.text} />
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Nearby Places</Text>
                    </View>
                    {nearbyPlaces?.map((p, i) => (
                        <View key={i} style={[styles.nearbyPlace, dynamicStyles.menuItem]}>
                            <Text style={[styles.placeType, { color: colors.primary }]}>{p.type}</Text>
                            <Text style={[styles.placeName, dynamicStyles.itemName]}>{p.name}</Text>
                            <Text style={[styles.placeDistance, dynamicStyles.itemDesc]}>{p.distance}</Text>
                        </View>
                    ))}
                </ScrollView>
            );
        }

        return (
            <ScrollView style={styles.scrollView}>
                <View style={styles.titleRow}>
                    <Icon name="document-outline" size={28} color={colors.primary} />
                    <Text style={[styles.title, dynamicStyles.title]}>{menuType?.toUpperCase()}</Text>
                </View>
                <Text style={[{ textAlign: 'center' }, dynamicStyles.itemDesc]}>Content for {language.name}</Text>
            </ScrollView>
        );
    };

    const gradientColors = isDarkMode
        ? [colors.primary, '#4a148c']
        : ['#667eea', '#764ba2'];

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <LinearGradient colors={gradientColors} style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Icon name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={[styles.content, dynamicStyles.content]}>
                    {renderContent()}
                </View>
            </LinearGradient>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
    closeButton: { alignSelf: 'flex-end', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 20 },
    scrollView: { flex: 1, paddingHorizontal: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    category: { marginBottom: 25 },
    categoryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 10 },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    itemName: { fontSize: 15, fontWeight: '600' },
    itemDesc: { fontSize: 12, marginTop: 2 },
    itemPrice: { fontSize: 15, fontWeight: 'bold' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold' },
    youAreHere: { borderRadius: 12, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 2 },
    youAreHereRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    youAreHereText: { fontSize: 16, fontWeight: 'bold' },
    currentLocation: { fontSize: 20, fontWeight: 'bold' },
    landmarkCard: { flexDirection: 'row', borderRadius: 12, padding: 12, marginBottom: 10, alignItems: 'center' },
    landmarkName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    landmarkDetails: { fontSize: 12 },
    nearbyPlace: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 10, padding: 12, marginBottom: 8 },
    placeType: { fontSize: 12, fontWeight: '600', width: 80 },
    placeName: { fontSize: 14, flex: 1 },
    placeDistance: { fontSize: 12 },
    hotelLocation: { fontSize: 14, textAlign: 'center', marginBottom: 15 },
    roomCard: { borderRadius: 12, padding: 15, marginBottom: 12 },
    roomHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    roomName: { fontSize: 15, fontWeight: '600', flex: 1, marginLeft: 10 },
    roomPrice: { fontSize: 16, fontWeight: 'bold' },
    roomFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    featureTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 11 },
    amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    amenityTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, fontSize: 13 },
    infoBox: { borderRadius: 10, padding: 15, marginTop: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    infoText: { fontSize: 14 },
    reservationCard: { borderRadius: 12, padding: 15, borderWidth: 1 },
    reservationText: { fontSize: 14, marginBottom: 4 },
    flightCard: { borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1 },
    flightHeader: { alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)', paddingBottom: 10 },
    flightNumber: { fontSize: 22, fontWeight: 'bold' },
    airline: { fontSize: 14, marginTop: 4 },
    flightRoute: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    flightPoint: { flex: 1, alignItems: 'center' },
    flightTime: { fontSize: 22, fontWeight: 'bold' },
    flightAirport: { fontSize: 12, marginTop: 4, textAlign: 'center' },
    flightTerminal: { fontSize: 11, marginTop: 2 },
    flightArrow: { paddingHorizontal: 10 },
    flightInfo: { borderRadius: 8, padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    flightInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    flightInfoText: { fontSize: 12 },
    boardingPass: { borderRadius: 12, padding: 15, borderWidth: 2, borderStyle: 'dashed' },
    passengerName: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    passengerDetails: { gap: 4 },
    phrasesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    phraseCard: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    phraseText: { fontSize: 14 }
});

export default MenuViewer;

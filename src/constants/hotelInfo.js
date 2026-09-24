// Hotel information for check-in scenarios
export const HOTEL_INFO = {
    tr: {
        currency: '₺',
        hotelName: 'Grand Hotel Istanbul',
        roomTypes: [
            {
                name: 'Standart Oda',
                price: '850',
                icon: '🛏️',
                features: ['Tek Yatak', 'Duş', 'WiFi', 'TV']
            },
            {
                name: 'Deluxe Oda',
                price: '1200',
                icon: '🛏️',
                features: ['Çift Kişilik Yatak', 'Banyo', 'WiFi', 'TV', 'Manzara']
            },
            {
                name: 'Suit',
                price: '2500',
                icon: '🏨',
                features: ['Yatak Odası', 'Oturma Odası', 'Jakuzi', 'WiFi', 'TV', 'Balkon']
            }
        ],
        checkInTime: '14:00',
        checkOutTime: '12:00',
        amenities: ['Havuz', 'Spor Salonu', 'Restoran', 'Bar', 'Spa'],
        sampleReservation: {
            confirmationNumber: 'HTL-TR-98765',
            guestName: 'Mehmet Yılmaz',
            checkIn: '25 Kasım 2025',
            checkOut: '27 Kasım 2025',
            roomType: 'Deluxe Oda',
            nights: 2
        }
    },
    en: {
        currency: '£',
        hotelName: 'The Royal Grand Hotel',
        roomTypes: [
            {
                name: 'Standard Room',
                price: '120',
                icon: '🛏️',
                features: ['Single Bed', 'Shower', 'WiFi', 'TV']
            },
            {
                name: 'Deluxe Room',
                price: '180',
                icon: '🛏️',
                features: ['Double Bed', 'Bathroom', 'WiFi', 'TV', 'City View']
            },
            {
                name: 'Suite',
                price: '350',
                icon: '🏨',
                features: ['Bedroom', 'Living Room', 'Jacuzzi', 'WiFi', 'TV', 'Balcony']
            }
        ],
        checkInTime: '2:00 PM',
        checkOutTime: '12:00 PM',
        amenities: ['Pool', 'Gym', 'Restaurant', 'Bar', 'Spa'],
        sampleReservation: {
            confirmationNumber: 'HTL-UK-45678',
            guestName: 'John Smith',
            checkIn: '25 November 2025',
            checkOut: '27 November 2025',
            roomType: 'Deluxe Room',
            nights: 2
        }
    },
    es: {
        currency: '€',
        hotelName: 'Hotel Gran Palacio',
        roomTypes: [
            {
                name: 'Habitación Estándar',
                price: '110',
                icon: '🛏️',
                features: ['Cama Individual', 'Ducha', 'WiFi', 'TV']
            },
            {
                name: 'Habitación Deluxe',
                price: '165',
                icon: '🛏️',
                features: ['Cama Doble', 'Baño', 'WiFi', 'TV', 'Vista Ciudad']
            },
            {
                name: 'Suite',
                price: '320',
                icon: '🏨',
                features: ['Dormitorio', 'Sala de Estar', 'Jacuzzi', 'WiFi', 'TV', 'Balcón']
            }
        ],
        checkInTime: '14:00',
        checkOutTime: '12:00',
        amenities: ['Piscina', 'Gimnasio', 'Restaurante', 'Bar', 'Spa'],
        sampleReservation: {
            confirmationNumber: 'HTL-ES-12345',
            guestName: 'Carlos García',
            checkIn: '25 noviembre 2025',
            checkOut: '27 noviembre 2025',
            roomType: 'Habitación Deluxe',
            nights: 2
        }
    },
    fr: {
        currency: '€',
        hotelName: 'Le Grand Hôtel',
        roomTypes: [
            {
                name: 'Chambre Standard',
                price: '110',
                icon: '🛏️',
                features: ['Lit Simple', 'Douche', 'WiFi', 'TV']
            },
            {
                name: 'Chambre Deluxe',
                price: '165',
                icon: '🛏️',
                features: ['Lit Double', 'Salle de Bain', 'WiFi', 'TV', 'Vue Ville']
            },
            {
                name: 'Suite',
                price: '320',
                icon: '🏨',
                features: ['Chambre', 'Salon', 'Jacuzzi', 'WiFi', 'TV', 'Balcon']
            }
        ],
        checkInTime: '14:00',
        checkOutTime: '12:00',
        amenities: ['Piscine', 'Salle de Sport', 'Restaurant', 'Bar', 'Spa'],
        sampleReservation: {
            confirmationNumber: 'HTL-FR-67890',
            guestName: 'Pierre Dubois',
            checkIn: '25 novembre 2025',
            checkOut: '27 novembre 2025',
            roomType: 'Chambre Deluxe',
            nights: 2
        }
    },
    it: {
        currency: '€',
        hotelName: 'Grand Hotel Roma',
        roomTypes: [
            {
                name: 'Camera Standard',
                price: '115',
                icon: '🛏️',
                features: ['Letto Singolo', 'Doccia', 'WiFi', 'TV']
            },
            {
                name: 'Camera Deluxe',
                price: '180',
                icon: '🛏️',
                features: ['Letto Matrimoniale', 'Bagno', 'WiFi', 'TV', 'Vista Città']
            },
            {
                name: 'Suite',
                price: '340',
                icon: '🏨',
                features: ['Camera da letto', 'Salotto', 'Jacuzzi', 'WiFi', 'TV', 'Balcone']
            }
        ],
        checkInTime: '14:00',
        checkOutTime: '12:00',
        amenities: ['Piscina', 'Palestra', 'Ristorante', 'Bar', 'Spa'],
        sampleReservation: {
            confirmationNumber: 'HTL-IT-11223',
            guestName: 'Luca Rossi',
            checkIn: '25 novembre 2025',
            checkOut: '27 novembre 2025',
            roomType: 'Camera Deluxe',
            nights: 2
        }
    },
    pt: {
        currency: '€',
        hotelName: 'Grand Hotel Lisboa',
        roomTypes: [
            {
                name: 'Quarto Standard',
                price: '120',
                icon: '🛏️',
                features: ['Cama Individual', 'Casa de Banho', 'WiFi', 'TV']
            },
            {
                name: 'Quarto Deluxe',
                price: '190',
                icon: '🛏️',
                features: ['Cama de Casal', 'Casa de Banho', 'WiFi', 'TV', 'Vista da Cidade']
            },
            {
                name: 'Suite',
                price: '350',
                icon: '🏨',
                features: ['Quarto', 'Sala de estar', 'Jacuzzi', 'WiFi', 'TV', 'Balcão']
            }
        ],
        checkInTime: '14:00',
        checkOutTime: '12:00',
        amenities: ['Piscina', 'Ginásio', 'Restaurante', 'Bar', 'Spa'],
        sampleReservation: {
            confirmationNumber: 'HTL-PT-33445',
            guestName: 'João Silva',
            checkIn: '25 novembro 2025',
            checkOut: '27 novembro 2025',
            roomType: 'Quarto Deluxe',
            nights: 2
        }
    },
    ja: {
        currency: '¥',
        hotelName: '東京グランドホテル',
        roomTypes: [
            {
                name: 'スタンダードルーム',
                price: '15000',
                icon: '🛏️',
                features: ['シングルベッド', 'シャワー', 'WiFi', 'テレビ']
            },
            {
                name: 'デラックスルーム',
                price: '25000',
                icon: '🛏️',
                features: ['ダブルベッド', 'バスルーム', 'WiFi', 'テレビ', 'シティビュー']
            },
            {
                name: 'スイート',
                price: '50000',
                icon: '🏨',
                features: ['ベッドルーム', 'リビングルーム', 'ジャグジー', 'WiFi', 'テレビ', 'バルコニー']
            }
        ],
        checkInTime: '15:00',
        checkOutTime: '11:00',
        amenities: ['プール', 'ジム', 'レストラン', 'バー', 'スパ'],
        sampleReservation: {
            confirmationNumber: 'HTL-JP-55667',
            guestName: '山田 太郎',
            checkIn: '2025年11月25日',
            checkOut: '2025年11月27日',
            roomType: 'デラックスルーム',
            nights: 2
        }
    },
    ko: {
        currency: '₩',
        hotelName: '서울 그랜드 호텔',
        roomTypes: [
            {
                name: '스탠다드 룸',
                price: '130000',
                icon: '🛏️',
                features: ['싱글 침대', '샤워', 'WiFi', 'TV']
            },
            {
                name: '디럭스 룸',
                price: '210000',
                icon: '🛏️',
                features: ['더블 침대', '욕실', 'WiFi', 'TV', '도시 전망']
            },
            {
                name: '스위트',
                price: '420000',
                icon: '🏨',
                features: ['침실', '거실', '자쿠지', 'WiFi', 'TV', '발코니']
            }
        ],
        checkInTime: '15:00',
        checkOutTime: '11:00',
        amenities: ['수영장', '헬스장', '레스토랑', '바', '스파'],
        sampleReservation: {
            confirmationNumber: 'HTL-KR-77889',
            guestName: '김민수',
            checkIn: '2025년 11월 25일',
            checkOut: '2025년 11월 27일',
            roomType: '디럭스 룸',
            nights: 2
        }
    },
    zh: {
        currency: '¥',
        hotelName: '北京大酒店',
        roomTypes: [
            {
                name: '标准间',
                price: '800',
                icon: '🛏️',
                features: ['单人床', '淋浴', 'WiFi', '电视']
            },
            {
                name: '豪华间',
                price: '1300',
                icon: '🛏️',
                features: ['双人床', '浴室', 'WiFi', '电视', '城市景观']
            },
            {
                name: '套房',
                price: '2500',
                icon: '🏨',
                features: ['卧室', '客厅', '按摩浴缸', 'WiFi', '电视', '阳台']
            }
        ],
        checkInTime: '15:00',
        checkOutTime: '11:00',
        amenities: ['泳池', '健身房', '餐厅', '酒吧', '水疗中心'],
        sampleReservation: {
            confirmationNumber: 'HTL-CN-99001',
            guestName: '王伟',
            checkIn: '2025年11月25日',
            checkOut: '2025年11月27日',
            roomType: '豪华间',
            nights: 2
        }
    },
    de: {
        hotelName: "Hotel Adlon Kempinski",
        location: "Unter den Linden, Berlin",
        roomTypes: [
                {
                        type: "Einzelzimmer",
                        price: "250€",
                        icon: "🛏️",
                        amenities: "WLAN, Minibar"
                },
                {
                        type: "Doppelzimmer",
                        price: "350€",
                        icon: "🛏️🛏️",
                        amenities: "WLAN, Minibar, Balkon"
                },
                {
                        type: "Suite",
                        price: "600€",
                        icon: "✨",
                        amenities: "WLAN, Minibar, Jacuzzi, Stadtblick"
                }
        ],
        facilities: [
                {
                        name: "Restaurant",
                        icon: "🍽️"
                },
                {
                        name: "Fitnessstudio",
                        icon: "💪"
                },
                {
                        name: "Spa",
                        icon: "💆"
                },
                {
                        name: "Parkplatz",
                        icon: "🅿️"
                }
        ],
        checkIn: "15:00",
        checkOut: "11:00"
},
    ru: {
        hotelName: "Гостиница Метрополь",
        location: "Театральный проезд, Москва",
        roomTypes: [
                {
                        type: "Одноместный номер",
                        price: "12000₽",
                        icon: "🛏️",
                        amenities: "Wi-Fi, Мини-бар"
                },
                {
                        type: "Двухместный номер",
                        price: "18000₽",
                        icon: "🛏️🛏️",
                        amenities: "Wi-Fi, Мини-бар, Балкон"
                },
                {
                        type: "Люкс",
                        price: "35000₽",
                        icon: "✨",
                        amenities: "Wi-Fi, Мини-бар, Джакузи, Вид на кремль"
                }
        ],
        facilities: [
                {
                        name: "Ресторан",
                        icon: "🍽️"
                },
                {
                        name: "Спортзал",
                        icon: "💪"
                },
                {
                        name: "СПА",
                        icon: "💆"
                },
                {
                        name: "Парковка",
                        icon: "🅿️"
                }
        ],
        checkIn: "14:00",
        checkOut: "12:00"
},
    ar: {
        hotelName: "فندق برج العرب",
        location: "جميرا، دبي",
        roomTypes: [
                {
                        type: "غرفة مفردة",
                        price: "2000﷼",
                        icon: "🛏️",
                        amenities: "واي فاي، ميني بار"
                },
                {
                        type: "غرفة مزدوجة",
                        price: "3500﷼",
                        icon: "🛏️🛏️",
                        amenities: "واي فاي، ميني بار، شرفة"
                },
                {
                        type: "جناح",
                        price: "8000﷼",
                        icon: "✨",
                        amenities: "واي فاي، ميني بار، جاكوزي، إطلالة على البحر"
                }
        ],
        facilities: [
                {
                        name: "مطعم",
                        icon: "🍽️"
                },
                {
                        name: "صالة رياضية",
                        icon: "💪"
                },
                {
                        name: "سبا",
                        icon: "💆"
                },
                {
                        name: "موقف سيارات",
                        icon: "🅿️"
                }
        ],
        checkIn: "15:00",
        checkOut: "12:00"
},
    hi: {
        hotelName: "ताज महोटल",
        location: "कोलाबा, मुंबई",
        roomTypes: [
                {
                        type: "सिंगल रूम",
                        price: "8000₹",
                        icon: "🛏️",
                        amenities: "वाई-फाई, मिनी बार"
                },
                {
                        type: "डबल रूम",
                        price: "12000₹",
                        icon: "🛏️🛏️",
                        amenities: "वाई-फाई, मिनी बार, बालकनी"
                },
                {
                        type: "सूट",
                        price: "25000₹",
                        icon: "✨",
                        amenities: "वाई-फाई, मिनी बार, जकूज़ी, समुद्र दृश्य"
                }
        ],
        facilities: [
                {
                        name: "रेस्टोरेंट",
                        icon: "🍽️"
                },
                {
                        name: "जिम",
                        icon: "💪"
                },
                {
                        name: "स्पा",
                        icon: "💆"
                },
                {
                        name: "पार्किंग",
                        icon: "🅿️"
                }
        ],
        checkIn: "14:00",
        checkOut: "11:00"
},
};

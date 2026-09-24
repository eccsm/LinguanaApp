// Map and directions information for navigation scenarios
export const DIRECTIONS_MAPS = {
    tr: {
        currentLocation: 'Taksim Meydanı',
        landmarks: [
            { name: 'Galata Kulesi', distance: '800m', direction: 'Kuzey', icon: '🗼', time: '10 dakika yürüyüş' },
            { name: 'İstiklal Caddesi', distance: '200m', direction: 'Batı', icon: '🛍️', time: '3 dakika yürüyüş' },
            { name: 'Dolmabahçe Sarayı', distance: '2km', direction: 'Kuzey', icon: '🏰', time: '25 dakika yürüyüş' },
            { name: 'Karaköy', distance: '1.5km', direction: 'Kuzey', icon: '⛴️', time: '18 dakika yürüyüş' }
        ],
        nearbyPlaces: [
            { type: 'Restoran', name: 'Leb-i Derya', distance: '300m' },
            { type: 'Kafe', name: 'Ara Cafe', distance: '150m' },
            { type: 'Müze', name: 'Pera Müzesi', distance: '600m' },
            { type: 'Metro', name: 'Taksim Metro', distance: '50m' }
        ]
    },
    en: {
        currentLocation: 'Trafalgar Square',
        landmarks: [
            { name: 'Big Ben', distance: '800m', direction: 'South', icon: '🕰️', time: '10 min walk' },
            { name: 'British Museum', distance: '1.2km', direction: 'North', icon: '🏛️', time: '15 min walk' },
            { name: 'Covent Garden', distance: '600m', direction: 'East', icon: '🎭', time: '8 min walk' },
            { name: 'Buckingham Palace', distance: '1.5km', direction: 'Southwest', icon: '👑', time: '18 min walk' }
        ],
        nearbyPlaces: [
            { type: 'Restaurant', name: 'The National Café', distance: '100m' },
            { type: 'Cafe', name: 'Costa Coffee', distance: '50m' },
            { type: 'Museum', name: 'National Gallery', distance: '20m' },
            { type: 'Tube', name: 'Charing Cross', distance: '200m' }
        ]
    },
    es: {
        currentLocation: 'Plaza Mayor',
        landmarks: [
            { name: 'Palacio Real', distance: '700m', direction: 'Oeste', icon: '👑', time: '9 min a pie' },
            { name: 'Puerta del Sol', distance: '300m', direction: 'Este', icon: '🌟', time: '4 min a pie' },
            { name: 'Museo del Prado', distance: '1.5km', direction: 'Este', icon: '🎨', time: '18 min a pie' },
            { name: 'Mercado San Miguel', distance: '200m', direction: 'Norte', icon: '🍴', time: '3 min a pie' }
        ],
        nearbyPlaces: [
            { type: 'Restaurante', name: 'Botín', distance: '150m' },
            { type: 'Café', name: 'Café de Oriente', distance: '400m' },
            { type: 'Metro', name: 'Sol', distance: '300m' },
            { type: 'Tienda', name: 'El Corte Inglés', distance: '500m' }
        ]
    },
    fr: {
        currentLocation: 'Place de la Concorde',
        landmarks: [
            { name: 'Tour Eiffel', distance: '2km', direction: 'Ouest', icon: '🗼', time: '25 min à pied' },
            { name: 'Louvre', distance: '800m', direction: 'Est', icon: '🖼️', time: '10 min à pied' },
            { name: 'Champs-Élysées', distance: '400m', direction: 'Nord', icon: '🌳', time: '5 min à pied' },
            { name: 'Jardin des Tuileries', distance: '300m', direction: 'Est', icon: '🌳', time: '4 min à pied' }
        ],
        nearbyPlaces: [
            { type: 'Restaurant', name: 'Le Grand Véfour', distance: '600m' },
            { type: 'Café', name: 'Angelina', distance: '500m' },
            { type: 'Métro', name: 'Concorde', distance: '50m' },
            { type: 'Musée', name: 'Musée de l\'Orangerie', distance: '200m' }
        ]
    },
    it: {
        currentLocation: 'Piazza del Colosseo',
        landmarks: [
            { name: 'Colosseo', distance: '800m', direction: 'Nord', icon: '🏛️', time: '10 min a piedi' },
            { name: 'Fontana di Trevi', distance: '1km', direction: 'Ovest', icon: '💧', time: '12 min a piedi' },
            { name: 'Pantheon', distance: '600m', direction: 'Est', icon: '🏛️', time: '8 min a piedi' },
            { name: 'Piazza Navona', distance: '500m', direction: 'Sud', icon: '🏛️', time: '7 min a piedi' }
        ],
        nearbyPlaces: [
            { type: 'Ristorante', name: 'La Pergola', distance: '200m' },
            { type: 'Caffè', name: 'Caffè Greco', distance: '150m' },
            { type: 'Museo', name: 'Museo Vaticano', distance: '2km' },
            { type: 'Metro', name: 'Colosseo', distance: '100m' }
        ]
    },
    pt: {
        currentLocation: 'Praça do Comércio',
        landmarks: [
            { name: 'Torre de Belém', distance: '2km', direction: 'Oeste', icon: '🗼', time: '15 min a pé' },
            { name: 'Mosteiro dos Jerónimos', distance: '2.2km', direction: 'Oeste', icon: '🏛️', time: '16 min a pé' },
            { name: 'Praça do Rossio', distance: '1km', direction: 'Norte', icon: '🏛️', time: '10 min a pé' },
            { name: 'Elevador de Santa Justa', distance: '1.5km', direction: 'Norte', icon: '🚡', time: '12 min a pé' }
        ],
        nearbyPlaces: [
            { type: 'Restaurante', name: 'Cervejaria Ramiro', distance: '300m' },
            { type: 'Café', name: 'A Brasileira', distance: '250m' },
            { type: 'Museu', name: 'Museu Nacional de Arte Antiga', distance: '2km' },
            { type: 'Metro', name: 'Cais do Sodré', distance: '150m' }
        ]
    },
    ja: {
        currentLocation: '渋谷スクランブル交差点',
        landmarks: [
            { name: '代々木公園', distance: '1km', direction: '北', icon: '🌳', time: '12分徒歩' },
            { name: '明治神宮', distance: '1.5km', direction: '北西', icon: '⛩️', time: '15分徒歩' },
            { name: '原宿', distance: '800m', direction: '西', icon: '🛍️', time: '10分徒歩' },
            { name: '表参道', distance: '600m', direction: '西', icon: '🛍️', time: '8分徒歩' }
        ],
        nearbyPlaces: [
            { type: 'レストラン', name: 'すしざんまい', distance: '200m' },
            { type: 'カフェ', name: 'スターバックス渋谷', distance: '150m' },
            { type: '博物館', name: '渋谷ヒカリエ', distance: '300m' },
            { type: '駅', name: '渋谷駅', distance: '100m' }
        ]
    },
    ko: {
        currentLocation: '홍대입구역',
        landmarks: [
            { name: '홍대공원', distance: '800m', direction: '남쪽', icon: '🌳', time: '10분 도보' },
            { name: '연남동 카페거리', distance: '600m', direction: '동쪽', icon: '☕', time: '8분 도보' },
            { name: '홍대 거리', distance: '500m', direction: '동쪽', icon: '🛍️', time: '7분 도보' },
            { name: '홍대입구역', distance: '200m', direction: '북쪽', icon: '🚇', time: '3분 도보' }
        ],
        nearbyPlaces: [
            { type: '레스토랑', name: '홍대 김밥천국', distance: '150m' },
            { type: '카페', name: '카페베네 홍대점', distance: '120m' },
            { type: '박물관', name: '홍대 미술관', distance: '300m' },
            { type: '지하철', name: '홍대입구역', distance: '200m' }
        ]
    },
    zh: {
        currentLocation: '天安门广场',
        landmarks: [
            { name: '故宫', distance: '1km', direction: '北', icon: '🏯', time: '15分钟步行' },
            { name: '天坛', distance: '2km', direction: '东', icon: '🕌', time: '25分钟步行' },
            { name: '王府井', distance: '800m', direction: '南', icon: '🛍️', time: '10分钟步行' },
            { name: '北海公园', distance: '1.5km', direction: '西', icon: '🌳', time: '20分钟步行' }
        ],
        nearbyPlaces: [
            { type: '餐厅', name: '全聚德烤鸭店', distance: '200m' },
            { type: '咖啡馆', name: '星巴克天安门店', distance: '150m' },
            { type: '博物馆', name: '中国国家博物馆', distance: '1km' },
            { type: '地铁', name: '天安门东站', distance: '100m' }
        ]
    },
    de: {
        currentLocation: "Brandenburger Tor",
        landmarks: [
                {
                        name: "Reichstag",
                        distance: "500m",
                        direction: "Nord",
                        icon: "🏛️",
                        time: "6 Min. zu Fuß"
                },
                {
                        name: "Berliner Dom",
                        distance: "2km",
                        direction: "Ost",
                        icon: "⛪",
                        time: "25 Min. zu Fuß"
                },
                {
                        name: "Alexanderplatz",
                        distance: "3km",
                        direction: "Nordost",
                        icon: "🏙️",
                        time: "35 Min. zu Fuß"
                },
                {
                        name: "Checkpoint Charlie",
                        distance: "1.5km",
                        direction: "Süd",
                        icon: "🚧",
                        time: "18 Min. zu Fuß"
                }
        ],
        nearbyPlaces: [
                {
                        type: "Restaurant",
                        name: "Borchardt",
                        distance: "200m"
                },
                {
                        type: "Café",
                        name: "Einstein Kaffee",
                        distance: "150m"
                },
                {
                        type: "Museum",
                        name: "DDR Museum",
                        distance: "1km"
                },
                {
                        type: "U-Bahn",
                        name: "Brandenburger Tor",
                        distance: "100m"
                }
        ]
},
    ru: {
        currentLocation: "Красная площадь",
        landmarks: [
                {
                        name: "Кремль",
                        distance: "200м",
                        direction: "Запад",
                        icon: "🏰",
                        time: "3 мин пешком"
                },
                {
                        name: "Собор Василия Блаженного",
                        distance: "100м",
                        direction: "Юг",
                        icon: "⛪",
                        time: "2 мин пешком"
                },
                {
                        name: "ГУМ",
                        distance: "150м",
                        direction: "Восток",
                        icon: "🛍️",
                        time: "2 мин пешком"
                },
                {
                        name: "Большой театр",
                        distance: "800м",
                        direction: "Север",
                        icon: "🎭",
                        time: "10 мин пешком"
                }
        ],
        nearbyPlaces: [
                {
                        type: "Ресторан",
                        name: "Столовая №57",
                        distance: "150м"
                },
                {
                        type: "Кафе",
                        name: "Кофемания",
                        distance: "200м"
                },
                {
                        type: "Музей",
                        name: "Исторический музей",
                        distance: "100м"
                },
                {
                        type: "Метро",
                        name: "Охотный Ряд",
                        distance: "300м"
                }
        ]
},
    ar: {
        currentLocation: "المسجد الحرام",
        landmarks: [
                {
                        name: "الكعبة",
                        distance: "50م",
                        direction: "الوسط",
                        icon: "🕋",
                        time: "دقيقة واحدة مشياً"
                },
                {
                        name: "الصفا والمروة",
                        distance: "200م",
                        direction: "الشرق",
                        icon: "🏛️",
                        time: "3 دقائق مشياً"
                },
                {
                        name: "جبل عرفة",
                        distance: "20كم",
                        direction: "الشرق",
                        icon: "⛰️",
                        time: "30 دقيقة بالسيارة"
                },
                {
                        name: "مسجد نمرة",
                        distance: "21كم",
                        direction: "الجنوب الشرقي",
                        icon: "🕌",
                        time: "35 دقيقة بالسيارة"
                }
        ],
        nearbyPlaces: [
                {
                        type: "مطعم",
                        name: "البيك",
                        distance: "500م"
                },
                {
                        type: "مقهى",
                        name: "كافيه سيراميكا",
                        distance: "300م"
                },
                {
                        type: "سوق",
                        name: "سوق العتيبية",
                        distance: "1كم"
                },
                {
                        type: "محطة",
                        name: "الحرم",
                        distance: "200م"
                }
        ]
},
    hi: {
        currentLocation: "इंडिया गेट",
        landmarks: [
                {
                        name: "राष्ट्रपति भवन",
                        distance: "2किमी",
                        direction: "पश्चिम",
                        icon: "🏛️",
                        time: "25 मिनट पैदल"
                },
                {
                        name: "कनॉट प्लेस",
                        distance: "3किमी",
                        direction: "उत्तर",
                        icon: "🏙️",
                        time: "35 मिनट पैदल"
                },
                {
                        name: "लाल किला",
                        distance: "5किमी",
                        direction: "उत्तर-पूर्व",
                        icon: "🏰",
                        time: "60 मिनट पैदल"
                },
                {
                        name: "कमल मंदिर",
                        distance: "8किमी",
                        direction: "दक्षिण",
                        icon: "🏛️",
                        time: "15 मिनट ड्राइव"
                }
        ],
        nearbyPlaces: [
                {
                        type: "रेस्टोरेंट",
                        name: "पंजाबी बाई नेचर",
                        distance: "500मी"
                },
                {
                        type: "कैफे",
                        name: "कैफे कॉफी डे",
                        distance: "300मी"
                },
                {
                        type: "म्यूजियम",
                        name: "राष्ट्रीय संग्रहालय",
                        distance: "1किमी"
                },
                {
                        type: "मेट्रो",
                        name: "सेंट्रल सेक्रेटेरिएट",
                        distance: "1.5किमी"
                }
        ]
},
};

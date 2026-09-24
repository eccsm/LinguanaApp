// Airport and flight information for multiple languages
export const AIRPORT_INFO = {
    tr: {
        airportName: 'İstanbul Havalimanı',
        sampleFlight: {
            flightNumber: 'TK 1985',
            airline: 'Turkish Airlines',
            departure: {
                airport: 'İstanbul (IST)',
                terminal: 'Terminal 1',
                gate: 'D24',
                time: '14:30',
                date: '25 Kasım 2025'
            },
            arrival: {
                airport: 'Londra Heathrow (LHR)',
                terminal: 'Terminal 2',
                time: '17:15',
                date: '25 Kasım 2025'
            },
            passenger: {
                name: 'YILMAZ/MEHMET MR',
                bookingRef: 'ABC123',
                seat: '12A',
                class: 'Economy',
                baggage: '1 × 23kg'
            },
            boardingTime: '13:45'
        },
        commonPhrases: {
            checkIn: 'Check-in',
            boarding: 'Biniş',
            gate: 'Kapı',
            delayed: 'Gecikme',
            cancelled: 'İptal',
            baggage: 'Bagaj'
        }
    },
    en: {
        airportName: 'London Heathrow Airport',
        sampleFlight: {
            flightNumber: 'BA 2156',
            airline: 'British Airways',
            departure: {
                airport: 'London (LHR)',
                terminal: 'Terminal 5',
                gate: 'B12',
                time: '10:30',
                date: '25 November 2025'
            },
            arrival: {
                airport: 'Istanbul (IST)',
                terminal: 'International',
                time: '16:45',
                date: '25 November 2025'
            },
            passenger: {
                name: 'SMITH/JOHN MR',
                bookingRef: 'XYZ789',
                seat: '15C',
                class: 'Economy',
                baggage: '1 × 23kg'
            },
            boardingTime: '09:45'
        },
        commonPhrases: {
            checkIn: 'Check-in',
            boarding: 'Boarding',
            gate: 'Gate',
            delayed: 'Delayed',
            cancelled: 'Cancelled',
            baggage: 'Baggage'
        }
    },
    es: {
        airportName: 'Aeropuerto de Madrid-Barajas',
        sampleFlight: {
            flightNumber: 'IB 3421',
            airline: 'Iberia',
            departure: {
                airport: 'Madrid (MAD)',
                terminal: 'Terminal 4',
                gate: 'A15',
                time: '11:20',
                date: '25 noviembre 2025'
            },
            arrival: {
                airport: 'Barcelona (BCN)',
                terminal: 'Terminal 1',
                time: '12:40',
                date: '25 noviembre 2025'
            },
            passenger: {
                name: 'GARCIA/CARLOS SR',
                bookingRef: 'DEF456',
                seat: '8B',
                class: 'Economy',
                baggage: '1 × 23kg'
            },
            boardingTime: '10:50'
        },
        commonPhrases: {
            checkIn: 'Facturación',
            boarding: 'Embarque',
            gate: 'Puerta',
            delayed: 'Retrasado',
            cancelled: 'Cancelado',
            baggage: 'Equipaje'
        }
    },
    fr: {
        airportName: 'Aéroport Charles de Gaulle',
        sampleFlight: {
            flightNumber: 'AF 1524',
            airline: 'Air France',
            departure: {
                airport: 'Paris (CDG)',
                terminal: 'Terminal 2E',
                gate: 'K36',
                time: '09:15',
                date: '25 novembre 2025'
            },
            arrival: {
                airport: 'Nice (NCE)',
                terminal: 'Terminal 2',
                time: '10:45',
                date: '25 novembre 2025'
            },
            passenger: {
                name: 'DUBOIS/PIERRE M',
                bookingRef: 'GHI789',
                seat: '14F',
                class: 'Économique',
                baggage: '1 × 23kg'
            },
            boardingTime: '08:30'
        },
        commonPhrases: {
            checkIn: 'Enregistrement',
            boarding: 'Embarquement',
            gate: 'Porte',
            delayed: 'Retardé',
            cancelled: 'Annulé',
            baggage: 'Bagages'
        }
    },
    it: {
        airportName: 'Aeroporto di Roma Fiumicino',
        sampleFlight: {
            flightNumber: 'AZ 1234',
            airline: 'Alitalia',
            departure: {
                airport: 'Roma (FCO)',
                terminal: 'Terminal 1',
                gate: 'A12',
                time: '10:00',
                date: '25 Novembre 2025'
            },
            arrival: {
                airport: 'Parigi (FCO)',
                terminal: 'Terminal 2',
                time: '12:30',
                date: '25 Novembre 2025'
            },
            passenger: {
                name: 'ROSSI/MARIO MR',
                bookingRef: 'ITA123',
                seat: '22B',
                class: 'Economy',
                baggage: '1 × 23kg'
            },
            boardingTime: '09:30'
        },
        commonPhrases: {
            checkIn: 'Check-in',
            boarding: 'Imbarco',
            gate: 'Gate',
            delayed: 'Ritardo',
            cancelled: 'Cancellato',
            baggage: 'Bagaglio'
        }
    },
    pt: {
        airportName: 'Aeroporto de Lisboa',
        sampleFlight: {
            flightNumber: 'TP 5678',
            airline: 'TAP Air Portugal',
            departure: {
                airport: 'Lisboa (LIS)',
                terminal: 'Terminal 1',
                gate: 'B7',
                time: '11:15',
                date: '25 Novembro 2025'
            },
            arrival: {
                airport: 'Porto (OPO)',
                terminal: 'Terminal 2',
                time: '12:45',
                date: '25 Novembro 2025'
            },
            passenger: {
                name: 'SILVA/JUAN MR',
                bookingRef: 'PTA456',
                seat: '14C',
                class: 'Economy',
                baggage: '1 × 23kg'
            },
            boardingTime: '10:45'
        },
        commonPhrases: {
            checkIn: 'Check-in',
            boarding: 'Embarque',
            gate: 'Portão',
            delayed: 'Atrasado',
            cancelled: 'Cancelado',
            baggage: 'Bagagem'
        }
    },
    ja: {
        airportName: '東京国際空港 (羽田)',
        sampleFlight: {
            flightNumber: 'JL 3456',
            airline: '日本航空',
            departure: {
                airport: '東京 (HND)',
                terminal: '第1ターミナル',
                gate: 'C3',
                time: '09:00',
                date: '2025年11月25日'
            },
            arrival: {
                airport: '大阪 (KIX)',
                terminal: '第2ターミナル',
                time: '10:30',
                date: '2025年11月25日'
            },
            passenger: {
                name: '山田 太郎',
                bookingRef: 'JPN789',
                seat: '5A',
                class: 'エコノミー',
                baggage: '1 × 23kg'
            },
            boardingTime: '08:30'
        },
        commonPhrases: {
            checkIn: 'チェックイン',
            boarding: '搭乗',
            gate: 'ゲート',
            delayed: '遅延',
            cancelled: 'キャンセル',
            baggage: '手荷物'
        }
    },
    ko: {
        airportName: '인천국제공항',
        sampleFlight: {
            flightNumber: 'KE 7890',
            airline: '대한항공',
            departure: {
                airport: '인천 (ICN)',
                terminal: '제1터미널',
                gate: 'D5',
                time: '10:00',
                date: '2025년 11월 25일'
            },
            arrival: {
                airport: '부산 (PUS)',
                terminal: '제2터미널',
                time: '11:30',
                date: '2025년 11월 25일'
            },
            passenger: {
                name: '김민수',
                bookingRef: 'KOR123',
                seat: '12C',
                class: '이코노미',
                baggage: '1 × 23kg'
            },
            boardingTime: '09:30'
        },
        commonPhrases: {
            checkIn: '체크인',
            terminal: 'Terminal 1',
            time: '12:40',
            date: '25 noviembre 2025'
        },
        passenger: {
            name: 'GARCIA/CARLOS SR',
            bookingRef: 'DEF456',
            seat: '8B',
            class: 'Economy',
            baggage: '1 × 23kg'
        },
        boardingTime: '10:50'
    },
    commonPhrases: {
        checkIn: 'Facturación',
        boarding: 'Embarque',
        gate: 'Puerta',
        delayed: 'Retrasado',
        cancelled: 'Cancelado',
        baggage: 'Equipaje'
    },
    de: {
        airportName: "Flughafen München",
        sampleFlight: {
                flightNumber: "LH 2156",
                airline: "Lufthansa",
                departure: {
                        airport: "München (MUC)",
                        terminal: "Terminal 2",
                        gate: "H12",
                        time: "14:30",
                        date: "25. November 2025"
                },
                arrival: {
                        airport: "Frankfurt (FRA)",
                        terminal: "Terminal 1",
                        time: "15:45",
                        date: "25. November 2025"
                },
                passenger: {
                        name: "MÜLLER/HANS HERR",
                        bookingRef: "DEU789",
                        seat: "18A",
                        class: "Economy",
                        baggage: "1 × 23kg"
                },
                boardingTime: "14:00"
        },
        commonPhrases: {
                checkIn: "Check-in",
                boarding: "Boarding",
                gate: "Flugsteig",
                delayed: "Verspätet",
                cancelled: "Gestrichen",
                baggage: "Gepäck"
        }
},
    ru: {
        airportName: "Аэропорт Шереметьево",
        sampleFlight: {
                flightNumber: "SU 1234",
                airline: "Аэрофлот",
                departure: {
                        airport: "Москва (SVO)",
                        terminal: "Терминал D",
                        gate: "D15",
                        time: "16:00",
                        date: "25 ноября 2025"
                },
                arrival: {
                        airport: "Санкт-Петербург (LED)",
                        terminal: "Терминал 1",
                        time: "17:30",
                        date: "25 ноября 2025"
                },
                passenger: {
                        name: "ИВАНОВ/ИВАН Г-Н",
                        bookingRef: "RUS456",
                        seat: "10B",
                        class: "Эконом",
                        baggage: "1 × 23кг"
                },
                boardingTime: "15:30"
        },
        commonPhrases: {
                checkIn: "Регистрация",
                boarding: "Посадка",
                gate: "Выход",
                delayed: "Задержан",
                cancelled: "Отменён",
                baggage: "Багаж"
        }
},
    ar: {
        airportName: "مطار دبي الدولي",
        sampleFlight: {
                flightNumber: "EK 5678",
                airline: "طيران الإمارات",
                departure: {
                        airport: "دبي (DXB)",
                        terminal: "المبنى 3",
                        gate: "B24",
                        time: "18:30",
                        date: "25 نوفمبر 2025"
                },
                arrival: {
                        airport: "أبوظبي (AUH)",
                        terminal: "المبنى 1",
                        time: "19:30",
                        date: "25 نوفمبر 2025"
                },
                passenger: {
                        name: "أحمد/محمد السيد",
                        bookingRef: "UAE123",
                        seat: "22C",
                        class: "درجة اقتصادية",
                        baggage: "1 × 23كجم"
                },
                boardingTime: "18:00"
        },
        commonPhrases: {
                checkIn: "تسجيل الوصول",
                boarding: "الصعود",
                gate: "البوابة",
                delayed: "متأخر",
                cancelled: "ملغى",
                baggage: "الأمتعة"
        }
},
    hi: {
        airportName: "इंदिरा गांधी अंतर्राष्ट्रीय हवाई अड्डा",
        sampleFlight: {
                flightNumber: "AI 9876",
                airline: "एयर इंडिया",
                departure: {
                        airport: "दिल्ली (DEL)",
                        terminal: "टर्मिनल 3",
                        gate: "C18",
                        time: "09:00",
                        date: "25 नवंबर 2025"
                },
                arrival: {
                        airport: "मुंबई (BOM)",
                        terminal: "टर्मिनल 2",
                        time: "11:15",
                        date: "25 नवंबर 2025"
                },
                passenger: {
                        name: "शर्मा/राज श्री",
                        bookingRef: "IND789",
                        seat: "16D",
                        class: "इकॉनमी",
                        baggage: "1 × 23किग्रा"
                },
                boardingTime: "08:30"
        },
        commonPhrases: {
                checkIn: "चेक-इन",
                boarding: "बोर्डिंग",
                gate: "गेट",
                delayed: "विलंबित",
                cancelled: "रद्द",
                baggage: "सामान"
        }
},
};

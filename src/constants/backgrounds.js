
export const CHAT_BACKGROUNDS = {
    CAFE: require('../../assets/backgrounds/cafe_background.png'),
    RESTAURANT: require('../../assets/backgrounds/restaurant_background.png'),
    AIRPORT: require('../../assets/backgrounds/airport_background.png'),
    SHOPPING: require('../../assets/backgrounds/shopping_background.png'),
    HOTEL: require('../../assets/backgrounds/hotel_background.png'),
    DIRECTIONS: require('../../assets/backgrounds/directions_background.png'),
    TAXI: require('../../assets/backgrounds/taxi_background.png'),
    PHONE: require('../../assets/backgrounds/phone_background.png'),
    DOCTOR: require('../../assets/backgrounds/doctor_background.png'),
    SMALL_TALK: require('../../assets/backgrounds/smalltalk_background.png'),
    DATING: require('../../assets/backgrounds/dating_background.png'),
    PICKUP_LINES: require('../../assets/backgrounds/pickup_lines_background.png'),
    ROASTING: require('../../assets/backgrounds/roasting_background.png'),
};

// Game mode backgrounds
export const GAME_BACKGROUNDS = {
    PUZZLE: require('../../assets/backgrounds/puzzle_background.png'),
    SWIPE: require('../../assets/backgrounds/game_background.png'),
    SESSION_REVIEW: require('../../assets/backgrounds/session_review_background.png'),
};


export const getBackgroundType = (scenarioId) => {
    return 'image';
};


export const getBackgroundForScenario = (scenarioId) => {
    const id = scenarioId?.toUpperCase() || 'DEFAULT';
    const type = getBackgroundType(id);

    const imageMapping = {
        'CAFE': CHAT_BACKGROUNDS.CAFE,
        'ORDERING_CAFE': CHAT_BACKGROUNDS.CAFE,
        'RESTAURANT': CHAT_BACKGROUNDS.RESTAURANT,
        'ORDERING_RESTAURANT': CHAT_BACKGROUNDS.RESTAURANT,
        'AIRPORT': CHAT_BACKGROUNDS.AIRPORT,
        'SHOPPING': CHAT_BACKGROUNDS.SHOPPING,
        'HOTEL': CHAT_BACKGROUNDS.HOTEL,
        'HOTEL_CHECK_IN': CHAT_BACKGROUNDS.HOTEL,
        'DIRECTIONS': CHAT_BACKGROUNDS.DIRECTIONS,
        'ASKING_DIRECTIONS': CHAT_BACKGROUNDS.DIRECTIONS,
        'TAXI': CHAT_BACKGROUNDS.TAXI,
        'CALLING_TAXI': CHAT_BACKGROUNDS.TAXI,
        'PHONE': CHAT_BACKGROUNDS.PHONE,
        'PHONE_CALL': CHAT_BACKGROUNDS.PHONE,
        'DOCTOR': CHAT_BACKGROUNDS.DOCTOR,
        'DOCTORS_APPOINTMENT': CHAT_BACKGROUNDS.DOCTOR,
        'SMALL_TALK': CHAT_BACKGROUNDS.SMALL_TALK,
        // Dating pack backgrounds
        'DATING': CHAT_BACKGROUNDS.DATING,
        'FIRST_DATE': CHAT_BACKGROUNDS.DATING,
        'FLIRTING': CHAT_BACKGROUNDS.PICKUP_LINES,
        'PICKUP_LINES': CHAT_BACKGROUNDS.PICKUP_LINES,
        // Roast mode background
        'ROAST_MODE': CHAT_BACKGROUNDS.ROASTING,
        'ROAST': CHAT_BACKGROUNDS.ROASTING,
    };

    for (const [key, value] of Object.entries(imageMapping)) {
        if (id.includes(key)) {
            return { type: 'image', source: value };
        }
    }

    return { type: 'image', source: CHAT_BACKGROUNDS.RESTAURANT };
};


export default CHAT_BACKGROUNDS;

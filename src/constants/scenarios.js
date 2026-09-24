// --- SHARED TRANSLATIONS ---
const COMMON_PHRASES = {
  // Context-specific hints for different scenario types
  MENU_HINTS: {
    // For cafe/restaurant scenarios
    menu: {
      en: ' 📋 Tap the menu button to view items.',
      tr: ' 📋 Menü için yukarıdaki butona tıklayın.',
      es: ' 📋 Toca el botón del menú para ver el menú.',
      fr: ' 📋 Appuyez sur le bouton menu pour voir le menu.',
      de: ' 📋 Tippen Sie auf die Menütaste, um das Menü anzuzeigen.',
      it: ' 📋 Tocca il pulsante menu per visualizzare il menù.',
      pt: ' 📋 Toque no botão de menu para ver o cardápio.',
      ja: ' 📋 メニューボタンをタップしてメニューを表示します。',
      ko: ' 📋 메뉴 버튼을 눌러 메뉴를 확인하세요.',
      zh: ' 📋 点击菜单按钮查看菜单。',
      ru: ' 📋 Нажмите кнопку меню, чтобы просмотреть меню.',
      ar: ' 📋 اضغط على زر القائمة لعرض القائمة.',
      hi: ' 📋 मेनू देखने के लिए मेनू बटन पर टैप करें।',
    },
    // For shopping scenarios
    shopping: {
      en: ' 🛒 Tap the catalog button to browse products.',
      tr: ' 🛒 Ürünleri görmek için katalog butonuna tıklayın.',
      es: ' 🛒 Toca el botón del catálogo para ver los productos.',
      fr: ' 🛒 Appuyez sur le bouton catalogue pour parcourir les produits.',
      de: ' 🛒 Tippen Sie auf den Katalog-Button, um Produkte zu durchsuchen.',
      it: ' 🛒 Tocca il pulsante catalogo per sfogliare i prodotti.',
      pt: ' 🛒 Toque no botão do catálogo para ver os produtos.',
      ja: ' 🛒 カタログボタンをタップして商品を閲覧します。',
      ko: ' 🛒 카탈로그 버튼을 눌러 제품을 둘러보세요.',
      zh: ' 🛒 点击目录按钮浏览产品。',
      ru: ' 🛒 Нажмите кнопку каталога, чтобы просмотреть товары.',
      ar: ' 🛒 اضغط على زر الكتالوج لتصفح المنتجات.',
      hi: ' 🛒 उत्पादों को देखने के लिए कैटलॉग बटन पर टैप करें।',
    },
    // For airport scenarios
    airport: {
      en: ' ✈️ Tap the ticket button to view your flight details.',
      tr: ' ✈️ Uçuş bilgilerinizi görmek için bilet butonuna tıklayın.',
      es: ' ✈️ Toca el botón del billete para ver los detalles de tu vuelo.',
      fr: ' ✈️ Appuyez sur le bouton billet pour voir les détails de votre vol.',
      de: ' ✈️ Tippen Sie auf den Ticket-Button, um Ihre Flugdaten anzuzeigen.',
      it: ' ✈️ Tocca il pulsante biglietto per visualizzare i dettagli del volo.',
      pt: ' ✈️ Toque no botão do bilhete para ver os detalhes do seu voo.',
      ja: ' ✈️ チケットボタンをタップしてフライト情報を表示します。',
      ko: ' ✈️ 티켓 버튼을 눌러 항공편 정보를 확인하세요.',
      zh: ' ✈️ 点击机票按钮查看航班详情。',
      ru: ' ✈️ Нажмите кнопку билета, чтобы просмотреть детали рейса.',
      ar: ' ✈️ اضغط على زر التذكرة لعرض تفاصيل رحلتك.',
      hi: ' ✈️ अपनी उड़ान की जानकारी देखने के लिए टिकट बटन पर टैप करें।',
    },
    // For hotel scenarios
    hotel: {
      en: ' 🏨 Tap the reservation button to view your booking details.',
      tr: ' 🏨 Rezervasyon detaylarınızı görmek için rezervasyon butonuna tıklayın.',
      es: ' 🏨 Toca el botón de reserva para ver los detalles de tu reservación.',
      fr: ' 🏨 Appuyez sur le bouton réservation pour voir les détails de votre réservation.',
      de: ' 🏨 Tippen Sie auf den Reservierung-Button, um Ihre Buchungsdetails anzuzeigen.',
      it: ' 🏨 Tocca il pulsante prenotazione per visualizzare i dettagli della prenotazione.',
      pt: ' 🏨 Toque no botão de reserva para ver os detalhes da sua reserva.',
      ja: ' 🏨 予約ボタンをタップして予約詳細を表示します。',
      ko: ' 🏨 예약 버튼을 눌러 예약 정보를 확인하세요.',
      zh: ' 🏨 点击预订按钮查看您的预订详情。',
      ru: ' 🏨 Нажмите кнопку бронирования, чтобы просмотреть детали брони.',
      ar: ' 🏨 اضغط على زر الحجز لعرض تفاصيل حجزك.',
      hi: ' 🏨 अपनी बुकिंग की जानकारी देखने के लिए आरक्षण बटन पर टैप करें।',
    },
    // For directions scenarios
    directions: {
      en: ' 🗺️ Tap the map button to view nearby locations.',
      tr: ' 🗺️ Yakındaki yerleri görmek için harita butonuna tıklayın.',
      es: ' 🗺️ Toca el botón del mapa para ver las ubicaciones cercanas.',
      fr: ' 🗺️ Appuyez sur le bouton carte pour voir les lieux à proximité.',
      de: ' 🗺️ Tippen Sie auf den Karten-Button, um nahegelegene Orte anzuzeigen.',
      it: ' 🗺️ Tocca il pulsante mappa per visualizzare i luoghi vicini.',
      pt: ' 🗺️ Toque no botão do mapa para ver os locais próximos.',
      ja: ' 🗺️ 地図ボタンをタップして周辺の場所を表示します。',
      ko: ' 🗺️ 지도 버튼을 눌러 주변 위치를 확인하세요.',
      zh: ' 🗺️ 点击地图按钮查看附近位置。',
      ru: ' 🗺️ Нажмите кнопку карты, чтобы просмотреть ближайшие места.',
      ar: ' 🗺️ اضغط على زر الخريطة لعرض المواقع القريبة.',
      hi: ' 🗺️ आस-पास के स्थानों को देखने के लिए मानचित्र बटन पर टैप करें।',
    },
  },
  DEFAULT_WELCOME: {
    en: 'Hello! How can I help you today?',
    tr: 'Merhaba! Bugün size nasıl yardımcı olabilirim?',
    es: '¡Hola! ¿En qué puedo ayudarte hoy?',
    fr: 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
    de: 'Hallo! Wie kann ich Ihnen heute helfen?',
    it: 'Ciao! Come posso aiutarti oggi?',
    pt: 'Olá! Como posso ajudar você hoje?',
    ja: 'こんにちは！今日はどのようなお手伝いができますか？',
    ko: '안녕하세요! 오늘 무엇을 도와드릴까요?',
    zh: '你好！今天有什么可以帮你的吗？',
    ru: 'Здравствуйте! Чем я могу вам помочь сегодня?',
    ar: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
    hi: 'नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूँ?',
  }
};

const generateWelcomeMessage = (specificWelcome, languageCode, hasMenu, menuType) => {
  const baseMessage = specificWelcome?.[languageCode] || COMMON_PHRASES.DEFAULT_WELCOME[languageCode] || COMMON_PHRASES.DEFAULT_WELCOME.en;

  if (!hasMenu) return baseMessage;

  // Get context-specific hint based on menuType
  let hintCategory = 'menu'; // default
  if (menuType === 'shopping') hintCategory = 'shopping';
  else if (menuType === 'airport') hintCategory = 'airport';
  else if (menuType === 'hotel') hintCategory = 'hotel';
  else if (menuType === 'directions') hintCategory = 'directions';

  const hints = COMMON_PHRASES.MENU_HINTS[hintCategory] || COMMON_PHRASES.MENU_HINTS.menu;
  const menuHint = hints[languageCode] || hints.en;

  return `${baseMessage}${menuHint}`;
};

export const SCENARIOS = {
  CAFE: {
    id: 'cafe',
    name: 'CAFÉ',
    icon: '☕',
    description: 'Practice ordering food and drinks',
    packId: 'free', // Free scenario
    hasMenu: true,
    menuType: 'cafe',
    welcomeMessages: {
      en: 'Welcome to our Café! What can I get started for you?',
      es: '¡Bienvenido a nuestro café! ¿Qué te gustaría pedir?',
      tr: 'Kafemize hoş geldiniz! Sizin için ne hazırlayabilirim?',
      fr: 'Bienvenue dans notre café! Que puis-je vous servir?',
      de: 'Willkommen in unserem Café! Was darf es sein?',
      hi: 'हमारे कैफे में आपका स्वागत है! मैं आपके लिए क्या ला सकता हूँ?',
    },
    systemPrompt: (language) => `You are a barista at a cozy café. The user is a customer speaking ${language}.
Context: It's a busy morning. You are friendly but efficient.
IMPORTANT: The customer can view the menu. ONLY offer items that are on the actual menu.
Goal: Help the customer order from the available menu items. Ask about sizes or milk preferences.`,
  },
  RESTAURANT: {
    id: 'restaurant',
    name: 'RESTAURANT',
    icon: '🍽️',
    description: 'Order meals and interact with waitstaff',
    packId: 'free', // Free scenario
    hasMenu: true,
    menuType: 'restaurant',
    welcomeMessages: {
      en: 'Good evening! A table for one?',
      es: '¡Buenas noches! ¿Una mesa para uno?',
      tr: 'İyi akşamlar! Tek kişilik masa mı?',
      fr: 'Bonsoir! Une table pour une personne?',
      hi: 'शुभ संध्या! क्या एक व्यक्ति के लिए मेज चाहिए?',
    },
    systemPrompt: (language) => `You are a waiter/waitress at a nice restaurant. The user is a diner speaking ${language}.
Context: It is dinner time. You are polite and attentive.
IMPORTANT: The customer can view the full menu. ONLY serve dishes that are on the actual menu.
Goal: Guide the customer through the available menu, take their order (appetizer, main, drink).`,
  },
  SHOPPING: {
    id: 'shopping',
    name: 'SHOPPING',
    icon: '🛍️',
    description: 'Buy items and ask about products',
    packId: 'free', // Free scenario
    hasMenu: true,
    menuType: 'shopping',
    welcomeMessages: {
      en: 'Hi there! Looking for anything specific today?',
      es: '¡Hola! ¿Buscas algo en específico hoy?',
      tr: 'Merhaba! Bugün özel olarak aradığınız bir şey var mı?',
      hi: 'नमस्ते! क्या आप आज कुछ खास ढूँढ रहे हैं?',
    },
    systemPrompt: (language) => `You are a shop assistant. The user is a shopper speaking ${language}.
Context: The user is looking for clothes. You have a specific catalog.
Goal: Help the user find items from your available stock. Suggest sizes and colors.`,
  },
  HOTEL: {
    id: 'hotel',
    name: 'HOTEL CHECK-IN',
    icon: '🏨',
    description: 'Check in and ask about hotel services',
    packId: 'travel', // Travel pack
    hasMenu: true,
    menuType: 'hotel',
    welcomeMessages: {
      en: 'Welcome to the Grand Hotel. Are you checking in?',
      es: 'Bienvenido al Gran Hotel. ¿Va a registrarse?',
      tr: 'Grand Hotel\'e hoş geldiniz. Giriş işleminizi yapalım mı?',
      hi: 'ग्रैंड होटल में आपका स्वागत है। क्या आप चेक-इन कर रहे हैं?',
    },
    systemPrompt: (language) => `You are a hotel receptionist. The user is a guest speaking ${language}.
Context: The guest has just arrived. You are professional.
Goal: Process the check-in using reservation details.`,
  },
  DIRECTIONS: {
    id: 'directions',
    name: 'DIRECTIONS',
    icon: '🗺️',
    description: 'Navigate and find places',
    packId: 'travel', // Travel pack
    hasMenu: true,
    menuType: 'directions',
    welcomeMessages: {
      en: 'Excuse me, do you look lost? Can I help you find your way?',
      es: 'Disculpa, ¿pareces perdido? ¿Puedo ayudarte?',
      tr: 'Pardon, kaybolmuş gibisiniz? Yardımcı olabilir miyim?',
      hi: 'क्षमा करें, क्या आप खो गए हैं? क्या मैं रास्ता खोजने में आपकी मदद कर सकता हूँ?',
    },
    systemPrompt: (language) => `You are a helpful local. The user is lost and speaking ${language}.
Context: You know the city well.
Goal: Help the user navigate using landmarks. Give clear, step-by-step directions.`,
  },
  SMALL_TALK: {
    id: 'small_talk',
    name: 'SMALL TALK',
    icon: '💬',
    description: 'Casual conversation practice',
    packId: 'social', // Social pack
    hasMenu: false,
    welcomeMessages: {
      en: 'Hi! Beautiful day to be at the park, isn\'t it?',
      es: '¡Hola! Es un día hermoso para estar en el parque, ¿verdad?',
      tr: 'Selam! Parkta olmak için harika bir gün, değil mi?',
      hi: 'नमस्ते! पार्क में आने के लिए यह एक सुंदर दिन है, है न?',
    },
    systemPrompt: (language) => `You are a friendly acquaintance meeting the user at a park. User speaks ${language}.
Context: It's a nice day. You are in a chatty mood.
Goal: Make casual conversation about hobbies, weather, or travel. Keep it light.`,
  },
  DOCTOR: {
    id: 'doctor',
    name: 'DOCTOR VISIT',
    icon: '⚕️',
    description: 'Describe symptoms and health concerns',
    packId: 'professional', // Professional pack
    hasMenu: false,
    welcomeMessages: {
      en: 'Good morning. What seems to be the problem today?',
      es: 'Buenos días. ¿Cuál parece ser el problema hoy?',
      tr: 'Günaydın. Bugün şikayetiniz nedir?',
      hi: 'सुप्रभात। आज आपको क्या समस्या हो रही है?',
    },
    systemPrompt: (language) => `You are a doctor. The user is a patient speaking ${language}.
Context: Clinical setting. You are professional and empathetic.
Goal: Ask about symptoms, duration, and pain levels. Give basic medical advice.`,
  },
  AIRPORT: {
    id: 'airport',
    name: 'AIRPORT',
    icon: '✈️',
    description: 'Check in and navigate the airport',
    packId: 'travel', // Travel pack
    hasMenu: true,
    menuType: 'airport',
    welcomeMessages: {
      en: 'Passport and ticket please. Where are you flying today?',
      es: 'Pasaporte y boleto, por favor. ¿A dónde vuela hoy?',
      tr: 'Pasaport ve bilet lütfen. Bugün nereye uçuyorsunuz?',
      hi: 'कृपया पासपोर्ट और टिकट दिखाएं। आज आप कहाँ उड़ान भर रहे हैं?',
    },
    systemPrompt: (language) => `You are an airline agent. The user is a traveler speaking ${language}.
Context: Check-in counter.
Goal: Process check-in, check bags, and confirm gate info.`,
  },
  TAXI: {
    id: 'taxi',
    name: 'TAXI',
    icon: '🚕',
    description: 'Give directions to a taxi driver',
    packId: 'travel', // Travel pack
    hasMenu: false,
    welcomeMessages: {
      en: 'Hop in! Where are we heading?',
      es: '¡Suba! ¿A dónde vamos?',
      tr: 'Buyurun! Nereye gidiyoruz?',
      hi: 'बैठिए! हम कहाँ जा रहे हैं?',
    },
    systemPrompt: (language) => `You are a taxi driver. The user is a passenger speaking ${language}.
Context: Driving in traffic.
Goal: Confirm destination and route. Make small talk about the city.`,
  },
  PHONE_CALL: {
    id: 'phone_call',
    name: 'PHONE CALL',
    icon: '📞',
    description: 'Make reservations or inquiries',
    packId: 'social', // Social pack
    hasMenu: false,
    welcomeMessages: {
      en: 'Pizza Palace, this is Mario speaking. How can I help?',
      es: 'Pizza Palace, habla Mario. ¿En qué puedo ayudarle?',
      tr: 'Pizza Palace, ben Mario. Nasıl yardımcı olabilirim?',
      hi: 'पिज़्ज़ा पैलेस, मैं मारियो बोल रहा हूँ। मैं आपकी कैसे मदद कर सकता हूँ?',
    },
    systemPrompt: (language) => `You are answering the phone at a restaurant. User speaks ${language}.
Context: Busy restaurant background noise.
Goal: Take a reservation (date, time, people).`,
  },
  // ========== FLIRTING & DATING PACK ==========
  DATING: {
    id: 'dating',
    name: 'FIRST DATE',
    icon: '❤️',
    description: 'Practice dating conversation skills',
    packId: 'dating', // Dating pack
    hasMenu: false,
    welcomeMessages: {
      en: 'Hey! So glad we finally met up. This place is really nice, right?',
      es: '¡Hola! Me alegro de que finalmente nos hayamos visto. Este lugar es muy bonito, ¿verdad?',
      tr: 'Selam! Sonunda buluştuğumuza çok sevindim. Burası çok güzel, değil mi?',
      hi: 'हाय! हम आखिरकार मिले, बहुत खुश हूं। यह जगह बहुत अच्छी है, है ना?',
    },
    systemPrompt: (language) => `You are on a first date with the user. User speaks ${language}.
Context: Casual coffee shop, relaxed atmosphere. You're friendly and interested.
Goal: Have a natural dating conversation - ask about hobbies, work, interests. Be flirty but respectful. Give compliments naturally.`,
  },
  FLIRTING: {
    id: 'flirting',
    name: 'PICKUP LINES',
    icon: '💕',
    description: 'Learn how to start conversations',
    packId: 'dating', // Dating pack
    hasMenu: false,
    welcomeMessages: {
      en: 'Hey there! Is this seat taken?',
      es: '¡Hola! ¿Este asiento está ocupado?',
      tr: 'Merhaba! Bu yer boş mu?',
      hi: 'अरे! क्या यह सीट खाली है?',
    },
    systemPrompt: (language) => `You are an attractive person at a bar/café who the user is trying to start a conversation with. User speaks ${language}.
Context: Casual social setting. You're open to conversation but they need to be charming.
Goal: Roleplay realistic flirting scenarios. React to their pickup lines - if cheesy, tease them. If smooth, be impressed. Teach natural conversation starters.`,
  },
  // Note: Business pack scenarios (Interview, Email, Office Jargon) are accessed via InterviewSetupScreen
  // ========== ROAST MODE ==========
  ROAST_MODE: {
    id: 'roast_mode',
    name: 'ROAST MY ACCENT',
    icon: '🔥',
    description: 'Get brutally honest feedback on your pronunciation',
    packId: 'premium', // Premium feature
    hasMenu: false,
    welcomeMessages: {
      en: '💪 Alright, let me hear you speak. I won\'t hold back!',
      es: '💪 Bien, déjame escucharte hablar. ¡No me contendré!',
      tr: '💪 Tamam, seni dinliyorum. Acımayacağım!',
      fr: '💪 Bien, laisse-moi t\'entendre parler. Je ne retiendrai pas mes coups!',
      de: '💪 Also gut, lass mich dich sprechen hören. Ich werde nicht zurückhalten!',
      hi: '💪 ठीक है, मुझे तुम्हें बोलते हुए सुनने दो। मैं नरम नहीं रहूंगा!',
    },
    systemPrompt: (language) => `You are a brutally honest accent coach giving feedback on the user's ${language} pronunciation.
Context: The user wants HARSH, FUNNY roast-style feedback on how they speak.
Your personality: You're a comedic accent critic - think Gordon Ramsay meets a language teacher.
IMPORTANT RULES:
1. Be BRUTALLY HONEST but FUNNY - roast their accent/pronunciation mistakes
2. Use humor and exaggeration, but stay helpful
3. Point out specific sounds they're mispronouncing
4. Give actual tips mixed with jokes
5. ALWAYS encourage them to try again
6. Use emojis and dramatic reactions
7. Compare their accent to funny things if appropriate
8. At the end, give one genuine piece of advice
9. DO NOT use asterisks (*) for actions - just use emojis or plain text
Goal: Make learning pronunciation FUN through comedy. Be mean but motivating!`,
  },
};

export const LANGUAGES = {
  ENGLISH: { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  SPANISH: { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  FRENCH: { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  GERMAN: { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  ITALIAN: { code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  PORTUGUESE: { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  TURKISH: { code: 'tr', name: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
  JAPANESE: { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  KOREAN: { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  CHINESE: { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  RUSSIAN: { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  ARABIC: { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  HINDI: { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' }
};

export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    dailyLimit: 10,
    model: 'gpt-3.5-turbo',
    features: ['10 conversations per day', 'Basic scenarios', 'Correction mode']
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    dailyLimit: 50,
    model: 'gpt-5',
    price: '$9.99/month',
    features: ['Infinite conversations', 'All scenarios', 'GPT-4 powered', 'Priority support', 'Voice mode']
  }
};

export const getScenarioGreeting = (scenarioId, languageCode) => {
  const scenario = SCENARIOS[scenarioId.toUpperCase()];
  if (!scenario) return '';
  return generateWelcomeMessage(scenario.welcomeMessages, languageCode, scenario.hasMenu, scenario.menuType);
};
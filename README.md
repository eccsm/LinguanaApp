# 🦎 LinguanaApp

LinguanaApp is an AI-powered language learning application built with React Native. It uses advanced roleplay scenarios to help users practice real-world conversations in multiple languages.

## 🚀 Features

### 🗣️ Immersive Roleplay
Practice languages in realistic scenarios:
- **Cafe & Restaurant:** Order food and interact with staff.
- **Shopping:** Buy clothes and ask for sizes.
- **Travel:** Check into hotels, ask for directions, and navigate airports.
- **Professional:** Doctor visits and job interviews.

### 🤖 AI-Powered Learning
- **Dual Modes:**
  - **Tutor Mode:** Receive instant grammatical corrections and feedback.
  - **Roleplay Mode:** Immerse yourself in the character without interruptions.
- **Voice Integration:**
  - **Speech-to-Text (STT):** Speak naturally to the AI using our custom Turbo STT engine.
  - **Text-to-Speech (TTS):** Hear realistic AI responses (powered by OpenAI).

### 💎 Freemium Model
We offer a balanced freemium model to ensure accessibility while sustaining the platform:

| Feature | Free Tier (Base) | Free Tier (With Ads) | Pro Tier |
| :--- | :--- | :--- | :--- |
| **Daily Conversations** | 10 / day | +1 per ad (Max 5 ads) | **Unlimited** |
| **Messages per Chat** | 10 messages | +5 per ad (Extend chat) | **Unlimited** |
| **Voice Conversations**| 0 / day | +1 per ad (Max 3 ads) | **Unlimited** |

### 🌍 Supported Languages
- English 🇬🇧
- Spanish 🇪🇸
- French 🇫🇷
- German 🇩🇪
- Italian 🇮🇹
- Portuguese 🇵🇹
- Turkish 🇹🇷
- Japanese 🇯🇵
- Korean 🇰🇷
- Chinese 🇨🇳
- Russian 🇷🇺
- Arabic 🇸🇦

---

## 🛠️ Tech Stack

- **Framework:** React Native (0.76.0)
- **Language:** JavaScript
- **Navigation:** React Navigation 7
- **Backend:** Node.js (Hosted on Vercel)
- **Database & Auth:** Firebase (Firestore, Authentication)
- **AI Provider:** OpenAI (GPT-3.5/4, Whisper, TTS)
- **State Management:** React Context API + Async Storage

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js >= 18
- JDK 17
- Android Studio / Xcode

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/eccsm/LinguanaApp.git

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with the following keys:

```env
# Backend
BACKEND_URL=https://your-vercel-backend.app/
APP_CLIENT_SECRET=your_client_secret

# OpenAI (If using direct client - recommended to use backend proxy)
OPENAI_API_KEY=sk-...
OPENAI_MODEL_FREE=gpt-3.5-turbo
OPENAI_MODEL_PRO=gpt-4

# Firebase
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_APP_ID=...
GOOGLE_WEB_CLIENT_ID=...
```

### 4. Firebase Native Config
`google-services.json` and `GoogleService-Info.plist` are **not** committed because they contain API keys.
Download them from the Firebase console (Project settings → Your apps) and place them at:

- `android/app/google-services.json`
- `ios/LinguanaApp/GoogleService-Info.plist`

See `android/app/google-services.example.json` and `ios/LinguanaApp/GoogleService-Info.example.plist` for the expected shape.

### 5. Running the App

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

---

## 📂 Project Structure

```
LinguanaApp/
├── src/
│   ├── components/      # Reusable UI components (Modals, Viewers)
│   ├── constants/       # Static data (Scenarios, Menus, Languages)
│   ├── contexts/        # Global state (Auth, Theme, Usage Tracking)
│   ├── screens/         # Main application screens
│   ├── services/        # API services (Firebase, Voice, Ads)
│   └── utils/           # Helper functions
├── android/             # Android native code
├── ios/                 # iOS native code
└── README.md            # Project documentation
```

## 🐛 Troubleshooting

**Voice Response Not Working?**
- Ensure `BACKEND_URL` is correctly set in `.env`.
- Check if the user has permission to use voice (Pro tier or Ad reward).

**Build Errors?**
- Try cleaning the build folder: `cd android && ./gradlew clean`.
- Ensure your Kotlin version matches the project requirements (see `KOTLIN_VERSION_FIX.md`).

---

## 📜 License
[MIT](LICENSE)

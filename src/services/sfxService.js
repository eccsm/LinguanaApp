/**
 * SFX Service - Plays local sound effects for the vocabulary deck
 * Uses react-native-sound (already a project dependency)
 */
import Sound from 'react-native-sound';
import { Platform, Vibration } from 'react-native';
import Logger from '../utils/logger';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

// Storage keys
const SFX_ENABLED_KEY = '@linguana_sfx_enabled';
const VIBRATION_ENABLED_KEY = '@linguana_vibration_enabled';

class SfxService {
    constructor() {
        console.log('[SFX] 🔊 SfxService constructor called');
        this.sounds = {};
        this.loadedSounds = {}; // Track which sounds are fully loaded
        this.initialized = false;
        this.sfxEnabled = true; // Default enabled
        this.vibrationEnabled = true; // Default enabled
        this.initializeSounds();
    }

    // Initialize settings from User Profile (called by AppContext)
    initializeSettings(sfxEnabled, vibrationEnabled) {
        this.sfxEnabled = sfxEnabled ?? true;
        this.vibrationEnabled = vibrationEnabled ?? true;
        console.log(`[SFX] Settings initialized: sfx=${this.sfxEnabled}, vibration=${this.vibrationEnabled}`);
    }

    // Enable/Disable SFX (State only, persistence handled by AppContext)
    setSfxEnabled(enabled) {
        this.sfxEnabled = enabled;
        console.log(`[SFX] SFX set to ${enabled}`);
    }

    isSfxEnabled() {
        return this.sfxEnabled;
    }

    // Enable/Disable Vibration (State only, persistence handled by AppContext)
    setVibrationEnabled(enabled) {
        this.vibrationEnabled = enabled;
        console.log(`[SFX] Vibration set to ${enabled}`);
    }

    isVibrationEnabled() {
        return this.vibrationEnabled;
    }

    // Trigger vibration (respects settings)
    vibrate(duration = 50) {
        if (this.vibrationEnabled) {
            Vibration.vibrate(duration);
        }
    }

    initializeSounds() {
        console.log('[SFX] 🔊 initializeSounds called, initialized:', this.initialized);
        if (this.initialized) return;

        // Sound file names (without extension for Android, with extension for iOS)
        const soundFiles = {
            flip: 'flip',
            easy: 'easy',
            moderate: 'moderate',
            hard: 'hard',
            // Daily challenge sounds
            correct: 'correct',
            fail: 'fail',
            successFinish: 'success_finishing',
            failedFinish: 'failed_finish',
            wrong: 'wrong',
            lastChance: 'last_chance',
            puzzleSuccess: 'puzzle_success',
            already: 'already',
        };

        console.log('[SFX] 🔊 Platform:', Platform.OS);

        Object.entries(soundFiles).forEach(([key, baseName]) => {
            // Android needs filename without extension from res/raw
            // iOS needs filename with extension from bundle
            const filename = Platform.OS === 'android' ? baseName : `${baseName}.wav`;

            console.log(`[SFX] 🔊 Loading sound: ${key} -> ${filename}`);

            this.loadedSounds[key] = false;

            this.sounds[key] = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
                if (error) {
                    console.log(`[SFX] ❌ Failed to load ${filename}:`, error?.message || error);
                    this.sounds[key] = null;
                    this.loadedSounds[key] = false;
                } else {
                    console.log(`[SFX] ✅ Loaded ${filename}`);
                    this.loadedSounds[key] = true;
                }
            });
        });


        this.initialized = true;
        console.log('[SFX] 🔊 initializeSounds complete');
    }

    /**
     * Play a sound effect (with debounce to prevent duplicates)
     * @param {string} name - Sound name: 'flip', 'easy', 'moderate', 'hard', 'correct', 'fail', 'successFinish', 'failedFinish'
     */
    play(name) {
        // Check if SFX is enabled
        if (!this.sfxEnabled) {
            return;
        }

        console.log(`[SFX] 🔊 play("${name}") called`);

        const sound = this.sounds[name];

        // Check if sound exists and is loaded
        if (!sound) {
            console.log(`[SFX] ❌ Sound "${name}" object is null/undefined`);
            return;
        }

        if (!this.loadedSounds[name]) {
            console.log(`[SFX] ❌ Sound "${name}" not loaded yet`);
            return;
        }

        // Debounce: prevent same sound from playing twice within 1 second
        const now = Date.now();
        const lastPlayed = this.lastPlayedTime?.[name] || 0;
        if (now - lastPlayed < 2000) {
            console.log(`[SFX] ⏳ Sound "${name}" debounced (played ${now - lastPlayed}ms ago)`);
            return;
        }

        // Track last played time
        if (!this.lastPlayedTime) this.lastPlayedTime = {};
        this.lastPlayedTime[name] = now;

        try {
            console.log(`[SFX] 🔊 Playing sound "${name}"...`);
            this.playSound(sound, name);
        } catch (error) {
            console.log(`[SFX] ❌ Error playing ${name}:`, error);
        }
    }

    /**
     * Internal method to play a sound
     */
    playSound(sound, name) {
        try {
            sound.setCurrentTime(0);
            sound.play((success) => {
                if (success) {
                    console.log(`[SFX] ✅ Played ${name} successfully`);
                } else {
                    console.log(`[SFX] ❌ Failed to play ${name}`);
                }
            });
        } catch (error) {
            console.log(`[SFX] ❌ Error in playSound ${name}:`, error);
        }
    }

    // Convenience methods - Vocabulary deck
    playFlip() {
        this.play('flip');
    }

    playEasy() {
        this.play('easy');
    }

    playModerate() {
        this.play('moderate');
    }

    playHard() {
        this.play('hard');
    }

    // Convenience methods - Daily challenge
    playCorrect() {
        this.play('correct');
    }

    playFail() {
        this.play('fail');
    }

    playSuccessFinish() {
        this.play('successFinish');
    }

    playFailedFinish() {
        this.play('failedFinish');
    }

    playWrong() {
        this.play('wrong');
    }

    playLastChance() {
        this.play('lastChance');
    }

    playPuzzleSuccess() {
        this.play('puzzleSuccess');
    }

    playAlready() {
        this.play('already');
    }

    /**
     * Clean up sounds when no longer needed
     */
    release() {
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.release();
            }
        });
        this.sounds = {};
        this.initialized = false;
    }
}

export default new SfxService();

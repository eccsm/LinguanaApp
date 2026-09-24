import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';
import Logger from '../utils/logger';

Sound.setCategory('Playback');

class VoiceService {
  constructor() {
    this.sound = null;
    this.isSpeaking = false;
    this.serverUrl = BACKEND_URL;
  }

  async speak(text, voice = 'alloy') {
    await this.stopSpeaking();

    if (!text) return;

    try {
      this.isSpeaking = true;
      Logger.log(`🔄 Requesting TTS (Voice: ${voice})...`);

      const response = await axios.post(
        `${this.serverUrl}/api/speak`,
        {
          text: text,
          voice: voice
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-client-secret': APP_CLIENT_SECRET
          }
        }
      );

      if (!response.data.audio) {
        throw new Error('No audio data received from server');
      }

      // Save the base64 audio to a temp file
      const path = `${RNFS.CachesDirectoryPath}/temp_speech.mp3`;
      await RNFS.writeFile(path, response.data.audio, 'base64');

      // Play the audio
      return new Promise((resolve, reject) => {
        this.sound = new Sound(path, '', (error) => {
          if (error) {
            Logger.error('❌ Failed to load sound', error);
            this.isSpeaking = false;
            reject(error);
            return;
          }

          Logger.log('🔊 Playing audio...');
          this.sound.play((success) => {
            if (success) {
              Logger.log('✅ Playback finished');
            } else {
              Logger.error('❌ Playback failed');
            }
            // Cleanup after finishing
            this.isSpeaking = false;
            this.sound = null;
            resolve();
          });
        });
      });

    } catch (error) {
      this.isSpeaking = false;

      // Specific check for Handshake failure
      if (error.response?.status === 401) {
        Logger.error('⛔ Handshake Failed! Check APP_CLIENT_SECRET in .env');
      } else {
        Logger.error('❌ VoiceService Error:', error.message);
      }
    }
  }

  async stopSpeaking() {
    if (this.sound) {
      try {
        this.sound.stop();
        this.sound.release();
      } catch (e) {
        Logger.log('⚠️ Error stopping sound (might already be released)', e);
      }
      this.sound = null;
    }
    this.isSpeaking = false;
  }

  isCurrentlySpeaking() {
    return this.isSpeaking;
  }

  async destroy() {
    await this.stopSpeaking();
  }
}

export default new VoiceService();
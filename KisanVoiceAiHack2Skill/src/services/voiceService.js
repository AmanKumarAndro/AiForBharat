import Voice from '@react-native-voice/voice';

class VoiceService {
  constructor() {
    this.isListening = false;
    this.onSpeechResults = null;
    this.onSpeechError = null;
    this.onSpeechStartCallback = null;
    this.onSpeechEndCallback = null;
    this.isInitialized = true;

    // Set up voice listeners
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechRecognized = this.onSpeechRecognized.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechError = this.handleSpeechError.bind(this);
    Voice.onSpeechResults = this.handleSpeechResults.bind(this);
  }

  onSpeechStart(e) {
    if (this.onSpeechStartCallback) {
      this.onSpeechStartCallback(e);
    }
  }

  onSpeechRecognized(e) {
    console.log('Voice recognized:', e);
  }

  onSpeechEnd(e) {
    this.isListening = false;
    if (this.onSpeechEndCallback) {
      this.onSpeechEndCallback(e);
    }
  }

  handleSpeechError(e) {
    this.isListening = false;
    if (this.onSpeechError) {
      this.onSpeechError(e);
    }
  }

  handleSpeechResults(e) {
    if (e.value && e.value.length > 0) {
      // Pick the most confident result (the first one)
      if (this.onSpeechResults) {
        this.onSpeechResults(e.value[0]);
      }
    }
  }

  async startListening(language = 'hi-IN') {
    if (this.isListening) return false;

    try {
      this.isListening = true;
      await Voice.start(language);
      return true;
    } catch (e) {
      this.isListening = false;
      console.error('Failed to start Voice:', e);
      return false;
    }
  }

  async stopListening() {
    try {
      await Voice.stop();
      this.isListening = false;
      return true;
    } catch (e) {
      console.error('Failed to stop Voice:', e);
      return false;
    }
  }

  async cancelListening() {
    try {
      await Voice.cancel();
      this.isListening = false;
      return true;
    } catch (e) {
      console.error('Failed to cancel Voice:', e);
      return false;
    }
  }

  async destroyVoice() {
    try {
      await Voice.destroy();
      this.isInitialized = false;
      this.isListening = false;
      return true;
    } catch (e) {
      console.error('Failed to destroy Voice:', e);
      return false;
    }
  }

  async isAvailable() {
    try {
      return await Voice.isAvailable();
    } catch (e) {
      return false;
    }
  }

  setCallbacks({ onStart, onEnd, onResults, onError }) {
    this.onSpeechStartCallback = onStart;
    this.onSpeechEndCallback = onEnd;
    this.onSpeechResults = onResults;
    this.onSpeechError = onError;
  }
}

export default new VoiceService();

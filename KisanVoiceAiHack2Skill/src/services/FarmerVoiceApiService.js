import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev';

class FarmerVoiceApiService {
    constructor() {
        this.sessionId = null;
    }

    // Generate or retrieve persistent session ID
    async getOrCreateSessionId() {
        if (this.sessionId) return this.sessionId;

        try {
            let storedSessionId = await AsyncStorage.getItem('voice_session_id');
            if (!storedSessionId) {
                storedSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
                await AsyncStorage.setItem('voice_session_id', storedSessionId);
            }
            this.sessionId = storedSessionId;
            return storedSessionId;
        } catch (error) {
            console.error('Error getting/setting session ID:', error);
            // Fallback if AsyncStorage fails
            this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            return this.sessionId;
        }
    }

    // Clear current session context
    async resetSession() {
        try {
            await AsyncStorage.removeItem('voice_session_id');
            this.sessionId = null;
        } catch (error) {
            console.error('Error removing session ID:', error);
        }
    }

    // Complete end-to-end Voice Query Pipeline
    async sendVoiceQuery(audioBase64) {
        const sessionId = await this.getOrCreateSessionId();

        try {
            const response = await fetch(`${API_BASE_URL}/voice-query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audioBase64,
                    sessionId,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in sendVoiceQuery:', error);
            throw error;
        }
    }

    // Speech-to-Text Only
    async transcribeAudio(audioBase64) {
        const sessionId = await this.getOrCreateSessionId();

        try {
            const response = await fetch(`${API_BASE_URL}/transcribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audioBase64,
                    sessionId,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in transcribeAudio:', error);
            throw error;
        }
    }

    // Text-to-Speech Only
    async synthesizeText(text) {
        const sessionId = await this.getOrCreateSessionId();

        try {
            const response = await fetch(`${API_BASE_URL}/synthesize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    sessionId,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in synthesizeText:', error);
            throw error;
        }
    }
    // Text query → AI answer (no audio/S3 required)
    async askQuestion(question) {
        const sessionId = await this.getOrCreateSessionId();
        try {
            const response = await fetch(`${API_BASE_URL}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, sessionId }),
            });
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error in askQuestion:', error);
            throw error;
        }
    }

    // Get conversation history
    async getHistory(limit = 10) {
        const sessionId = await this.getOrCreateSessionId();
        try {
            const response = await fetch(`${API_BASE_URL}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, limit }),
            });
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error in getHistory:', error);
            throw error;
        }
    }
}

// Export singleton instance
const farmerVoiceApi = new FarmerVoiceApiService();
export default farmerVoiceApi;


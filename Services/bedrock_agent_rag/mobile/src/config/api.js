// API Configuration for Farmer Voice AI Backend
// Backend deployed at: ap-south-1 (Mumbai)

export const API_CONFIG = {
  // Base URL for all API requests
  BASE_URL: 'https://kqndxs5w8c.execute-api.ap-south-1.amazonaws.com/dev',
  
  // API Endpoints
  ENDPOINTS: {
    QUERY: '/query',              // Text query with context awareness
    VOICE_QUERY: '/voice-query',  // Complete voice pipeline (STT → LLM → TTS)
    SYNTHESIZE: '/synthesize',    // Text-to-speech only
    TRANSCRIBE: '/transcribe',    // Speech-to-text only
    HISTORY: '/history',          // Get conversation history
    AGENT_QUERY: '/agent-query'   // Bedrock Agent (when working)
  },
  
  // Timeouts (in milliseconds)
  TIMEOUT: 30000,           // 30 seconds for text queries
  VOICE_TIMEOUT: 60000,     // 60 seconds for voice queries
  
  // Real-time communication
  POLLING_INTERVAL: 2000,   // 2 seconds for polling updates
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,        // 1 second between retries
  
  // Development settings
  ENABLE_LOGGING: __DEV__,  // Enable detailed logging in development
};

// Generate unique session ID
export const generateSessionId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// API Response Status Codes
export const STATUS_CODES = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  TIMEOUT: 408
};

// Error Messages (Hindi)
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'इंटरनेट कनेक्शन की जांच करें',
  TIMEOUT: 'समय समाप्त। कृपया पुनः प्रयास करें।',
  SERVER_ERROR: 'सर्वर में समस्या। कृपया बाद में प्रयास करें।',
  INVALID_INPUT: 'कृपया सही जानकारी दें',
  PERMISSION_DENIED: 'अनुमति की आवश्यकता है',
  UNKNOWN_ERROR: 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।'
};

// Backend Information
export const BACKEND_INFO = {
  REGION: 'ap-south-1',
  MODEL: 'Meta Llama 3 8B Instruct',
  TTS_VOICE: 'Kajal (Hindi Neural)',
  STT_LANGUAGE: 'hi-IN',
  COST_PER_QUERY: 0.0002,  // USD
  AVG_LATENCY_TEXT: 3000,  // 3 seconds
  AVG_LATENCY_VOICE: 10000 // 10 seconds
};

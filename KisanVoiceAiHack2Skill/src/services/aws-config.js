// AWS Configuration
// Add your AWS credentials and region here

export const AWS_CONFIG = {
  region: 'ap-south-1', // Mumbai region for India
  credentials: {
    accessKeyId: 'YOUR_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
  },
};

export const BEDROCK_CONFIG = {
  modelId: 'anthropic.claude-v2',
  region: 'us-east-1',
};

export const TRANSCRIBE_CONFIG = {
  languageCode: 'hi-IN', // Hindi
  sampleRate: 16000,
};

export const POLLY_CONFIG = {
  languageCode: 'hi-IN',
  voiceId: 'Aditi', // Hindi female voice
  engine: 'neural',
};

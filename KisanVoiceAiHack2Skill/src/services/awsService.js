import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { Buffer } from 'buffer';
import RNFS from 'react-native-fs';
import SoundPlayer from 'react-native-sound-player';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION_BEDROCK, AWS_REGION_POLLY } from '@env';

class AWSService {
  constructor() {
    this.isInitialized = false;
    this.bedrockClient = null;
    this.pollyClient = null;
  }

  // Initialize AWS services
  async initialize(config) {
    try {
      this.bedrockClient = new BedrockRuntimeClient({
        region: AWS_REGION_BEDROCK || 'us-west-2',
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID || '',
          secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
        },
      });

      this.pollyClient = new PollyClient({
        region: AWS_REGION_POLLY || 'ap-south-1',
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID || '',
          secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
        },
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('AWS initialization error:', error);
      return false;
    }
  }

  // Get AI response from Bedrock using ConverseCommand (model-agnostic API)
  // Primary: Claude 3.5 Sonnet V2 (cross-region), Fallback: Amazon Nova Lite
  async getAIResponse(question, language = 'hi') {
    const systemPrompt = `You are an agricultural expert for Indian farmers. Answer this farmer's question in ${language === 'hi' ? 'Hindi' : 'English'}. Base your answers on ICAR best practices. Be concise and practical. Keep your answer under 200 words.`;

    // Models to try in order (cross-region IDs work across all regions)
    const modelsToTry = [
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0',  // Claude 3.5 Sonnet V2 cross-region
      'us.anthropic.claude-3-haiku-20240307-v1:0',      // Claude 3 Haiku cross-region
      'amazon.nova-lite-v1:0',                           // Amazon Nova Lite
      'amazon.nova-micro-v1:0',                          // Amazon Nova Micro
    ];

    for (const modelId of modelsToTry) {
      try {
        console.log(`Trying Bedrock model: ${modelId}`);

        const command = new ConverseCommand({
          modelId: modelId,
          system: [{ text: systemPrompt }],
          messages: [
            {
              role: 'user',
              content: [{ text: question }],
            },
          ],
          inferenceConfig: {
            maxTokens: 500,
            temperature: 0.7,
          },
        });

        const response = await this.bedrockClient.send(command);

        const outputText = response.output?.message?.content?.[0]?.text || 'No response generated.';

        console.log(`Bedrock success with model: ${modelId}`);

        return {
          text: outputText.trim(),
          source: 'ICAR Database (Bedrock)',
          confidence: 0.95,
        };
      } catch (error) {
        console.warn(`Model ${modelId} failed:`, error.name, error.message);
        // Continue to next model
      }
    }

    // All models failed — return fallback
    console.error('Bedrock API error: All models failed');
    return {
      text: language === 'hi'
        ? 'मुझे इस सवाल का जवाब नहीं मिला। कृपया अपने नजदीकी कृषि विज्ञान केंद्र से संपर्क करें।'
        : 'I could not find an answer to this question. Please contact your nearest Krishi Vigyan Kendra.',
      source: 'Error Fallback',
      confidence: 0,
    };
  }

  // Convert text to speech using Polly
  async textToSpeech(text, language = 'hi-IN') {
    return new Promise(async (resolve, reject) => {
      try {
        const command = new SynthesizeSpeechCommand({
          Engine: 'neural',
          LanguageCode: language,
          OutputFormat: 'mp3',
          Text: text,
          TextType: 'text',
          VoiceId: language === 'hi-IN' ? 'Kajal' : 'Joanna', // Kajal is neural Hindi voice
        });

        const response = await this.pollyClient.send(command);

        let audioBuffer;

        // AWS SDK in React Native environments often returns a Blob or Uint8Array instead of a Node.js stream block
        if (response.AudioStream.transformToByteArray) {
          const byteArray = await response.AudioStream.transformToByteArray();
          audioBuffer = Buffer.from(byteArray);
        } else if (response.AudioStream instanceof Blob) {
          const arrayBuffer = await new Response(response.AudioStream).arrayBuffer();
          audioBuffer = Buffer.from(arrayBuffer);
        } else if (response.AudioStream instanceof Uint8Array) {
          audioBuffer = Buffer.from(response.AudioStream);
        } else {
          // Attempt default stream fallback
          const chunks = [];
          for await (const chunk of response.AudioStream) {
            chunks.push(chunk);
          }
          audioBuffer = Buffer.concat(chunks);
        }

        // Save to file system
        const path = `${RNFS.DocumentDirectoryPath}/response.mp3`;
        await RNFS.writeFile(path, audioBuffer.toString('base64'), 'base64');

        // Play the sound
        SoundPlayer.addEventListener('FinishedPlaying', ({ success }) => {
          if (success) {
            resolve({ duration: 5000 }); // SoundPlayer doesn't simply expose duration, use dummy value for Q&A timeout
          } else {
            reject(new Error('Playback failed'));
          }
        });
        SoundPlayer.playUrl(`file://${path}`);
      } catch (error) {
        console.error('Polly TTS error:', error);
        reject(error);
      }
    });
  }

  isReady() {
    return this.isInitialized;
  }
}

export default new AWSService();

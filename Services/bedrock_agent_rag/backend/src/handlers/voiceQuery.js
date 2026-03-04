const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { BedrockAgentRuntimeClient, RetrieveCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { 
  addConversationTurn, 
  getConversationHistory, 
  buildContextPrompt,
  isFollowUpQuestion 
} = require('../utils/contextManager');

const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const agentClient = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const pollyClient = new PollyClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

const SYSTEM_PROMPT = `You are an agricultural advisor helping Indian farmers.
Provide answers based on verified ICAR, FSSAI, and CIBRC data.
Answer in simple Hindi with numbered steps. Cite sources at the end.
If the farmer refers to previous conversation, consider that context.`;

async function transcribeAudio(audioBase64, sessionId, bucketName) {
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const s3Key = `audio-input/${sessionId}-${Date.now()}.wav`;

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: audioBuffer,
    ContentType: 'audio/wav'
  }));

  const jobName = `transcribe-${sessionId}-${Date.now()}`;
  await transcribeClient.send(new StartTranscriptionJobCommand({
    TranscriptionJobName: jobName,
    LanguageCode: 'hi-IN',
    MediaFormat: 'wav',
    Media: { MediaFileUri: `s3://${bucketName}/${s3Key}` }
  }));

  let attempts = 0;
  while (attempts < 20) {
    const result = await transcribeClient.send(new GetTranscriptionJobCommand({
      TranscriptionJobName: jobName
    }));

    if (result.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
      const transcriptUri = result.TranscriptionJob.Transcript.TranscriptFileUri;
      const response = await fetch(transcriptUri);
      const transcript = await response.json();
      return transcript.results.transcripts[0].transcript;
    } else if (result.TranscriptionJob.TranscriptionJobStatus === 'FAILED') {
      throw new Error('Transcription failed');
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }

  throw new Error('Transcription timeout');
}

async function retrieveAndGenerate(question, sessionId) {
  const kbId = process.env.KNOWLEDGE_BASE_ID;
  let context = '';
  let source = 'ICAR Knowledge Base';

  // Get conversation history
  const history = await getConversationHistory(sessionId, 3);

  if (kbId) {
    try {
      const response = await agentClient.send(new RetrieveCommand({
        knowledgeBaseId: kbId,
        retrievalQuery: { text: question },
        retrievalConfiguration: {
          vectorSearchConfiguration: { numberOfResults: 3 }
        }
      }));

      if (response.retrievalResults?.length > 0) {
        context = response.retrievalResults.map((doc, idx) => 
          `[${idx + 1}] ${doc.content.text}`
        ).join('\n\n');
        source = response.retrievalResults[0].location?.s3Location?.uri || source;
      }
    } catch (error) {
      console.error('KB retrieval error:', error);
    }
  }

  const basePrompt = `${SYSTEM_PROMPT}

संदर्भ (ज्ञान आधार):
${context || 'कोई विशिष्ट संदर्भ उपलब्ध नहीं है।'}`;

  const prompt = buildContextPrompt(question, history, basePrompt);

  // Using Google Gemma 3 4B (free, no payment required)
  const payload = {
    messages: [{
      role: "user",
      content: [{ text: prompt }]
    }],
    inferenceConfig: {
      maxTokens: 1000,
      temperature: 0.7,
      topP: 0.9
    }
  };

  const response = await bedrockClient.send(new InvokeModelCommand({
    modelId: 'google.gemma-3-4b-it',
    body: JSON.stringify(payload),
    contentType: 'application/json',
    accept: 'application/json'
  }));

  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return { answer: responseBody.output.message.content[0].text, source };
}

async function synthesizeSpeech(text) {
  const response = await pollyClient.send(new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: 'Kajal',
    Engine: 'neural',
    LanguageCode: 'hi-IN'
  }));

  const chunks = [];
  for await (const chunk of response.AudioStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('base64');
}



exports.handler = async (event) => {
  const startTime = Date.now();
  
  try {
    const body = JSON.parse(event.body);
    const { audioBase64, sessionId } = body;

    if (!audioBase64 || !sessionId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'audioBase64 and sessionId are required' })
      };
    }

    const bucketName = `farmer-voice-ai-${process.env.STAGE || 'dev'}-audio`;

    // Step 1: Transcribe
    const transcription = await transcribeAudio(audioBase64, sessionId, bucketName);

    // Check if follow-up question
    const isFollowUp = isFollowUpQuestion(transcription);

    // Step 2: RAG + LLM (with context awareness)
    const { answer, source } = await retrieveAndGenerate(transcription, sessionId);

    // Step 3: TTS
    const audioBase64Response = await synthesizeSpeech(answer);

    const latency = Date.now() - startTime;

    // Get conversation history count
    const history = await getConversationHistory(sessionId, 10);

    // Store conversation turn
    await addConversationTurn(sessionId, transcription, answer, {
      source,
      latency,
      isLiveAnswer: false
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        transcription,
        answer,
        source,
        audioBase64: audioBase64Response,
        latency,
        sessionId,
        isFollowUp,
        conversationTurns: history.length + 1
      })
    };

  } catch (error) {
    console.error('Voice query error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

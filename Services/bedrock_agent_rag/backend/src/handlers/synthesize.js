const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');

const pollyClient = new PollyClient({ region: process.env.AWS_REGION || 'ap-south-1' });

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { text, sessionId } = body;

    if (!text || !sessionId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'text and sessionId are required' })
      };
    }

    const response = await pollyClient.send(new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: 'Kajal',
      Engine: 'neural',
      LanguageCode: 'hi-IN'
    }));

    // Convert stream to base64
    const audioStream = response.AudioStream;
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const audioBase64 = audioBuffer.toString('base64');

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        audioBase64,
        sessionId
      })
    };

  } catch (error) {
    console.error('Synthesis error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

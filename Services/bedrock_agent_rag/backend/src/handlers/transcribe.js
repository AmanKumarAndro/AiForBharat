const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

exports.handler = async (event) => {
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

    // Upload audio to S3
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const s3Key = `audio-input/${sessionId}-${Date.now()}.wav`;
    const bucketName = `${process.env.AWS_LAMBDA_FUNCTION_NAME}-audio`.replace(/-transcribe$/, '-audio');

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: audioBuffer,
      ContentType: 'audio/wav'
    }));

    // Start transcription job
    const jobName = `transcribe-${sessionId}-${Date.now()}`;
    await transcribeClient.send(new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: 'hi-IN',
      MediaFormat: 'wav',
      Media: {
        MediaFileUri: `s3://${bucketName}/${s3Key}`
      },
      Settings: {
        VocabularyName: 'farming-terms' // Optional: create custom vocabulary
      }
    }));

    // Poll for completion (simplified for demo)
    let transcriptionText = '';
    let attempts = 0;
    while (attempts < 20) {
      const result = await transcribeClient.send(new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      }));

      if (result.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
        const transcriptUri = result.TranscriptionJob.Transcript.TranscriptFileUri;
        const response = await fetch(transcriptUri);
        const transcript = await response.json();
        transcriptionText = transcript.results.transcripts[0].transcript;
        break;
      } else if (result.TranscriptionJob.TranscriptionJobStatus === 'FAILED') {
        throw new Error('Transcription failed');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        transcription: transcriptionText,
        sessionId
      })
    };

  } catch (error) {
    console.error('Transcription error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

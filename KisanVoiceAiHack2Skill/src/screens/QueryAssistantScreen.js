import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVModeIOSOption,
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import SoundPlayer from 'react-native-sound-player';
import Header from '../components/Header';
import farmerVoiceApi from '../services/FarmerVoiceApiService';
import { COLORS } from '../utils/constants';
import { requestMicrophonePermission } from '../utils/permissions';

const audioRecorderPlayer = new AudioRecorderPlayer();

const QueryAssistantScreen = ({ navigation }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barHeights = useRef([
    new Animated.Value(40),
    new Animated.Value(60),
    new Animated.Value(50),
    new Animated.Value(70),
    new Animated.Value(45),
    new Animated.Value(65),
    new Animated.Value(55),
  ]).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopRecorder().catch(() => { });
      audioRecorderPlayer.stopPlayer().catch(() => { });
      SoundPlayer.stop();
    };
  }, []);

  // Set up SoundPlayer listeners
  useEffect(() => {
    const onFinishedPlaying = SoundPlayer.addEventListener('FinishedPlaying', (obj) => {
      setIsSpeaking(false);
      setStatus('idle');
    });

    return () => {
      onFinishedPlaying.remove();
    };
  }, []);

  useEffect(() => {
    const startPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    const startBarAnimation = () => {
      barHeights.forEach((height, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(height, {
              toValue: Math.random() * 50 + 40,
              duration: 300 + index * 50,
              useNativeDriver: false,
            }),
            Animated.timing(height, {
              toValue: Math.random() * 50 + 40,
              duration: 300 + index * 50,
              useNativeDriver: false,
            }),
          ]),
        ).start();
      });
    };

    const stopAnimations = () => {
      pulseAnim.stopAnimation();
      barHeights.forEach(height => height.stopAnimation());
    };

    if (isListening) {
      startPulseAnimation();
      startBarAnimation();
    } else {
      stopAnimations();
    }
  }, [isListening, pulseAnim, barHeights]);

  const startListening = async () => {
    const hasPermission = await requestMicrophonePermission();

    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required to use voice recognition. Please grant permission in app settings.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setTranscribedText('');
    setAiResponse('');
    setProgress(0);
    setStatus('listening');
    setIsListening(true);
    SoundPlayer.stop();

    try {
      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVModeIOS: AVModeIOSOption.measurement,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 1,
        AVFormatIDKeyIOS: AVEncodingOption.lpcm,
        AVSampleRateKeyIOS: 16000,
        AVLinearPCMBitDepthKeyIOS: 16,
        AVLinearPCMIsBigEndianKeyIOS: false,
        AVLinearPCMIsFloatKeyIOS: false,
        AVLinearPCMIsNonInterleavedIOS: false,
      };
      // Use cache dir for temporary audio file
      const path = Platform.select({
        ios: 'recording.wav',
        android: `${RNFS.CachesDirectoryPath}/recording.mp4`,
      });
      await audioRecorderPlayer.startRecorder(path, audioSet);

      audioRecorderPlayer.addRecordBackListener((e) => {
        // Metering or progress tracking could be handled here if needed
      });
    } catch (err) {
      console.warn('startRecorder error', err);
      Alert.alert('Error', 'Failed to start voice recognition. Please try again.');
      setIsListening(false);
      setStatus('idle');
    }
  };

  const stopAssistant = async () => {
    if (isListening) {
      // User tapped stop while listening -> means they finished dictating and we should process
      try {
        const fileUri = await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        setIsListening(false);
        setStatus('processing');

        // Read the recorded file and convert to Base64
        const fileContent = await RNFS.readFile(fileUri.replace('file://', ''), 'base64');
        await processQuestion(fileContent);
      } catch (err) {
        console.warn('stopRecorder error', err);
        setIsListening(false);
        setStatus('idle');
      }
    } else {
      // Standard stop (during speaking or processing)
      setIsListening(false);
      setIsProcessing(false);
      setIsSpeaking(false);
      setStatus('idle');
      setTranscribedText('');
      setAiResponse('');
      setProgress(0);
      try {
        await audioRecorderPlayer.stopRecorder();
      } catch (e) { }
      SoundPlayer.stop();
    }
  };

  const processQuestion = async (audioBase64) => {
    try {
      setIsProcessing(true);
      setProgress(0);

      // Simulate progress bar while waiting (typically takes 8-15s per API spec)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            return 90;
          }
          return prev + 5;
        });
      }, 500);

      // Send the query to our Voice API
      const result = await farmerVoiceApi.sendVoiceQuery(audioBase64);

      clearInterval(progressInterval);
      setProgress(100);

      setTranscribedText(result.transcription);
      setAiResponse(result.answer);
      setIsProcessing(false);
      setStatus('speaking');

      // Convert Base64 response to an audio file and play it
      await playAudioResponse(result.audioBase64);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      setStatus('idle');
      Alert.alert('Error', 'Failed to process your question. Please try again.');
    }
  };

  const playAudioResponse = async (audioBase64) => {
    try {
      setIsSpeaking(true);

      // Save base64 string to a temporary file
      const tempFilePath = `${RNFS.CachesDirectoryPath}/ai_response.mp3`;
      await RNFS.writeFile(tempFilePath, audioBase64, 'base64');

      // Play the sound using react-native-sound-player
      SoundPlayer.playUrl(`file://${tempFilePath}`);
    } catch (error) {
      console.error('Error playing AI response audio:', error);
      setIsSpeaking(false);
      setStatus('idle');
    }
  };
  const getStatusText = () => {
    switch (status) {
      case 'listening':
        return {
          hindi: 'आपकी बात सुनी जा रही है...',
          english: 'Listening to your question',
        };
      case 'processing':
        return {
          hindi: 'जवाब खोजा जा रहा है...',
          english: 'Fetching Information...',
        };
      case 'speaking':
        return {
          hindi: 'जवाब सुनाया जा रहा है...',
          english: 'Playing response...',
        };
      default:
        return {
          hindi: 'बोलने के लिए माइक दबाएं',
          english: 'Tap microphone to speak',
        };
    }
  };

  const statusText = getStatusText();

  return (
    <View style={styles.container}>
      <Header title="Query Assistant" />

      <View style={styles.content}>
        {/* Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.statusHindi}>{statusText.hindi}</Text>
          <Text style={styles.statusEnglish}>{statusText.english}</Text>
        </View>

        {/* Audio Visualizer */}
        {isListening && (
          <View style={styles.visualizerContainer}>
            <View style={styles.visualizer}>
              {barHeights.map((height, index) => (
                <Animated.View
                  key={index}
                  style={[styles.bar, { height }]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Transcribed Text */}
        {transcribedText ? (
          <View style={styles.transcriptionCard}>
            <Text style={styles.transcriptionText}>{transcribedText}</Text>
            <View style={styles.transcriptionBadge}>
              <Text style={styles.badgeDot}>●</Text>
              <Text style={styles.badgeText}>Transcribed in Hindi</Text>
            </View>
          </View>
        ) : null}

        {/* AI Response */}
        {aiResponse ? (
          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <Text style={styles.responseIcon}>✓</Text>
              <Text style={styles.responseSource}>ICAR Verified</Text>
            </View>
            <Text style={styles.responseText}>{aiResponse}</Text>
          </View>
        ) : null}

        {/* Progress Section */}
        {isProcessing && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressIcon}>...</Text>
              <Text style={styles.progressText}>Fetching Information...</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        <View style={styles.spacer} />

        {/* Microphone/Speaker Button */}
        {status === 'idle' || status === 'listening' ? (
          <TouchableOpacity
            style={styles.micButton}
            onPress={isListening ? stopAssistant : startListening}
            activeOpacity={0.8}>
            <Animated.View
              style={[
                styles.micButtonInner,
                { transform: [{ scale: isListening ? pulseAnim : 1 }] },
              ]}>
              <Text style={styles.micIcon}>Mic</Text>
            </Animated.View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.speakerButton} activeOpacity={0.8}>
            <View style={styles.speakerButtonInner}>
              <Text style={styles.speakerIcon}>Vol</Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.actionText}>
          {isListening ? 'Listening...' : isSpeaking ? 'Playing...' : 'Tap to Speak'}
        </Text>

        {/* Stop Button */}
        {status !== 'idle' && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopAssistant}
            activeOpacity={0.8}>
            <Text style={styles.stopIcon}>✕</Text>
            <Text style={styles.stopText}>Stop Assistant</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  statusHindi: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusEnglish: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  visualizerContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  transcriptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  transcriptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 26,
  },
  transcriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeDot: {
    fontSize: 12,
    color: COLORS.primary,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  responseCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  responseIcon: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
  },
  responseSource: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  responseText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  progressText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressPercent: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  spacer: {
    flex: 1,
  },
  micButton: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  micButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  micIcon: {
    fontSize: 48,
  },
  speakerButton: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  speakerButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  speakerIcon: {
    fontSize: 48,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  stopButton: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    fontSize: 20,
    color: '#D32F2F',
    marginRight: 8,
  },
  stopText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
  },
});

export default QueryAssistantScreen;

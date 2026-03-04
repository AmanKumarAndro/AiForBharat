import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform,
  Image, Linking,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import SoundPlayer from 'react-native-sound-player';
import RNFS from 'react-native-fs';
import Header from '../components/Header';
import farmerVoiceApi from '../services/FarmerVoiceApiService';
import { COLORS } from '../utils/constants';
import { requestMicrophonePermission } from '../utils/permissions';

// SVG Icons
import MicIcon from '../../assets/svg/MicIcon';
import VoiceWaveIcon from '../../assets/svg/VoiceWaveIcon';
import CheckIcon from '../../assets/svg/CheckIcon';
import LeafIcon from '../../assets/svg/LeafIcon';
import DropletIcon from '../../assets/svg/DropletIcon';
import SunIcon from '../../assets/svg/SunIcon';
import ToolIcon from '../../assets/svg/ToolIcon';

// ─── Main Screen ──────────────────────────────────────────────────────────────
const QueryAssistantScreen = ({ navigation }) => {
  const [status, setStatus] = useState('idle');
  const [partialText, setPartialText] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [videos, setVideos] = useState([]);
  const [webLinks, setWebLinks] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0.6)).current;
  const barAnims = useRef(Array.from({ length: 5 }, () => new Animated.Value(12))).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const progressRef = useRef(null);

  // ── Entry animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Setup voice + sound listeners ─────────────────────────────────────────
  useEffect(() => {
    Voice.onSpeechStart = () => { setStatus('listening'); setPartialText(''); };
    Voice.onSpeechPartialResults = (e) => { if (e.value?.[0]) setPartialText(e.value[0]); };
    Voice.onSpeechResults = (e) => {
      const text = e.value?.[0] || '';
      setPartialText('');
      if (text) {
        setTranscribedText(text);
        setStatus('processing');
        processQuery(text);
      } else {
        setStatus('idle');
        setErrorMsg('Could not hear clearly — please try again.');
      }
    };
    Voice.onSpeechError = (e) => {
      console.warn('Voice error:', e);
      setStatus('idle');
      setErrorMsg('Voice recognition failed. Please try again or type below.');
    };

    const finishSub = SoundPlayer.addEventListener('FinishedPlaying', () => {
      setIsSpeaking(false);
      setStatus('idle');
    });

    return () => {
      Voice.destroy().catch(() => { });
      SoundPlayer.stop();
      finishSub.remove();
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  // ── Mic pulse & bar animations ────────────────────────────────────────────
  useEffect(() => {
    if (status === 'listening') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
      ])).start();
      barAnims.forEach((h, i) => Animated.loop(Animated.sequence([
        Animated.timing(h, { toValue: Math.random() * 28 + 14, duration: 250 + i * 50, useNativeDriver: false }),
        Animated.timing(h, { toValue: Math.random() * 28 + 14, duration: 250 + i * 50, useNativeDriver: false }),
      ])).start());
    } else if (status === 'idle') {
      // Idle pulse for mic
      pulseAnim.stopAnimation();
      ringAnim.stopAnimation();
      barAnims.forEach(h => h.stopAnimation());
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      ringAnim.stopAnimation();
      barAnims.forEach(h => h.stopAnimation());
    }
  }, [status]);

  // ── Start voice ──────────────────────────────────────────────────────────
  const startListening = async () => {
    const ok = await requestMicrophonePermission();
    if (!ok) { Alert.alert('Permission Required', 'Microphone access is needed.'); return; }
    setTranscribedText(''); setAiResponse(''); setPartialText('');
    setProgress(0); setErrorMsg('');
    setVideos([]); setWebLinks([]);
    SoundPlayer.stop();
    try { await Voice.start('hi-IN'); }
    catch (e) { console.warn('Voice.start error:', e); setErrorMsg('Could not start voice recognition.'); }
  };

  const stopListening = async () => { try { await Voice.stop(); } catch (_) { } };

  const cancelAll = async () => {
    try { await Voice.cancel(); } catch (_) { }
    SoundPlayer.stop();
    if (progressRef.current) clearInterval(progressRef.current);
    setStatus('idle'); setIsSpeaking(false);
    setPartialText(''); setProgress(0); setProgressLabel('');
  };

  // ── Clean API answer ──────────────────────────────────────────────────────
  const cleanAnswer = (raw) => {
    if (!raw) return '';
    return raw
      .replace(/\(Write your answer here\)/gi, '')
      .replace(/\(Trans:.*?\)/gi, '')
      .replace(/\(End of your answer\)/gi, '')
      .replace(/Please provide your answer.*?sources at the end\./gis, '')
      .replace(/Please provide your answer.*?references provided\./gis, '')
      .replace(/^\s*उत्तर:\s*/i, '')
      .replace(/^\s*जवाब:\s*/i, '')
      .replace(/^\s*Answer:\s*/i, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const truncateForTTS = (text) => {
    if (text.length <= 700) return text;
    const cutoff = text.lastIndexOf('।', 700) || text.lastIndexOf('.', 700) || 700;
    return text.substring(0, cutoff + 1).trim();
  };

  // ── Core pipeline ────────────────────────────────────────────────────────
  const processQuery = async (question) => {
    setProgress(0);
    setProgressLabel('Getting AI answer...');
    progressRef.current = setInterval(() => setProgress(p => p >= 60 ? 60 : p + 6), 400);

    try {
      const result = await farmerVoiceApi.askQuestion(question);
      clearInterval(progressRef.current);

      let rawAnswer = result.answer || '';
      const answerText = cleanAnswer(rawAnswer) || 'माफ़ कीजिये, जवाब नहीं मिला। कृपया दोबारा पूछें।';
      const ttsText = truncateForTTS(answerText);

      setAiResponse(answerText);
      setVideos(result.videos || []);
      setWebLinks(result.webLinks || []);
      setProgress(65);

      setProgressLabel('Generating voice response...');
      progressRef.current = setInterval(() => setProgress(p => p >= 95 ? 95 : p + 5), 300);

      const ttsResult = await farmerVoiceApi.synthesizeText(ttsText);
      clearInterval(progressRef.current);
      setProgress(100);
      setProgressLabel('');

      setStatus('speaking');
      setIsSpeaking(true);

      if (ttsResult?.audioBase64) {
        const path = `${RNFS.CachesDirectoryPath}/kv_response.mp3`;
        await RNFS.writeFile(path, ttsResult.audioBase64, 'base64');
        SoundPlayer.playUrl(`file://${path}`);
      } else {
        setTimeout(() => { setIsSpeaking(false); setStatus('idle'); }, 5000);
      }
    } catch (err) {
      clearInterval(progressRef.current);
      console.error('processQuery error:', err.message || err);
      setStatus('idle');
      setProgressLabel('');
      setProgress(0);
      setErrorMsg('Server error — please check your connection and try again.');
    }
  };

  const handleTextSubmit = async () => {
    const q = textInput.trim();
    if (!q) return;
    setTextInput('');
    setTranscribedText(q);
    setAiResponse('');
    setStatus('processing');
    await processQuery(q);
  };

  // ── Render Helpers ───────────────────────────────────────────────────────
  const isIdle = status === 'idle';
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';

  const STATUS_LABELS = {
    idle: { hi: 'बोलने के लिए माइक दबाएं', en: 'Tap mic to ask in Hindi' },
    listening: { hi: 'सुन रहे हैं...', en: 'Listening — tap stop when done' },
    processing: { hi: 'जवाब खोज रहे हैं...', en: progressLabel || 'Processing...' },
    speaking: { hi: 'जवाब सुनाया जा रहा है...', en: 'Playing AI voice response...' },
  };
  const lbl = STATUS_LABELS[status] || STATUS_LABELS.idle;

  const HINTS = [
    { text: 'गेहूं की बुवाई कब करें?', Icon: LeafIcon },
    { text: 'खाद कब डालें?', Icon: ToolIcon },
    { text: 'कीट नियंत्रण?', Icon: SunIcon },
    { text: 'सिंचाई कब करें?', Icon: DropletIcon },
  ];

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Voice Assistant" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

          {/* Status Text */}
          <View style={s.statusWrap}>
            <Text style={s.statusHi}>{lbl.hi}</Text>
            <Text style={s.statusEn}>{lbl.en}</Text>
            {errorMsg ? <Text style={s.error}>{errorMsg}</Text> : null}
          </View>

          {/* Listening Visualizer */}
          {isListening && (
            <View style={s.vizWrap}>
              <View style={s.viz}>
                {barAnims.map((h, i) => (
                  <Animated.View key={i} style={[s.bar, { height: h }]} />
                ))}
              </View>
              {partialText ? <Text style={s.partial}>"{partialText}"</Text> : null}
            </View>
          )}

          {/* Transcription Card */}
          {transcribedText ? (
            <View style={s.card}>
              <Text style={s.cardLabel}>आपने पूछा / You asked:</Text>
              <Text style={s.cardText}>{transcribedText}</Text>
            </View>
          ) : null}

          {/* AI Response */}
          {aiResponse ? (
            <View style={s.respCard}>
              <View style={s.respHeader}>
                <Text style={s.tick}>✓</Text>
                <Text style={s.respSrc}>AI Answer · Powered by AWS Bedrock + Polly</Text>
              </View>
              <Text style={s.respText}>{aiResponse}</Text>
            </View>
          ) : null}

          {/* Progress Bar */}
          {isProcessing && (
            <View style={s.progWrap}>
              <View style={s.progRow}>
                <View style={s.progDot} />
                <Text style={s.progLbl}>{progressLabel || 'Processing...'}</Text>
                <Text style={s.progPct}>{progress}%</Text>
              </View>
              <View style={s.progBg}>
                <View style={[s.progFill, { width: `${progress}%` }]} />
              </View>
            </View>
          )}

          {/* Mic / State Button */}
          <View style={s.btnContainer}>
            {(isIdle || isListening) ? (
              <TouchableOpacity
                style={s.btnOuter}
                onPress={isListening ? stopListening : startListening}
                activeOpacity={0.85}
              >
                {/* Pulse rings */}
                {isListening && (
                  <Animated.View style={[s.ring, { opacity: ringAnim, transform: [{ scale: Animated.add(ringAnim, 0.3) }] }]} />
                )}
                <Animated.View style={[
                  s.btnInner,
                  isListening ? s.btnRed : s.btnGreen,
                  { transform: [{ scale: pulseAnim }] },
                ]}>
                  {isListening ? (
                    <View style={s.stopSquare} />
                  ) : (
                    <MicIcon width={36} height={36} color="#FFF" />
                  )}
                </Animated.View>
              </TouchableOpacity>
            ) : (
              <View style={s.btnOuter}>
                <View style={[s.btnInner, isSpeaking ? s.btnGreen : s.btnGrey]}>
                  {isSpeaking ? (
                    <VoiceWaveIcon width={36} height={36} color="#FFF" />
                  ) : (
                    <View style={s.processingDots}>
                      <View style={[s.dot, s.dot1]} />
                      <View style={[s.dot, s.dot2]} />
                      <View style={[s.dot, s.dot3]} />
                    </View>
                  )}
                </View>
              </View>
            )}

            <Text style={s.actionTxt}>
              {isListening ? 'Tap to stop'
                : isSpeaking ? 'Playing response...'
                  : isProcessing ? 'Please wait...'
                    : 'Tap to speak in Hindi'}
            </Text>
          </View>

          {/* Cancel */}
          {!isIdle && !isListening && (
            <TouchableOpacity style={s.cancelBtn} onPress={cancelAll} activeOpacity={0.7}>
              <Text style={s.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          )}

          {/* Hint Chips */}
          {isIdle && !transcribedText && (
            <View style={s.hints}>
              <Text style={s.hintTitle}>Try asking:</Text>
              <View style={s.hintRow}>
                {HINTS.map(({ text, Icon }) => (
                  <TouchableOpacity key={text} style={s.chip}
                    onPress={() => { setTranscribedText(text); setAiResponse(''); setStatus('processing'); processQuery(text); }}
                    activeOpacity={0.7}>
                    <Icon width={14} height={14} color="#1B5E20" />
                    <Text style={s.chipTxt}>{text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* Sticky Bottom Input */}
      <View style={s.inputContainer}>
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={textInput}
            onChangeText={setTextInput}
            placeholder="या यहाँ टाइप करें... / Or type here..."
            placeholderTextColor="#9CA3AF"
            editable={isIdle || isListening}
            onSubmitEditing={handleTextSubmit}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[s.sendBtn, (!textInput.trim() || isProcessing) && s.sendBtnDisabled]}
            onPress={handleTextSubmit}
            disabled={!textInput.trim() || isProcessing}
            activeOpacity={0.7}>
            <View style={{ transform: [{ rotate: '-30deg' }] }}>
              <LeafIcon width={18} height={18} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Status
  statusWrap: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  statusHi: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  statusEn: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 10,
    textAlign: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: 'hidden',
    fontWeight: '600',
  },

  // Visualizer
  vizWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  viz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 50,
  },
  bar: {
    width: 6,
    backgroundColor: '#1B5E20',
    borderRadius: 3,
    opacity: 0.7,
  },
  partial: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Cards
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },

  // Response
  respCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  respHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  respCheckWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  respSrc: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 0.3,
  },
  respText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '500',
  },

  // Progress
  progWrap: {
    marginBottom: 16,
  },
  progRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1B5E20',
    marginRight: 8,
  },
  progLbl: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  progPct: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B5E20',
  },
  progBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progFill: {
    height: '100%',
    backgroundColor: '#1B5E20',
    borderRadius: 3,
  },

  // Mic Button
  btnContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  btnOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  btnInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGreen: {
    backgroundColor: '#1B5E20',
  },
  btnRed: {
    backgroundColor: '#EF4444',
  },
  btnGrey: {
    backgroundColor: '#9CA3AF',
  },
  stopSquare: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  processingDots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    opacity: 0.6,
  },
  dot1: { opacity: 1 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.3 },
  actionTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
    marginTop: 8,
  },

  // Cancel
  cancelBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  cancelTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Hints
  hints: {
    marginTop: 8,
    marginBottom: 16,
  },
  hintTitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  hintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  chipTxt: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '700',
  },

  // Input — sticky bottom
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FAFBFC',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    fontWeight: '500',
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1B5E20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
});

export default QueryAssistantScreen;


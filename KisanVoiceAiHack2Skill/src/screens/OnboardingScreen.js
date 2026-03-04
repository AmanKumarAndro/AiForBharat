import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { setLang as setGlobalLang } from '../services/languageService';
import MicIcon from '../../assets/svg/MicIcon';
import CameraIcon from '../../assets/svg/CameraIcon';
import DropletIcon from '../../assets/svg/DropletIcon';
import TractorIcon from '../../assets/svg/TractorIcon';
import LeafIcon from '../../assets/svg/LeafIcon';
import MapPinIcon from '../../assets/svg/MapPinIcon';
import ChevronRightIcon from '../../assets/svg/ChevronRightIcon';

const { width } = Dimensions.get('window');

// Bilingual content
const CONTENT = {
  hi: {
    appName: 'KisanVoice AI',
    welcome: 'नमस्ते किसान भाई',
    tagline: 'आपका AI खेती सहायक / Your AI Farming Assistant',
    subtitle: 'बोलिए, सुनिए, जानिए — खेती की हर जानकारी',
    langLabel: 'भाषा चुनें / Select Language',
    microphone: 'माइक्रोफोन / Microphone',
    micDesc: 'हिंदी में बोलकर सवाल पूछें (Ask by speaking)',
    location: 'स्थान / Location',
    locDesc: 'मौसम और मंडी की जानकारी (Weather & Market)',
    camera: 'कैमरा / Camera',
    camDesc: 'फसल की बीमारी की पहचान (Crop disease detection)',
    offline: 'बिना इंटरनेट के भी काम करता है / Works offline',
    getStarted: 'शुरू करें / Get Started',
    permTitle: 'अनुमतियाँ / Permissions',
    features: [
      { iconKey: 'mic', title: 'आवाज़ AI / Voice AI', desc: 'हिंदी में बोलें, 4 सेकंड में जवाब' },
      { iconKey: 'camera', title: 'कीट पहचान / Pest Scan', desc: 'फोटो से बीमारी पहचानें' },
      { iconKey: 'droplet', title: 'सिंचाई अलर्ट / Irrigation', desc: 'SMS पर सिंचाई की याद' },
      { iconKey: 'tractor', title: 'सेवा बुकिंग / Services', desc: 'ट्रैक्टर — मिनटों में बुक करें' },
    ],
  },
  en: {
    appName: 'KisanVoice AI',
    welcome: 'Hello Farmer!',
    tagline: 'Your AI Farming Assistant',
    subtitle: 'Speak, Listen, Learn — all farming knowledge at your voice',
    langLabel: 'Select Language',
    microphone: 'Microphone',
    micDesc: 'Ask questions by speaking in Hindi',
    location: 'Location',
    locDesc: 'For local weather & market prices',
    camera: 'Camera',
    camDesc: 'Identify crop diseases by photo',
    offline: 'Works without internet too',
    getStarted: 'Get Started',
    permTitle: 'Permissions',
    features: [
      { iconKey: 'mic', title: 'Voice AI', desc: 'Speak Hindi, get answer in 4 seconds' },
      { iconKey: 'camera', title: 'Pest Scanner', desc: 'Photo-based disease detection' },
      { iconKey: 'droplet', title: 'Irrigation Alerts', desc: 'SMS reminders to water crops' },
      { iconKey: 'tractor', title: 'Service Booking', desc: 'Book a tractor in minutes' },
    ],
  },
};

const OnboardingScreen = ({ navigation }) => {
  const [lang, setLang] = useState('hi');
  const t = CONTENT[lang];

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const langSwitchAnim = useRef(new Animated.Value(lang === 'hi' ? 0 : 1)).current;

  useEffect(() => {
    // Entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
      ]),
      Animated.timing(slideUp, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.stagger(120, cardAnims.map(a =>
        Animated.spring(a, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true })
      )),
      Animated.spring(btnAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();

    // Continuous pulse on logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const switchLang = (newLang) => {
    setLang(newLang);
    setGlobalLang(newLang); // persist globally
    Animated.spring(langSwitchAnim, {
      toValue: newLang === 'hi' ? 0 : 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const switchTranslateX = langSwitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, (width - 48) / 2],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* Green gradient hero */}
      <View style={styles.heroSection}>
        <Animated.View style={{ opacity: fadeIn }}>
          <Text style={styles.appName}>{t.appName}</Text>
        </Animated.View>

        {/* Logo with pulse */}
        <Animated.View style={[styles.logoContainer, {
          transform: [{ scale: Animated.multiply(logoScale, logoPulse) }],
        }]}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <LeafIcon width={36} height={36} color="#FFF" />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
          <Text style={styles.welcomeText}>{t.welcome}</Text>
          <Text style={styles.tagline}>{t.tagline}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </Animated.View>
      </View>

      <ScrollView
        style={styles.scrollSection}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Language Toggle */}
        <Animated.View style={[styles.langSection, { opacity: fadeIn }]}>
          <Text style={styles.langLabel}>{t.langLabel}</Text>
          <View style={styles.langSwitch}>
            <Animated.View style={[styles.langSlider, {
              transform: [{ translateX: switchTranslateX }],
            }]} />
            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => switchLang('hi')}
              activeOpacity={0.8}>
              <Text style={[styles.langBtnText, lang === 'hi' && styles.langBtnTextActive]}>
                हिन्दी
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => switchLang('en')}
              activeOpacity={0.8}>
              <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>
                English
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Feature Cards */}
        {t.features.map((feature, index) => (
          <Animated.View
            key={index}
            style={[styles.featureCard, {
              opacity: cardAnims[index],
              transform: [{
                translateX: cardAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [index % 2 === 0 ? -60 : 60, 0],
                }),
              }],
            }]}>
            <View style={[styles.featureIconBg, {
              backgroundColor: ['#ECFDF5', '#FFF7ED', '#EEF6FF', '#FEF2F2'][index],
            }]}>
              {feature.iconKey === 'mic' && <MicIcon width={22} height={22} color="#059669" />}
              {feature.iconKey === 'camera' && <CameraIcon width={22} height={22} color="#EA580C" />}
              {feature.iconKey === 'droplet' && <DropletIcon width={22} height={22} color="#2563EB" />}
              {feature.iconKey === 'tractor' && <TractorIcon width={22} height={22} color="#DC2626" />}
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
            <ChevronRightIcon width={18} height={18} color="#D1D5DB" />
          </Animated.View>
        ))}

        {/* Offline badge */}
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>{t.offline}</Text>
        </View>

        {/* Permissions Preview */}
        <View style={styles.permSection}>
          <Text style={styles.permTitle}>{t.permTitle}</Text>
          <View style={styles.permRow}>
            {[
              { iconComponent: <MicIcon width={20} height={20} color="#059669" />, label: t.microphone, color: '#ECFDF5' },
              { iconComponent: <MapPinIcon width={20} height={20} color="#2563EB" />, label: t.location, color: '#EEF6FF' },
              { iconComponent: <CameraIcon width={20} height={20} color="#EA580C" />, label: t.camera, color: '#FFF7ED' },
            ].map((perm, i) => (
              <View key={i} style={[styles.permChip, { backgroundColor: perm.color }]}>
                {perm.iconComponent}
                <Text style={styles.permLabel}>{perm.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Get Started Button */}
        <Animated.View style={{
          opacity: btnAnim,
          transform: [{ scale: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
        }}>
          <TouchableOpacity
            style={styles.getStartedBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}>
            <Text style={styles.getStartedText}>{t.getStarted}</Text>
            <View style={styles.arrowCircle}>
              <ChevronRightIcon width={18} height={18} color="#FFF" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  heroSection: {
    backgroundColor: '#1B5E20',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#A5D6A7',
    letterSpacing: 1,
    marginBottom: 12,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    // SVG rendered directly, no fontSize needed
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C8E6C9',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#A5D6A7',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollSection: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // Language Toggle
  langSection: {
    marginBottom: 20,
  },
  langLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
    marginLeft: 4,
  },
  langSwitch: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    borderRadius: 14,
    padding: 2,
    position: 'relative',
  },
  langSlider: {
    position: 'absolute',
    top: 2,
    width: '50%',
    height: '100%',
    backgroundColor: '#1B5E20',
    borderRadius: 12,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 1,
  },
  langBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  langBtnTextActive: {
    color: '#FFF',
  },
  // Feature Cards
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowRadius: 4,
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#757575',
    lineHeight: 17,
  },
  featureArrow: {
    fontSize: 18,
    color: '#BDBDBD',
    marginLeft: 8,
  },
  // Offline Badge
  offlineBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  offlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  // Permissions
  permSection: {
    marginBottom: 20,
  },
  permTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
    marginLeft: 4,
  },
  permRow: {
    flexDirection: 'row',
    gap: 8,
  },
  permChip: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  permIcon: {
    marginBottom: 4,
  },
  permLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#424242',
  },
  // CTA Button
  getStartedBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 12,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700',
  },
});

export default OnboardingScreen;

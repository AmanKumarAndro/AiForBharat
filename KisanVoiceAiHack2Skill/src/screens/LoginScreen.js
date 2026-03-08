import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { COLORS } from '../utils/constants';
import BackIconSvg from '../../assets/svg/BackIconSvg';
import LeafIcon from '../../assets/svg/LeafIcon';
import CheckIcon from '../../assets/svg/CheckIcon';
import ChevronRightIcon from '../../assets/svg/ChevronRightIcon';
import api from '../services/api';
import { Alert, ActivityIndicator } from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideUp, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.spring(btnScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSendOTP = async () => {
    if (phoneNumber.length === 10) {
      setLoading(true);
      try {
        const fullPhone = `+91${phoneNumber}`;
        const result = await api.sendOTP(fullPhone);
        if (result.success) {
          setOtpSent(true);
          Alert.alert('सफलता / Success', 'OTP भेज दिया गया है / OTP sent successfully');
        } else {
          Alert.alert('त्रुटि / Error', result.message || 'Failed to send OTP');
          Alert.alert('Verification Bypassed', 'Number verification is disabled for hackathon testing purposes.');
        }
      } catch (error) {
        Alert.alert('त्रुटि / Error', error.message);
      } finally {
        setOtpSent(true);

        setLoading(false);
      }
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length === 6) {
      setLoading(true);
      try {
        const fullPhone = `+91${phoneNumber}`;
        const result = await api.verifyOTP(fullPhone, otp);
        if (result.success) {
          if (result.isProfileComplete) {
            navigation.replace('Home');
          } else {
            navigation.replace('ProfileForm');
          }
        } else {
          Alert.alert('त्रुटि / Error', result.message || 'Invalid OTP');
        }
      } catch (error) {
        Alert.alert('त्रुटि / Error', error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* Hero Header */}
      <Animated.View style={[styles.hero, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIconSvg width={26} height={26} stroke="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <LeafIcon width={24} height={24} color="#FFF" />
          </View>
          <View style={styles.logoText}>
            <Text style={styles.appName}>KisanVoice AI</Text>
            <Text style={styles.heroSubtitle}>लॉगिन करें / Login</Text>
          </View>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>

        <Animated.View style={[styles.formArea, {
          opacity: formFade,
          transform: [{ translateY: formSlide }],
        }]}>

          {/* Phone input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>फोन नंबर / Phone Number</Text>
            <View style={[styles.inputRow, otpSent && styles.inputDisabled]}>
              <View style={styles.countryBadge}>
                <Text style={styles.countryFlag}>IN</Text>
                <Text style={styles.countryCode}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#BDBDBD"
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!otpSent}
              />
              {phoneNumber.length === 10 && (
                <View style={styles.checkMarkWrap}>
                  <CheckIcon width={16} height={16} color="#4CAF50" />
                </View>
              )}
            </View>
          </View>

          {!otpSent ? (
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.primaryBtn, phoneNumber.length !== 10 && styles.btnDisabled]}
                onPress={handleSendOTP}
                disabled={phoneNumber.length !== 10 || loading}
                activeOpacity={0.85}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.btnText}>OTP भेजें / Send OTP</Text>
                    <ChevronRightIcon width={18} height={18} color="#A5D6A7" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View>
              {/* OTP Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>OTP दर्ज करें / Enter OTP</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="• • • • • •"
                  placeholderTextColor="#BDBDBD"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  autoFocus
                  textAlign="center"
                  letterSpacing={8}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, otp.length !== 6 && styles.btnDisabled]}
                onPress={handleVerifyOTP}
                disabled={otp.length !== 6 || loading}
                activeOpacity={0.85}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.btnText}>सत्यापित करें / Verify</Text>
                    <ChevronRightIcon width={18} height={18} color="#A5D6A7" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => setOtpSent(false)}>

                <Text style={styles.resendText}>Enter 123456 as OTP</Text>
                <Text style={styles.resendText}>OTP फिर से भेजें / Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <LeafIcon width={20} height={20} color="#1B5E20" />
              </View>
              <Text style={styles.infoText}>आपका डेटा सुरक्षित है{'\n'}Your data is safe</Text>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <ChevronRightIcon width={20} height={20} color="#F59E0B" />
              </View>
              <Text style={styles.infoText}>तुरंत एक्सेस{'\n'}Instant access</Text>
            </View>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.footerText}>
              खाता नहीं है? <Text style={styles.footerLink}>साइन अप करें / Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  hero: {
    backgroundColor: '#1B5E20',
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    marginBottom: 16,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFF',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoIcon: {
    // SVG rendered directly
  },
  logoText: {
    flex: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#A5D6A7',
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  formArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingRight: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  countryFlag: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B5E20',
    marginRight: 6,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#424242',
  },
  phoneInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: '#212121',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  checkMarkWrap: {
    width: 20,
    height: 20,
  },
  otpInput: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#1B5E20',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  primaryBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  btnDisabled: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 8,
  },
  btnArrow: {
    fontSize: 18,
    color: '#A5D6A7',
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#1B5E20',
    fontWeight: '600',
  },
  infoCards: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 28,
  },
  footerText: {
    fontSize: 14,
    color: '#757575',
  },
  footerLink: {
    color: '#1B5E20',
    fontWeight: '700',
  },
});

export default LoginScreen;

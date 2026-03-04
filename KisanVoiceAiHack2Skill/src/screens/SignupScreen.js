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
  ScrollView,
  StatusBar,
} from 'react-native';
import { COLORS } from '../utils/constants';
import BackIconSvg from '../../assets/svg/BackIconSvg';
import LeafIcon from '../../assets/svg/LeafIcon';
import CheckIcon from '../../assets/svg/CheckIcon';
import ChevronRightIcon from '../../assets/svg/ChevronRightIcon';
import MapPinIcon from '../../assets/svg/MapPinIcon';
import api from '../services/api';
import { Alert, ActivityIndicator } from 'react-native';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [village, setVillage] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideUp, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),
      Animated.timing(formFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSendOTP = async () => {
    if (name && phoneNumber.length === 10 && village) {
      setLoading(true);
      try {
        const fullPhone = `+91${phoneNumber}`;
        const result = await api.sendOTP(fullPhone);
        if (result.success) {
          setOtpSent(true);
          Alert.alert('सफलता / Success', 'OTP भेज दिया गया है / OTP sent successfully');
        } else {
          Alert.alert('त्रुटि / Error', result.message || 'Failed to send OTP');
        }
      } catch (error) {
        Alert.alert('त्रुटि / Error', error.message);
      } finally {
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
          // Cache name for irrigation pre-fill
          await api.saveName(name);

          // Note: Since they provided name and village in Signup, we could auto-fill ProfileForm
          // or just navigate to it. Let's navigate to ProfileForm to be consistent.
          navigation.replace('ProfileForm');
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

  const isFormValid = name && phoneNumber.length === 10 && village;

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
            <Text style={styles.heroSubtitle}>नया खाता बनाएं / Sign Up</Text>
          </View>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          <Animated.View style={{ opacity: formFade }}>
            {!otpSent ? (
              <>
                {/* Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>नाम / Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="अपना नाम दर्ज करें"
                    placeholderTextColor="#BDBDBD"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>फोन नंबर / Phone Number</Text>
                  <View style={styles.inputRow}>
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
                    />
                    {phoneNumber.length === 10 && (
                      <View style={styles.checkMarkWrap}>
                        <CheckIcon width={16} height={16} color="#4CAF50" />
                      </View>
                    )}
                  </View>
                </View>

                {/* Village */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>गांव / Village</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="अपना गांव दर्ज करें"
                    placeholderTextColor="#BDBDBD"
                    value={village}
                    onChangeText={setVillage}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, (!isFormValid || loading) && styles.btnDisabled]}
                  onPress={handleSendOTP}
                  disabled={!isFormValid || loading}
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
              </>
            ) : (
              <>
                {/* Summary */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>{name}</Text>
                  <Text style={styles.summaryDetail}>+91 {phoneNumber}  {village}</Text>
                </View>

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
                  style={[styles.primaryBtn, (otp.length !== 6 || loading) && styles.btnDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={otp.length !== 6 || loading}
                  activeOpacity={0.85}>
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.btnText}>खाता बनाएं / Create Account</Text>
                      <ChevronRightIcon width={18} height={18} color="#A5D6A7" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendBtn} onPress={() => setOtpSent(false)}>
                  <Text style={styles.resendText}>← वापस जाएं / Go Back</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerText}>
                पहले से खाता है? <Text style={styles.footerLink}>लॉगिन करें / Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View >
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
    fontSize: 28,
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
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212121',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingRight: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
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
    fontSize: 18,
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
  checkMark: {
    fontSize: 16,
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
  },
  summaryCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  summaryDetail: {
    fontSize: 13,
    color: '#388E3C',
    marginTop: 4,
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
    marginTop: 4,
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
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingBottom: 20,
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

export default SignupScreen;

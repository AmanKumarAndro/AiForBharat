import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { getLabels } from '../services/languageService';
import weatherService from '../services/weatherService';
import weatherAdvisoryService from '../services/weatherAdvisory.service';
import WeatherAdvisoryCard from '../components/WeatherAdvisoryCard';
import api from '../services/api';
import farmServicesApi from '../services/farmServicesApi';
import { useNavigation } from '@react-navigation/native';

// SVG Icons
import MicIcon from '../../assets/svg/MicIcon';
import UserIcon from '../../assets/svg/UserIcon';
import SunIcon from '../../assets/svg/SunIcon';
import DropletIcon from '../../assets/svg/DropletIcon';
import CameraIcon from '../../assets/svg/CameraIcon';
import LeafIcon from '../../assets/svg/LeafIcon';
import TractorIcon from '../../assets/svg/TractorIcon';
import ShopIcon from '../../assets/svg/ShopIcon';
import ChevronRightIcon from '../../assets/svg/ChevronRightIcon';
import LightbulbIcon from '../../assets/svg/LightbulbIcon';
import ClipboardIcon from '../../assets/svg/ClipboardIcon';
import ToolIcon from '../../assets/svg/ToolIcon';
import CheckIcon from '../../assets/svg/CheckIcon';
import BellIcon from '../../assets/svg/BellIcon';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const t = getLabels();
  const nav = useNavigation();
  const [weather, setWeather] = useState({
    temp: '--',
    tempMax: '--',
    tempMin: '--',
    rainMm: 0,
    description: 'Loading...',
    icon: '',
  });
  const [locationName, setLocationName] = useState('Your Farm');

  const [advisory, setAdvisory] = useState(null);
  const [farmerName, setFarmerName] = useState('');
  const [ongoingJobs, setOngoingJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const micPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadWeather();
    api.getUserData().then(data => {
      if (data?.name) setFarmerName(data.name);
      if (data?.phone) loadJobs(data.phone);
    }).catch(() => { });
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();

    // Continuous pulse on mic ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadJobs = async (phone) => {
    setJobsLoading(true);
    const provId = farmServicesApi.toProviderId(phone);
    const [farmerResult, provResult] = await Promise.all([
      farmServicesApi.getFarmerRequests(phone),
      farmServicesApi.getProviderJobs(provId),
    ]);
    const ongoing = [];
    const completed = [];
    if (farmerResult.success) {
      (farmerResult.data.ongoing || []).forEach(j => ongoing.push({ ...j, _role: 'farmer' }));
      (farmerResult.data.completed || []).slice(0, 2).forEach(j => completed.push({ ...j, _role: 'farmer' }));
    }
    if (provResult.success) {
      (provResult.data.ongoing || []).forEach(j => ongoing.push({ ...j, _role: 'provider' }));
      (provResult.data.completed || []).slice(0, 2).forEach(j => completed.push({ ...j, _role: 'provider' }));
    }
    setOngoingJobs(ongoing);
    setCompletedJobs(completed.slice(0, 3));
    setJobsLoading(false);
  };

  const loadWeather = async () => {
    let lat = 28.6;
    let lon = 77.2;
    let city = '';
    try {
      const geo = await fetch('https://ipapi.co/json/');
      const geoData = await geo.json();
      if (!geoData.error && geoData.latitude && geoData.longitude) {
        lat = geoData.latitude;
        lon = geoData.longitude;
        city = geoData.city || '';
      }
    } catch (e) {
      console.warn('Geo lookup failed:', e);
    }
    if (city) setLocationName(city);

    try {
      const data = await weatherService.get7DayForecast(lat, lon);
      if (data.length > 0) setWeather(data[0]);
    } catch (e) {
      console.warn('Weather fetch error:', e);
    }

    try {
      const advResult = await weatherAdvisoryService.getAdvisory(lat, lon, 'spraying');
      if (advResult.success) setAdvisory(advResult.data);
    } catch (e) {
      console.warn('Advisory fetch error:', e);
    }
  };

  const features = [
    { icon: <SunIcon width={22} height={22} />, label: t.weather, screen: 'Weather', bg: '#EEF6FF', accent: '#3B82F6' },
    { icon: <DropletIcon width={22} height={22} />, label: t.irrigation, screen: 'IrrigationMainApp', bg: '#ECFDF5', accent: '#10B981' },
    { icon: <CameraIcon width={22} height={22} />, label: t.pestScan, screen: 'PestScan', bg: '#FFF7ED', accent: '#F97316' },
    { icon: <ShopIcon width={22} height={22} />, label: t.market, screen: 'Market', bg: '#F0FDF4', accent: '#22C55E' },
    { icon: <LeafIcon width={22} height={22} />, label: t.cropGuide, screen: 'CropGuide', bg: '#F5F3FF', accent: '#8B5CF6' },
    { icon: <TractorIcon width={22} height={22} />, label: t.services, screen: 'Services', bg: '#FFFBEB', accent: '#F59E0B' },
  ];

  const SVC_ICONS = {
    TRACTOR: <TractorIcon width={18} height={18} color="#6B7280" />,
    LABOUR: <ToolIcon width={18} height={18} color="#6B7280" />,
    TRANSPORT: <TractorIcon width={18} height={18} color="#6B7280" />,
  };
  const STATUS_COLOR = { MATCHED: '#10b981', NOTIFYING: '#3b82f6', COMPLETED: '#6B7280', PENDING: '#f59e0b' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>

        {/* ─── Header ─── */}
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{t.greeting}</Text>
            {farmerName ? <Text style={styles.farmerName}>{farmerName}</Text> : null}
            <Text style={styles.greetingSub}>{t.greetingSub}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('ProfileDetails')}>
            <UserIcon width={20} height={20} color="#1B5E20" />
          </TouchableOpacity>
        </Animated.View>

        {/* ─── Voice Assistant CTA (Prioritized at top) ─── */}
        <Animated.View style={[styles.voiceSection, {
          opacity: fadeIn, transform: [{ translateY: slideUp }],
        }]}>
          <TouchableOpacity
            style={styles.voiceCard}
            onPress={() => navigation.navigate('QueryAssistant')}
            activeOpacity={0.8}>
            <Animated.View style={[styles.voiceRing, { transform: [{ scale: micPulse }] }]}>
              <MicIcon width={26} height={26} color="#FFF" />
            </Animated.View>
            <View style={styles.voiceTextWrap}>
              <Text style={styles.voiceTitle}>{t.tapToSpeak}</Text>
              <Text style={styles.voiceSub}>AI-powered farming assistant</Text>
            </View>
            <ChevronRightIcon width={20} height={20} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* ─── Weather Advisory Card ─── */}
        <Animated.View style={{ opacity: fadeIn }}>
          <WeatherAdvisoryCard
            advisoryData={advisory}
            weatherData={weather}
            locationName={locationName}
            onSeeMore={() => navigation.navigate('Weather')}
          />
        </Animated.View>

        {/* ─── Features Grid ─── */}
        <Animated.View style={[styles.featuresSection, { opacity: fadeIn }]}>
          <View style={styles.sectionHeader}>
            <ToolIcon width={18} height={18} color="#374151" />
            <Text style={styles.sectionTitle}>{t.servicesTitle}</Text>
          </View>
          <View style={styles.featuresGrid}>
            {features.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.featureCard}
                onPress={() => item.screen && navigation.navigate(item.screen)}
                activeOpacity={0.7}>
                <View style={[styles.featureIconWrap, { backgroundColor: item.bg }]}>
                  {item.icon}
                </View>
                <Text style={styles.featureLabel} numberOfLines={2}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ─── Live Service Requests ─── */}
        {(ongoingJobs.length > 0 || completedJobs.length > 0) && (
          <View style={styles.jobsSection}>
            {ongoingJobs.length > 0 && (
              <>
                <View style={styles.jobSectionHeader}>
                  <View style={styles.sectionHeader}>
                    <BellIcon width={16} height={16} color="#10b981" />
                    <Text style={styles.sectionTitle}>Ongoing Requests</Text>
                  </View>
                  <TouchableOpacity onPress={() => nav.navigate('MyFarm')}>
                    <Text style={styles.viewAllBtn}>View All</Text>
                  </TouchableOpacity>
                </View>
                {ongoingJobs.slice(0, 3).map(job => {
                  const color = STATUS_COLOR[job.status] || '#10b981';
                  const label = job._role === 'provider'
                    ? `Farmer: ${job.farmer_name || job.farmer_id}`
                    : job.service_type;
                  const sub = job._role === 'provider'
                    ? `${job.service_type} · ${job.farmer_pincode}`
                    : `${job.farmer_pincode || ''} · \u20B9${job.estimated_price}/hr`;
                  return (
                    <TouchableOpacity
                      key={job.request_id}
                      style={[styles.jobCard, { borderLeftColor: color }]}
                      onPress={() => job._role === 'farmer'
                        ? nav.navigate('RequestStatus', { requestId: job.request_id, serviceType: job.service_type })
                        : nav.navigate('ProviderDashboard')}
                      activeOpacity={0.85}>
                      <View style={styles.jobIconWrap}>
                        {SVC_ICONS[job.service_type] || <ToolIcon width={18} height={18} color="#6B7280" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.jobLabel}>{label}</Text>
                        <Text style={styles.jobSub}>{sub}</Text>
                      </View>
                      <View style={[styles.jobBadge, { backgroundColor: color + '18' }]}>
                        <View style={[styles.jobDot, { backgroundColor: color }]} />
                        <Text style={[styles.jobBadgeText, { color }]}>Active</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {completedJobs.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <CheckIcon width={16} height={16} color="#6B7280" />
                  <Text style={[styles.sectionTitle, { color: '#6B7280' }]}>Recently Completed</Text>
                </View>
                {completedJobs.map(job => {
                  const label = job._role === 'provider'
                    ? `Farmer: ${job.farmer_name || job.farmer_id}`
                    : job.service_type;
                  return (
                    <View
                      key={job.request_id + '_c'}
                      style={[styles.jobCard, { borderLeftColor: '#D1D5DB', opacity: 0.7 }]}>
                      <View style={styles.jobIconWrap}>
                        {SVC_ICONS[job.service_type] || <ToolIcon width={18} height={18} color="#9CA3AF" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.jobLabel, { color: '#6B7280' }]}>{label}</Text>
                      </View>
                      <View style={[styles.jobBadge, { backgroundColor: '#F3F4F6' }]}>
                        <CheckIcon width={12} height={12} color="#6B7280" />
                        <Text style={[styles.jobBadgeText, { color: '#6B7280' }]}>Done</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}

        {/* ─── Tip of the Day (commented — not from API) ─── */}
        {/* <View style={styles.tipSection}>
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <LightbulbIcon width={16} height={16} color="#F59E0B" />
              <Text style={styles.tipBadge}>TIP OF THE DAY</Text>
            </View>
            <Text style={styles.tipText}>
              {'\u0938\u0941\u092C\u0939 6-8 \u092C\u091C\u0947 \u0938\u093F\u0902\u091A\u093E\u0908 \u0915\u0930\u0947\u0902 \u2014 \u092A\u093E\u0928\u0940 \u092C\u091A\u0924\u093E \u0939\u0948 \u0914\u0930 \u092B\u0938\u0932 \u091C\u093C\u094D\u092F\u093E\u0926\u093E \u0938\u094B\u0916\u0924\u0940 \u0939\u0948'}
            </Text>
            <Text style={styles.tipTextEn}>
              Irrigate early morning 6-8 AM — saves water & crops absorb more
            </Text>
          </View>
        </View> */}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#FAFBFC',
    // paddingBottom: 90
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  farmerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
  },
  greetingSub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Voice CTA ───
  voiceSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B5E20',
    borderRadius: 16,
    padding: 16,
    paddingRight: 18,
  },
  voiceRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  voiceTextWrap: {
    flex: 1,
  },
  voiceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  voiceSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },

  // ─── Features Grid ───
  featuresSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 40 - 20) / 3,
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 10,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 4,
  },

  // ─── Jobs ───
  jobsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  jobSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  viewAllBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B5E20',
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  jobIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  jobLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  jobSub: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  jobBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  jobDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  jobBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── Tip ───
  tipSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  tipCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tipBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 20,
  },
  tipTextEn: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 4,
  },
});

export default HomeScreen;

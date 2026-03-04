import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { getLabels } from '../services/languageService';
import weatherService from '../services/weatherService';
import BackIconSvg from '../../assets/svg/BackIconSvg';
import MapPinIcon from '../../assets/svg/MapPinIcon';
import DropletIcon from '../../assets/svg/DropletIcon';
import ThermometerIcon from '../../assets/svg/ThermometerIcon';
import SprayIcon from '../../assets/svg/SprayIcon';
import CheckIcon from '../../assets/svg/CheckIcon';
import SunIcon from '../../assets/svg/SunIcon';
import LightbulbIcon from '../../assets/svg/LightbulbIcon';

const { width } = Dimensions.get('window');

const WeatherScreen = ({ navigation }) => {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const t = getLabels();

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const cardAnims = useRef(Array(7).fill(null).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    loadWeather();
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadWeather = async () => {
    setLoading(true);
    let lat = 28.6139, lon = 77.2090;

    try {
      const geoResponse = await fetch('https://ipapi.co/json/');
      const geoData = await geoResponse.json();
      if (geoData.latitude && geoData.longitude) {
        lat = geoData.latitude;
        lon = geoData.longitude;
        setLocationName(`${geoData.city}, ${geoData.region}`);
      }
    } catch (e) {
      console.warn('Geo lookup failed:', e);
    }

    try {
      const data = await weatherService.get7DayForecast(lat, lon);
      setForecast(data);
      // Stagger-in day cards
      Animated.stagger(80, cardAnims.map(anim =>
        Animated.spring(anim, { toValue: 1, friction: 6, useNativeDriver: true })
      )).start();
    } catch (e) {
      console.error('Weather fetch failed:', e);
    }
    setLoading(false);
  };

  const getDayLabel = (dateStr, idx) => {
    if (idx === 0) return 'Today';
    if (idx === 1) return 'Tmrw';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  const getFarmingTip = (day) => {
    if (!day) return '';
    if (day.temp >= 38) return t.tipHeat || 'Extreme heat — irrigate early morning & evening';
    if (day.rainMm >= 10) return t.tipHeavyRain || 'Heavy rain expected — ensure field drainage';
    if (day.rainMm >= 3) return t.tipRain || 'Rain likely — skip irrigation today';
    if (day.temp <= 5) return t.tipFrost || 'Frost risk — cover seedlings overnight';
    return t.tipNormal || 'Good conditions for field work';
  };

  // Weather condition to icon mapping (no emoji)
  const getWeatherIcon = (desc) => {
    if (!desc) return <SunIcon width={28} height={28} />;
    const d = desc.toLowerCase();
    if (d.includes('rain') || d.includes('drizzle')) return <DropletIcon width={28} height={28} color="#2196F3" />;
    if (d.includes('cloud')) return <SunIcon width={28} height={28} color="#90A4AE" />;
    if (d.includes('snow')) return <DropletIcon width={28} height={28} color="#B3E5FC" />;
    return <SunIcon width={28} height={28} />;
  };

  const selected = forecast[selectedDay];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text style={styles.loadingText}>{t.loading}</Text>
        <Text style={styles.loadingSubtext}>{t.locationDetect}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* Hero Header */}
      <Animated.View style={[styles.hero, { opacity: fadeIn }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackIconSvg width={24} height={24} stroke="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle}>{t.weatherTitle}</Text>
            <View style={styles.locationRow}>
              <MapPinIcon width={12} height={12} color="#A5D6A7" />
              <Text style={styles.heroLocation}>{locationName}</Text>
            </View>
          </View>
        </View>

        {selected && (
          <View style={styles.currentWeather}>
            <View style={styles.currentIconWrap}>
              {getWeatherIcon(selected.description)}
            </View>
            <View style={styles.currentInfo}>
              <Text style={styles.currentTemp}>{selected.temp}°C</Text>
              <Text style={styles.currentDesc}>{selected.description}</Text>
              {selected.tempMax && (
                <Text style={styles.currentRange}>
                  H: {selected.tempMax}°  L: {selected.tempMin}°
                </Text>
              )}
            </View>
            <View style={styles.currentStats}>
              <View style={styles.miniStat}>
                <DropletIcon width={14} height={14} color="#A5D6A7" />
                <Text style={styles.miniStatValue}>{selected.rainMm}mm</Text>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 7-Day Forecast */}
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
          <Text style={styles.sectionTitle}>{t.forecast7Day}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastStrip}>
            {forecast.map((day, idx) => (
              <Animated.View key={idx} style={{
                opacity: cardAnims[idx] || 1,
                transform: [{
                  scale: (cardAnims[idx] || new Animated.Value(1)).interpolate({
                    inputRange: [0, 1], outputRange: [0.85, 1],
                  })
                }],
              }}>
                <TouchableOpacity
                  style={[styles.dayCard, selectedDay === idx && styles.dayCardActive]}
                  onPress={() => setSelectedDay(idx)}
                  activeOpacity={0.7}>
                  <Text style={[styles.dayLabel, selectedDay === idx && styles.dayLabelActive]}>
                    {getDayLabel(day.date, idx)}
                  </Text>
                  <View style={styles.dayIconWrap}>
                    {getWeatherIcon(day.description)}
                  </View>
                  <Text style={[styles.dayTemp, selectedDay === idx && styles.dayTempActive]}>
                    {day.temp}°
                  </Text>
                  {day.rainMm > 0 && (
                    <View style={styles.dayRainRow}>
                      <DropletIcon width={8} height={8} color="#2196F3" />
                      <Text style={styles.dayRain}>{day.rainMm}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Farming Tip */}
        {selected && (
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <LightbulbIcon width={14} height={14} color="#F59E0B" />
              <Text style={styles.tipTitle}>{t.farmingTip}</Text>
            </View>
            <Text style={styles.tipText}>{getFarmingTip(selected)}</Text>
          </View>
        )}

        {/* Rain Forecast */}
        <View style={styles.rainSummary}>
          <View style={styles.rainHeader}>
            <DropletIcon width={14} height={14} color="#2196F3" />
            <Text style={styles.rainTitle}>{t.forecast7Day} — Rain</Text>
          </View>
          {forecast.map((day, idx) => (
            <View key={idx} style={styles.rainRow}>
              <Text style={styles.rainDay}>{getDayLabel(day.date, idx)}</Text>
              <View style={styles.rainBarBg}>
                <View style={[styles.rainBarFill, {
                  width: day.rainMm > 0 ? `${Math.min(day.rainMm * 5, 100)}%` : '5%',
                  backgroundColor: day.rainMm >= 5 ? '#2196F3' : day.rainMm > 0 ? '#90CAF9' : '#E5E7EB',
                }]} />
              </View>
              <Text style={[styles.rainMm, day.rainMm >= 5 && { color: '#2196F3', fontWeight: '700' }]}>
                {day.rainMm > 0 ? `${day.rainMm}mm` : '0mm'}
              </Text>
            </View>
          ))}
        </View>

        {/* Spray Window */}
        <View style={styles.sprayCard}>
          <View style={styles.sprayHeader}>
            <SprayIcon width={16} height={16} color="#1B5E20" />
            <Text style={styles.sprayTitle}>{t.sprayWindow}</Text>
          </View>
          <Text style={styles.sprayDesc}>
            {selected?.rainMm >= 5
              ? 'Rain expected — avoid spraying / \u092C\u093E\u0930\u093F\u0936 \u092E\u0947\u0902 \u091B\u093F\u0921\u093C\u0915\u093E\u0935 \u0928 \u0915\u0930\u0947\u0902'
              : 'Good day for spraying / \u091B\u093F\u0921\u093C\u0915\u093E\u0935 \u0915\u0947 \u0932\u093F\u090F \u0905\u091A\u094D\u091B\u093E \u0926\u093F\u0928'}
          </Text>
          <View style={styles.sprayRow}>
            {[
              { time: '6 AM', label: 'Best', optimal: true },
              { time: '8 AM', label: 'Best', optimal: true },
              { time: '10 AM', label: 'OK', optimal: true },
              { time: '12 PM', label: 'Hot', optimal: false },
              { time: '2 PM', label: 'Hot', optimal: false },
              { time: '4 PM', label: 'Windy', optimal: false },
            ].map((slot, i) => {
              const blocked = selected?.rainMm >= 5;
              const isGood = !blocked && slot.optimal;
              return (
                <View key={i} style={styles.spraySlot}>
                  <View style={[styles.sprayBar, {
                    backgroundColor: blocked ? '#F3F4F6' : isGood ? '#D1FAE5' : '#FEE2E2',
                  }]}>
                    {blocked ? (
                      <DropletIcon width={12} height={12} color="#9CA3AF" />
                    ) : isGood ? (
                      <CheckIcon width={12} height={12} color="#059669" />
                    ) : (
                      <Text style={styles.sprayX}>✗</Text>
                    )}
                  </View>
                  <Text style={styles.sprayTime}>{slot.time}</Text>
                  <Text style={[styles.sprayLabel, {
                    color: blocked ? '#9CA3AF' : isGood ? '#059669' : '#DC2626',
                  }]}>
                    {blocked ? 'Rain' : slot.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Last Updated */}
        <Text style={styles.lastUpdated}>
          {t.lastUpdated}: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Hero
  hero: {
    backgroundColor: '#1B5E20',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  heroTitleWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  heroLocation: {
    fontSize: 13,
    color: '#A5D6A7',
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  currentInfo: {
    flex: 1,
  },
  currentTemp: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFF',
  },
  currentDesc: {
    fontSize: 13,
    color: '#C8E6C9',
    textTransform: 'capitalize',
  },
  currentRange: {
    fontSize: 12,
    color: '#A5D6A7',
    marginTop: 2,
    fontWeight: '500',
  },
  currentStats: {
    alignItems: 'flex-end',
  },
  miniStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  miniStatValue: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },

  // Forecast Strip
  forecastStrip: {
    marginBottom: 18,
  },
  dayCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    paddingHorizontal: 14,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 68,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dayCardActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  dayLabelActive: {
    color: '#A5D6A7',
  },
  dayIconWrap: {
    marginBottom: 6,
  },
  dayTemp: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  dayTempActive: {
    color: '#FFF',
  },
  dayRainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  dayRain: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: '600',
  },

  // Tip
  tipCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  tipText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },

  // Rain
  rainSummary: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  rainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  rainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  rainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rainDay: {
    width: 42,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  rainBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  rainBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rainMm: {
    width: 42,
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'right',
  },

  // Spray
  sprayCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sprayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sprayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  sprayDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 18,
  },
  sprayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spraySlot: {
    alignItems: 'center',
    flex: 1,
  },
  sprayBar: {
    width: '82%',
    height: 36,
    borderRadius: 8,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sprayX: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },
  sprayTime: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  sprayLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default WeatherScreen;

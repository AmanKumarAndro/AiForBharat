import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { COLORS } from '../utils/constants';
import CROP_IRRIGATION_MAP from '../data/cropIrrigationMap';
import weatherService from '../services/weatherService';
import BackIconSvg from '../../assets/svg/BackIconSvg';

const IrrigationScheduleScreen = ({ route, navigation }) => {
    const { cropKey, sowingDate: sowingDateISO } = route.params;
    const sowingDate = new Date(sowingDateISO);
    const crop = CROP_IRRIGATION_MAP[cropKey];

    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [smsSending, setSmsSending] = useState(false);
    const [locationName, setLocationName] = useState('');

    useEffect(() => {
        loadWeatherWithLocation();
    }, []);

    const loadWeatherWithLocation = async () => {
        setLoading(true);
        let lat = 28.6139; // Default: Delhi
        let lon = 77.2090;

        try {
            // Use IP-based geolocation (works without native modules or permissions)
            const geoResponse = await fetch('https://ipapi.co/json/');
            const geoData = await geoResponse.json();

            if (geoData.latitude && geoData.longitude) {
                lat = geoData.latitude;
                lon = geoData.longitude;
                setLocationName(`${geoData.city || ''}, ${geoData.region || ''}`);
                console.log(`Using real location: ${lat}, ${lon} (${geoData.city})`);
            } else {
                setLocationName('Delhi (default)');
            }
        } catch (error) {
            console.log('Location error, using Delhi default:', error.message);
            setLocationName('Delhi (default)');
        }

        const data = await weatherService.get7DayForecast(lat, lon);
        setForecast(data);
        setLoading(false);
    };

    // Calculate the full irrigation schedule
    const getSchedule = () => {
        return crop.stages.map(stage => {
            const irrigationDate = new Date(sowingDate);
            irrigationDate.setDate(irrigationDate.getDate() + stage.dayStart);

            // Check if this date falls in the 7-day forecast window
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((irrigationDate - today) / 86400000);
            const isUpcoming = daysDiff >= 0 && daysDiff <= 7;
            const isPast = daysDiff < 0;

            // Check rain on this date
            let rainInfo = { isRainy: false, rainMm: 0 };
            if (isUpcoming && forecast.length > 0) {
                rainInfo = weatherService.checkRainOnDate(irrigationDate, forecast);
            }

            return {
                ...stage,
                irrigationDate,
                daysDiff,
                isUpcoming,
                isPast,
                isToday: daysDiff === 0,
                isTomorrow: daysDiff === 1,
                skipDueToRain: rainInfo.isRainy,
                rainMm: rainInfo.rainMm,
            };
        });
    };

    const schedule = getSchedule();

    // Calculate savings
    const skippedDays = schedule.filter(s => s.skipDueToRain);
    const waterSavedLitres = skippedDays.reduce((sum, s) => sum + (s.waterMm * 100), 0); // approximate litres per hectare
    const moneySaved = Math.round(waterSavedLitres * 0.5); // ₹0.5 per litre (electricity + pump cost)

    // Find the next upcoming irrigation
    const nextIrrigation = schedule.find(s => s.daysDiff >= 0 && !s.skipDueToRain);

    const formatDate = (date) => {
        const day = date.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[date.getMonth()]}`;
    };

    const getDayLabel = (daysDiff) => {
        if (daysDiff === 0) return 'आज / Today';
        if (daysDiff === 1) return 'कल / Tomorrow';
        if (daysDiff < 0) return `${Math.abs(daysDiff)} दिन पहले`;
        return `${daysDiff} दिन बाद`;
    };

    // SMS Demo: Construct the message and open SMS app
    const handleSendDemoSMS = async () => {
        if (!nextIrrigation) {
            Alert.alert('No upcoming irrigation', 'कोई आगामी सिंचाई नहीं है');
            return;
        }

        setSmsSending(true);

        const smsBody = `KisanVoice AI Alert:\nरमेश जी, ${getDayLabel(nextIrrigation.daysDiff)} सुबह 6-8 बजे ${crop.nameHi} को पानी दें। अवस्था: ${nextIrrigation.nameHi}।${skippedDays.length > 0
            ? `\n\nबारिश की संभावना — ${skippedDays.map(s => formatDate(s.irrigationDate)).join(', ')} को सिंचाई skip करें। ${waterSavedLitres.toLocaleString()} लीटर पानी बचत!`
            : ''
            }`;

        try {
            // Open SMS app with pre-filled message (works on real devices)
            const smsUrl = `sms:?body=${encodeURIComponent(smsBody)}`;
            const canOpen = await Linking.canOpenURL(smsUrl);
            if (canOpen) {
                await Linking.openURL(smsUrl);
            } else {
                // Fallback: Show the message in an alert
                Alert.alert('SMS Preview', smsBody);
            }
        } catch (error) {
            Alert.alert('SMS Preview', smsBody);
        }

        setSmsSending(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0288D1" />
                <Text style={styles.loadingText}>मौसम डेटा लोड हो रहा है...</Text>
                <Text style={styles.loadingSubtext}>Loading weather data...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <BackIconSvg width={26} height={26} stroke="#FFF" strokeWidth={2.5} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{crop.icon} {crop.nameHi} सिंचाई</Text>
                    <Text style={styles.headerSubtitle}>बुवाई: {formatDate(sowingDate)} • {crop.stages.length} चरण</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Next Irrigation Alert Card */}
                {nextIrrigation && (
                    <View style={styles.alertCard}>
                        <View style={styles.alertHeader}>
                            <Text style={styles.alertIcon}>⏰</Text>
                            <View style={styles.alertTextArea}>
                                <Text style={styles.alertTitle}>अगली सिंचाई / Next Irrigation</Text>
                                <Text style={styles.alertDate}>
                                    {formatDate(nextIrrigation.irrigationDate)} — {getDayLabel(nextIrrigation.daysDiff)}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.alertStage}>
                            {nextIrrigation.nameHi} ({nextIrrigation.name})
                        </Text>
                        <Text style={styles.alertTime}>सुबह 6:00 – 8:00 AM recommended</Text>
                    </View>
                )}

                {/* 7-Day Weather Strip */}
                <Text style={styles.sectionTitle}>7 दिन का मौसम / 7-Day Forecast</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weatherStrip}>
                    {forecast.map((day, idx) => (
                        <View key={idx} style={[
                            styles.weatherDay,
                            day.rainMm >= 5 && styles.weatherDayRainy,
                        ]}>
                            <Text style={styles.weatherDate}>{formatDate(day.date)}</Text>
                            <Text style={styles.weatherIcon}>{day.icon}</Text>
                            <Text style={styles.weatherTemp}>{day.temp}°</Text>
                            {day.rainMm > 0 && (
                                <Text style={styles.weatherRain}>{day.rainMm}mm</Text>
                            )}
                        </View>
                    ))}
                </ScrollView>

                {/* Water Savings Card */}
                {skippedDays.length > 0 && (
                    <View style={styles.savingsCard}>
                        <Text style={styles.savingsTitle}>बचत / Savings This Week</Text>
                        <View style={styles.savingsRow}>
                            <View style={styles.savingsItem}>
                                <Text style={styles.savingsValue}>{waterSavedLitres.toLocaleString()}</Text>
                                <Text style={styles.savingsLabel}>लीटर पानी बचा</Text>
                                <Text style={styles.savingsLabelEn}>Litres saved</Text>
                            </View>
                            <View style={styles.savingsDivider} />
                            <View style={styles.savingsItem}>
                                <Text style={styles.savingsValue}>₹{moneySaved.toLocaleString()}</Text>
                                <Text style={styles.savingsLabel}>रुपये बचे</Text>
                                <Text style={styles.savingsLabelEn}>Money saved</Text>
                            </View>
                            <View style={styles.savingsDivider} />
                            <View style={styles.savingsItem}>
                                <Text style={styles.savingsValue}>{skippedDays.length}</Text>
                                <Text style={styles.savingsLabel}>दिन skip</Text>
                                <Text style={styles.savingsLabelEn}>Days skipped</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Full Timeline */}
                <Text style={styles.sectionTitle}>पूरा सिंचाई कैलेंडर / Full Schedule</Text>
                <View style={styles.timeline}>
                    {schedule.map((stage, idx) => {
                        const isLast = idx === schedule.length - 1;
                        return (
                            <View key={idx} style={styles.timelineItem}>
                                {/* Timeline line */}
                                {!isLast && <View style={[
                                    styles.timelineLine,
                                    stage.isPast && styles.timelineLinePast,
                                ]} />}

                                {/* Dot */}
                                <View style={[
                                    styles.timelineDot,
                                    stage.isToday && styles.timelineDotToday,
                                    stage.isPast && styles.timelineDotPast,
                                    stage.skipDueToRain && styles.timelineDotRain,
                                ]}>
                                    {stage.skipDueToRain ? (
                                        <Text style={styles.dotIcon}>R</Text>
                                    ) : stage.isPast ? (
                                        <Text style={styles.dotIcon}>✓</Text>
                                    ) : (
                                        <Text style={styles.dotIcon}>W</Text>
                                    )}
                                </View>

                                {/* Content */}
                                <View style={[
                                    styles.timelineContent,
                                    stage.skipDueToRain && styles.timelineContentRain,
                                    stage.isToday && styles.timelineContentToday,
                                ]}>
                                    <View style={styles.timelineHeader}>
                                        <Text style={[
                                            styles.timelineStageName,
                                            stage.isPast && styles.timelineStageNamePast,
                                        ]}>
                                            {stage.nameHi}
                                        </Text>
                                        <Text style={styles.timelineDate}>
                                            {formatDate(stage.irrigationDate)}
                                        </Text>
                                    </View>

                                    <Text style={styles.timelineStageEn}>{stage.name}</Text>
                                    <Text style={styles.timelineDays}>
                                        Day {stage.dayStart}–{stage.dayEnd} • {stage.waterMm}mm
                                    </Text>

                                    {stage.skipDueToRain && (
                                        <View style={styles.rainAlert}>
                                            <Text style={styles.rainAlertText}>
                                                बारिश expected ({stage.rainMm}mm) — सिंचाई skip करें!
                                            </Text>
                                        </View>
                                    )}

                                    {stage.isToday && !stage.skipDueToRain && (
                                        <View style={styles.todayBadge}>
                                            <Text style={styles.todayBadgeText}>⏰ आज पानी दें!</Text>
                                        </View>
                                    )}

                                    {stage.isTomorrow && !stage.skipDueToRain && (
                                        <View style={styles.tomorrowBadge}>
                                            <Text style={styles.tomorrowBadgeText}>कल पानी देना है</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* SMS Demo Button */}
                <TouchableOpacity
                    style={styles.smsBtn}
                    onPress={handleSendDemoSMS}
                    disabled={smsSending}>
                    {smsSending ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.smsBtnIcon}>SMS</Text>
                            <Text style={styles.smsBtnText}>
                                SMS अलर्ट भेजें / Send Demo SMS Alert
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.smsNote}>
                    * Demo: Opens SMS app with pre-filled Hindi alert message
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.text,
    },
    loadingSubtext: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 4,
    },
    header: {
        backgroundColor: '#0288D1',
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: 12,
    },
    backText: {
        fontSize: 24,
        color: '#FFF',
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#B3E5FC',
        marginTop: 2,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    alertCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    alertIcon: {
        fontSize: 28,
        marginRight: 10,
    },
    alertTextArea: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
    },
    alertDate: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1B5E20',
    },
    alertStage: {
        fontSize: 14,
        color: '#388E3C',
        marginBottom: 4,
    },
    alertTime: {
        fontSize: 13,
        color: '#4CAF50',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
        marginTop: 4,
    },
    weatherStrip: {
        marginBottom: 20,
    },
    weatherDay: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
        marginRight: 10,
        minWidth: 72,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    weatherDayRainy: {
        backgroundColor: '#E3F2FD',
        borderWidth: 1,
        borderColor: '#90CAF9',
    },
    weatherDate: {
        fontSize: 11,
        color: COLORS.textLight,
        marginBottom: 4,
    },
    weatherIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    weatherTemp: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    weatherRain: {
        fontSize: 11,
        color: '#1565C0',
        marginTop: 2,
    },
    savingsCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFE082',
    },
    savingsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F57F17',
        marginBottom: 12,
        textAlign: 'center',
    },
    savingsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    savingsItem: {
        alignItems: 'center',
        flex: 1,
    },
    savingsValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#E65100',
    },
    savingsLabel: {
        fontSize: 12,
        color: '#BF360C',
        marginTop: 2,
    },
    savingsLabelEn: {
        fontSize: 10,
        color: '#E65100',
        opacity: 0.6,
    },
    savingsDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#FFE082',
    },
    timeline: {
        marginBottom: 24,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 0,
        minHeight: 90,
    },
    timelineLine: {
        position: 'absolute',
        left: 19,
        top: 40,
        bottom: -10,
        width: 2,
        backgroundColor: '#B3E5FC',
    },
    timelineLinePast: {
        backgroundColor: '#C8E6C9',
    },
    timelineDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E1F5FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#0288D1',
        zIndex: 1,
    },
    timelineDotToday: {
        backgroundColor: '#4CAF50',
        borderColor: '#2E7D32',
    },
    timelineDotPast: {
        backgroundColor: '#C8E6C9',
        borderColor: '#81C784',
    },
    timelineDotRain: {
        backgroundColor: '#BBDEFB',
        borderColor: '#42A5F5',
    },
    dotIcon: {
        fontSize: 16,
    },
    timelineContent: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },
    timelineContentRain: {
        backgroundColor: '#E3F2FD',
        borderWidth: 1,
        borderColor: '#90CAF9',
    },
    timelineContentToday: {
        backgroundColor: '#E8F5E9',
        borderWidth: 1,
        borderColor: '#A5D6A7',
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    timelineStageName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        flex: 1,
    },
    timelineStageNamePast: {
        color: COLORS.textLight,
    },
    timelineDate: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0277BD',
    },
    timelineStageEn: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 2,
    },
    timelineDays: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    rainAlert: {
        backgroundColor: '#BBDEFB',
        borderRadius: 8,
        padding: 8,
        marginTop: 6,
    },
    rainAlertText: {
        fontSize: 12,
        color: '#1565C0',
        fontWeight: '600',
    },
    todayBadge: {
        backgroundColor: '#C8E6C9',
        borderRadius: 8,
        padding: 8,
        marginTop: 6,
    },
    todayBadgeText: {
        fontSize: 13,
        color: '#2E7D32',
        fontWeight: '700',
    },
    tomorrowBadge: {
        backgroundColor: '#FFF9C4',
        borderRadius: 8,
        padding: 8,
        marginTop: 6,
    },
    tomorrowBadgeText: {
        fontSize: 13,
        color: '#F57F17',
        fontWeight: '600',
    },
    smsBtn: {
        backgroundColor: '#4CAF50',
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    smsBtnIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    smsBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
    smsNote: {
        fontSize: 11,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 20,
    },
});

export default IrrigationScheduleScreen;

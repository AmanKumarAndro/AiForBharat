import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    Platform,
} from 'react-native';
import { COLORS } from '../utils/constants';
import IrrigationAPI from '../services/IrrigationAPI';
import Header from '../components/Header';

// SVG Icons
import SunIcon from '../../assets/svg/SunIcon';
import DropletIcon from '../../assets/svg/DropletIcon';
import LeafIcon from '../../assets/svg/LeafIcon';
import BellIcon from '../../assets/svg/BellIcon';
import ChevronRightIcon from '../../assets/svg/ChevronRightIcon';
import ToolIcon from '../../assets/svg/ToolIcon';

const { width } = Dimensions.get('window');

// Helper Functions
const getSoilStatusColor = (status) => {
    const colors = { 'Good': '#10B981', 'Moderate': '#F59E0B', 'Low': '#EF4444' };
    return colors[status] || '#9CA3AF';
};
const getSoilStatusHindi = (status) => {
    const hindi = { 'Good': 'अच्छी', 'Moderate': 'मध्यम', 'Low': 'कम' };
    return hindi[status] || status;
};
const getRecommendationHindi = (recommendation) => {
    const hindi = {
        'Irrigate soon': 'जल्द सिंचाई करें',
        'Monitor daily': 'रोज जांचें',
        'No irrigation needed': 'सिंचाई की जरूरत नहीं',
        'Check soil moisture': 'मिट्टी की नमी जांचें'
    };
    return hindi[recommendation] || recommendation;
};
const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins} मिनट पहले`;
    if (diffHours < 24) return `${diffHours} घंटे पहले`;
    if (diffDays < 7) return `${diffDays} दिन पहले`;
    return date.toLocaleDateString('hi-IN');
};

export default function IrrigationDashboardScreen({ navigation }) {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { loadDashboard(); }, []);

    const loadDashboard = async () => {
        try {
            setError(null);
            const farmer = await IrrigationAPI.getStoredFarmerData();
            if (!farmer || !farmer.farmerId) {
                navigation.replace('IrrigationRegistration');
                return;
            }
            const data = await IrrigationAPI.getDashboard(farmer.farmerId);
            setDashboard(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1B5E20" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!dashboard) return null;

    const soilColor = getSoilStatusColor(dashboard.farm.soil.status);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
            <Header title="Irrigation Dashboard" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} />
                }
            >
                {/* Greeting */}
                <View style={styles.greetingWrap}>
                    <Text style={styles.greeting}>नमस्ते, {dashboard.farmer.name} जी</Text>
                    <Text style={styles.greetingSub}>{dashboard.farmer.crop} • {dashboard.farmer.district}</Text>
                </View>

                {/* Weather Warnings */}
                {dashboard.weather?.warnings?.length > 0 && (
                    <View style={styles.warningCard}>
                        <View style={styles.warningDot} />
                        <View style={{ flex: 1 }}>
                            {dashboard.weather.warnings.map((warning, index) => (
                                <Text key={index} style={styles.warningText}>{warning.message}</Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* Weather Card */}
                <View style={styles.sectionHeader}>
                    <SunIcon width={16} height={16} color="#374151" />
                    <Text style={styles.sectionTitle}>मौसम (Weather)</Text>
                </View>
                <View style={styles.card}>
                    <View style={styles.weatherMain}>
                        <Text style={styles.temperature}>{dashboard.weather.current.temperature}°C</Text>
                        <Text style={styles.weatherCondition}>{dashboard.weather.current.conditionHindi}</Text>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>नमी</Text>
                            <Text style={styles.statValue}>{dashboard.weather.current.humidity}%</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>हवा</Text>
                            <Text style={styles.statValue}>{dashboard.weather.current.windSpeed} km/h</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>बारिश</Text>
                            <Text style={styles.statValue}>{dashboard.weather.rainfall.today}mm</Text>
                        </View>
                    </View>
                </View>

                {/* Rainfall Forecast */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>बारिश का पूर्वानुमान</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>अगले 48 घंटे</Text>
                            <Text style={[styles.statValue, { color: '#1B5E20' }]}>{dashboard.weather.rainfall.next48Hours}mm</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>संभावना</Text>
                            <Text style={[styles.statValue, { color: '#1B5E20' }]}>{dashboard.weather.rainfall.probability}%</Text>
                        </View>
                    </View>
                </View>

                {/* Crop Progress */}
                <View style={styles.sectionHeader}>
                    <LeafIcon width={16} height={16} color="#374151" />
                    <Text style={styles.sectionTitle}>फसल की प्रगति</Text>
                </View>
                <View style={styles.card}>
                    <View style={styles.cropHeader}>
                        <Text style={styles.cropName}>{dashboard.farm.crop.name}</Text>
                        <View style={styles.cropStageBadge}>
                            <Text style={styles.cropStageText}>{dashboard.farm.crop.stage}</Text>
                        </View>
                    </View>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${dashboard.farm.crop.progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{dashboard.farm.crop.progress}%</Text>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>बुवाई के दिन</Text>
                            <Text style={styles.statValue}>{dashboard.farm.crop.daysSinceSowing}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>बचे दिन</Text>
                            <Text style={styles.statValue}>{dashboard.farm.crop.daysRemaining}</Text>
                        </View>
                    </View>
                </View>

                {/* Soil Moisture */}
                <View style={styles.sectionHeader}>
                    <DropletIcon width={16} height={16} color="#374151" />
                    <Text style={styles.sectionTitle}>मिट्टी की नमी</Text>
                </View>
                <View style={styles.card}>
                    <View style={styles.soilRow}>
                        <View style={[styles.soilCircle, { borderColor: soilColor }]}>
                            <Text style={[styles.soilPercent, { color: soilColor }]}>{dashboard.farm.soil.moisturePercent}%</Text>
                            <Text style={styles.soilLabel}>नमी</Text>
                        </View>
                        <View style={[styles.soilBadge, { backgroundColor: soilColor + '18' }]}>
                            <View style={[styles.soilDot, { backgroundColor: soilColor }]} />
                            <Text style={[styles.soilBadgeText, { color: soilColor }]}>{getSoilStatusHindi(dashboard.farm.soil.status)}</Text>
                        </View>
                    </View>
                </View>

                {/* Irrigation Recommendation */}
                <View style={styles.recommendCard}>
                    <View style={styles.recommendIconWrap}>
                        <DropletIcon width={18} height={18} color="#1B5E20" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.recommendLabel}>सिंचाई सलाह</Text>
                        <Text style={styles.recommendValue}>{getRecommendationHindi(dashboard.farm.irrigation.nextRecommendation)}</Text>
                        {dashboard.farm.irrigation.consecutiveDryDays > 0 && (
                            <Text style={styles.recommendSub}>{dashboard.farm.irrigation.consecutiveDryDays} दिन से सूखा</Text>
                        )}
                    </View>
                    <ChevronRightIcon width={16} height={16} color="#1B5E20" />
                </View>

                {/* Savings Cards */}
                <View style={styles.sectionHeader}>
                    <ToolIcon width={16} height={16} color="#374151" />
                    <Text style={styles.sectionTitle}>बचत / Savings</Text>
                </View>
                <View style={styles.savingsRow}>
                    <View style={styles.savingsCard}>
                        <Text style={styles.savingsLabel}>इस सप्ताह</Text>
                        <Text style={styles.savingsValue}>{dashboard.statistics.weekly.litresSaved}L</Text>
                        <Text style={styles.savingsSub}>पानी बचाया</Text>
                        <Text style={styles.savingsMoney}>₹{dashboard.statistics.weekly.moneySaved}</Text>
                    </View>
                    <View style={styles.savingsCard}>
                        <Text style={styles.savingsLabel}>सीजन कुल</Text>
                        <Text style={styles.savingsValue}>{dashboard.statistics.season.litresSaved}L</Text>
                        <Text style={styles.savingsSub}>पानी बचाया</Text>
                        <Text style={styles.savingsMoney}>₹{dashboard.statistics.season.moneySaved}</Text>
                    </View>
                </View>

                {/* Alerts Summary */}
                <View style={styles.sectionHeader}>
                    <BellIcon width={16} height={16} color="#374151" />
                    <Text style={styles.sectionTitle}>अलर्ट सारांश (7 दिन)</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('IrrigationAlerts')} style={{ marginLeft: 'auto' }}>
                        <Text style={styles.viewAllBtn}>सभी देखें</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.card}>
                    <View style={styles.alertGrid}>
                        <View style={styles.alertItem}>
                            <Text style={styles.alertValue}>{dashboard.statistics.alerts.irrigate}</Text>
                            <Text style={styles.alertLabel}>सिंचाई</Text>
                        </View>
                        <View style={styles.alertItem}>
                            <Text style={styles.alertValue}>{dashboard.statistics.alerts.skip}</Text>
                            <Text style={styles.alertLabel}>छोड़ें</Text>
                        </View>
                        <View style={styles.alertItem}>
                            <Text style={styles.alertValue}>{dashboard.statistics.alerts.weather}</Text>
                            <Text style={styles.alertLabel}>मौसम</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Alerts */}
                {dashboard.recentAlerts?.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>हाल के अलर्ट</Text>
                        {dashboard.recentAlerts.slice(0, 3).map((alert, index) => (
                            <View key={index} style={styles.alertRow}>
                                <View style={styles.alertIconWrap}>
                                    <BellIcon width={14} height={14} color="#1B5E20" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
                                    <Text style={styles.alertTime}>{formatTime(alert.timestamp)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Last Updated */}
                <Text style={styles.lastUpdated}>अंतिम अपडेट: {formatTime(dashboard.lastUpdated)}</Text>
            </ScrollView>
        </View>
    );
}

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
        marginTop: 12,
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    errorText: {
        fontSize: 14,
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
    },
    retryButton: {
        backgroundColor: '#1B5E20',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    scrollContent: {
        paddingBottom: 90,
    },

    // Greeting
    greetingWrap: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    greeting: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.3,
    },
    greetingSub: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
        fontWeight: '600',
    },

    // Warning
    warningCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        borderRadius: 14,
        padding: 14,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    warningDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F59E0B',
        marginTop: 5,
        marginRight: 10,
    },
    warningText: {
        fontSize: 13,
        color: '#92400E',
        fontWeight: '600',
        lineHeight: 18,
    },

    // Section Headers
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        marginBottom: 10,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#374151',
    },
    viewAllBtn: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1B5E20',
    },

    // Cards
    card: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginBottom: 10,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
    },

    // Weather
    weatherMain: {
        alignItems: 'center',
        marginBottom: 16,
    },
    temperature: {
        fontSize: 48,
        fontWeight: '800',
        color: '#1B5E20',
    },
    weatherCondition: {
        fontSize: 15,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '600',
    },

    // Shared stats row
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#F3F4F6',
    },
    statLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },

    // Crop
    cropHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    cropName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1B5E20',
    },
    cropStageBadge: {
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    cropStageText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B5E20',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#1B5E20',
        borderRadius: 4,
    },
    progressText: {
        marginLeft: 10,
        fontSize: 13,
        fontWeight: '800',
        color: '#1B5E20',
    },

    // Soil
    soilRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    soilCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 5,
    },
    soilPercent: {
        fontSize: 26,
        fontWeight: '900',
    },
    soilLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    soilBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    soilDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    soilBadgeText: {
        fontSize: 14,
        fontWeight: '800',
    },

    // Recommendation
    recommendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        marginHorizontal: 20,
        marginTop: 16,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    recommendIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    recommendLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
    },
    recommendValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1B5E20',
        marginTop: 2,
    },
    recommendSub: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
        fontWeight: '600',
    },

    // Savings
    savingsRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        gap: 10,
    },
    savingsCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    savingsLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        marginBottom: 6,
    },
    savingsValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1B5E20',
    },
    savingsSub: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '600',
        marginTop: 2,
    },
    savingsMoney: {
        fontSize: 14,
        fontWeight: '800',
        color: '#F59E0B',
        marginTop: 4,
    },

    // Alerts
    alertGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    alertItem: {
        alignItems: 'center',
    },
    alertValue: {
        fontSize: 26,
        fontWeight: '900',
        color: '#111827',
    },
    alertLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        marginTop: 2,
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    alertIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    alertMessage: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        lineHeight: 18,
    },
    alertTime: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
        fontWeight: '500',
    },

    // Footer
    lastUpdated: {
        textAlign: 'center',
        fontSize: 11,
        color: '#D1D5DB',
        marginTop: 16,
        fontWeight: '600',
    },
});

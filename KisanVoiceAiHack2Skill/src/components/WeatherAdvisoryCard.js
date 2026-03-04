import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

const WeatherAdvisoryCard = ({ advisoryData, weatherData, locationName, onSeeMore, style }) => {
    // Fallback: render a basic card using Open-Meteo weather data when advisory API hasn't returned yet
    if (!advisoryData) {
        if (!weatherData) return null;
        const temp = weatherData.temp !== undefined ? `${weatherData.temp}°C` : '--°C';
        return (
            <Animated.View style={[styles.container, style]}>
                <View style={styles.topSection}>
                    <View style={styles.headerRow}>
                        <View style={styles.weatherInfo}>
                            <Text style={styles.weatherEmoji}>{weatherData.icon || '🌤️'}</Text>
                            <View>
                                <Text style={styles.tempText}>{temp}</Text>
                                <Text style={styles.locText} numberOfLines={1}>
                                    📍 {locationName || 'Your Farm'}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.badge, { backgroundColor: '#EFF6FF' }]}>
                            <Text style={[styles.badgeText, { color: '#2563EB' }]}>🌤️ {weatherData.description || 'Weather'}</Text>
                        </View>
                    </View>
                    <Text style={styles.message}>
                        Today: {weatherData.description || 'Weather data available'} · Max {weatherData.tempMax}°C / Min {weatherData.tempMin}°C · Rain {weatherData.rainMm ?? 0}mm
                    </Text>
                </View>
                <View style={styles.metricsRow}>
                    <View style={styles.metricsWrap}>
                        <MiniMetric icon="🌡️" label="Max" value={weatherData.tempMax !== undefined ? `${weatherData.tempMax}°` : '--'} />
                        <View style={styles.divider} />
                        <MiniMetric icon="❄️" label="Min" value={weatherData.tempMin !== undefined ? `${weatherData.tempMin}°` : '--'} />
                        <View style={styles.divider} />
                        <MiniMetric icon="🌧️" label="Rain" value={`${weatherData.rainMm ?? 0}mm`} />
                    </View>
                    <TouchableOpacity style={styles.ctaBtn} onPress={onSeeMore} activeOpacity={0.8}>
                        <Text style={styles.ctaText}>See More</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    }

    const isSafe = advisoryData.advisory?.spray_safe;
    const color = isSafe ? '#059669' : '#DC2626';
    const bg = isSafe ? '#ECFDF5' : '#FEF2F2';
    const statusIcon = isSafe ? '✅' : '⚠️';
    const statusText = isSafe ? 'Safe to Spray' : 'Avoid Spraying';

    // Temperature comes directly from the advisory API response
    const temp = advisoryData.temperature ? `${Math.round(advisoryData.temperature)}°C` : '--°C';

    return (
        <Animated.View style={[styles.container, style]}>

            {/* Top Section: Weather temp + Advisory badge */}
            <View style={styles.topSection}>
                <View style={styles.headerRow}>
                    {/* Weather Info */}
                    <View style={styles.weatherInfo}>
                        <Text style={styles.weatherEmoji}>🌤️</Text>
                        <View>
                            <Text style={styles.tempText}>{temp}</Text>
                            <Text style={styles.locText} numberOfLines={1}>
                                📍 {locationName || 'Your Farm'}
                            </Text>
                        </View>
                    </View>

                    {/* Advisory Badge */}
                    <View style={[styles.badge, { backgroundColor: bg }]}>
                        <Text style={[styles.badgeText, { color }]}>{statusIcon} {statusText}</Text>
                    </View>
                </View>

                {/* Friendly AI Message */}
                <Text style={styles.message}>
                    {advisoryData.friendly_message}
                </Text>
            </View>

            {/* Bottom Section: Metrics Mini Row & CTA */}
            <View style={styles.metricsRow}>
                <View style={styles.metricsWrap}>
                    <MiniMetric icon="🌧️" label="Rain" value={`${advisoryData.rain_probability_next_6h ?? '--'}%`} />
                    <View style={styles.divider} />
                    <MiniMetric icon="💨" label="Wind" value={`${advisoryData.wind_speed ?? '--'}km`} />
                    <View style={styles.divider} />
                    <MiniMetric icon="💧" label="Humid" value={`${advisoryData.humidity ?? '--'}%`} />
                    <View style={styles.divider} />
                    <MiniMetric icon="☀️" label="UV" value={`${advisoryData.uv_index ?? '--'}`} />
                </View>
                <TouchableOpacity style={styles.ctaBtn} onPress={onSeeMore} activeOpacity={0.8}>
                    <Text style={styles.ctaText}>See More</Text>
                </TouchableOpacity>
            </View>

        </Animated.View>
    );
};

const MiniMetric = ({ icon, label, value }) => (
    <View style={styles.miniMetric}>
        <Text style={styles.miniIcon}>{icon}</Text>
        <View>
            <Text style={styles.miniValue}>{value}</Text>
            <Text style={styles.miniLabel}>{label}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 18,
        marginTop: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
        zIndex: 10,
    },
    topSection: {
        padding: 16,
        paddingBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    weatherInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weatherEmoji: {
        fontSize: 32,
        marginRight: 8,
    },
    tempText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
    },
    locText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 2,
        maxWidth: 120,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    message: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
        lineHeight: 19,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    metricsWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    miniMetric: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 6,
    },
    miniIcon: {
        fontSize: 13,
        marginRight: 3,
    },
    miniValue: {
        fontSize: 11,
        fontWeight: '800',
        color: '#111827',
    },
    miniLabel: {
        fontSize: 9,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    divider: {
        width: 1,
        height: 16,
        backgroundColor: '#E5E7EB',
        marginRight: 6,
    },
    ctaBtn: {
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 14,
        marginLeft: 6,
    },
    ctaText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    }
});

export default WeatherAdvisoryCard;

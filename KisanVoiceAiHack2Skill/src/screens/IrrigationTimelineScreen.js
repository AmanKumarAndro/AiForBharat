import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Dimensions,
} from 'react-native';
import { COLORS } from '../utils/constants';
import IrrigationAPI from '../services/IrrigationAPI';
import CropCalendarAPI from '../services/CropCalendarAPI';
import Header from '../components/Header';
import LeafIcon from '../../assets/svg/LeafIcon';
import DropletIcon from '../../assets/svg/DropletIcon';
import CheckIcon from '../../assets/svg/CheckIcon';

const { width } = Dimensions.get('window');

export default function IrrigationTimelineScreen({ navigation }) {
    const [calendar, setCalendar] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadTimeline(); }, []);

    const loadTimeline = async () => {
        try {
            const farmer = await IrrigationAPI.getStoredFarmerData();
            if (!farmer) { setLoading(false); return; }

            const currentDay = CropCalendarAPI.calculateCurrentDay(farmer.sowingDate || farmer.createdAt);
            const data = await CropCalendarAPI.getCropCalendar(farmer.crop, {
                language: farmer.language || 'hi',
                currentDay,
            });

            if (data && data.stages) {
                setCalendar(data);
            } else {
                setCalendar(null);
            }
        } catch (error) {
            console.error('Error loading timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1B5E20" />
            </View>
        );
    }

    if (!calendar) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>No timeline data available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
            <Header title={`${calendar.name} Timeline`} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Season Tag */}
                <View style={styles.seasonTagRow}>
                    <View style={styles.seasonTag}>
                        <LeafIcon width={12} height={12} color="#1B5E20" />
                        <Text style={styles.seasonTagText}>{calendar.season?.toUpperCase()} • {calendar.totalDuration} DAYS</Text>
                    </View>
                </View>

                {/* Progress Card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <View>
                            <Text style={styles.progressTitle}>Growth Progress</Text>
                            <Text style={styles.progressSub}>Currently at {calendar.currentStage?.name}</Text>
                        </View>
                        <Text style={styles.progressPercent}>{calendar.overallProgress}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${calendar.overallProgress}%` }]} />
                    </View>
                    <View style={styles.progressStats}>
                        <Text style={styles.progressStatText}>DAY {calendar.daysElapsed}</Text>
                        <Text style={styles.progressStatText}>HARVEST: DAY {calendar.totalDuration}</Text>
                    </View>
                </View>

                {/* Timeline */}
                <View style={styles.sectionHeader}>
                    <LeafIcon width={16} height={16} color="#374151" />
                    <Text style={styles.sectionTitle}>Growth Stages</Text>
                </View>

                <View style={styles.timelineWrap}>
                    {calendar.stages.map((stage, index) => {
                        const isLast = index === calendar.stages.length - 1;
                        return (
                            <View key={stage.id} style={styles.stageRow}>
                                {/* Timeline markers */}
                                <View style={styles.markerCol}>
                                    <View style={[
                                        styles.markerDot,
                                        stage.isCurrent && styles.markerDotCurrent,
                                        stage.isCompleted && styles.markerDotDone,
                                    ]}>
                                        {stage.isCompleted && <CheckIcon width={10} height={10} color="#FFF" />}
                                        {stage.isCurrent && <View style={styles.markerInnerDot} />}
                                    </View>
                                    {!isLast && (
                                        <View style={[styles.markerLine, stage.isCompleted && styles.markerLineDone]} />
                                    )}
                                </View>

                                {/* Content */}
                                <View style={[styles.stageCard, stage.isCurrent && styles.stageCardActive]}>
                                    <View style={styles.stageCardHeader}>
                                        <View style={styles.stageIconWrap}>
                                            <LeafIcon width={18} height={18} color="#1B5E20" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.stageName}>{stage.name}</Text>
                                            <Text style={styles.stageDays}>Day {stage.startDay}–{stage.endDay}</Text>
                                        </View>
                                        {stage.isCurrent && (
                                            <View style={styles.activeBadge}>
                                                <Text style={styles.activeBadgeText}>ACTIVE</Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={styles.stageDesc}>{stage.description}</Text>

                                    <View style={styles.infoRow}>
                                        <View style={styles.infoItem}>
                                            <DropletIcon width={14} height={14} color="#1B5E20" />
                                            <View>
                                                <Text style={styles.infoLabel}>Irrigation</Text>
                                                <Text style={styles.infoValue}>{stage.irrigation}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.infoItem}>
                                            <LeafIcon width={14} height={14} color="#1B5E20" />
                                            <View>
                                                <Text style={styles.infoLabel}>Fertilizer</Text>
                                                <Text style={styles.infoValue}>{stage.fertilizer}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {stage.isCurrent && stage.activities && (
                                        <View style={styles.activitiesBox}>
                                            <Text style={styles.activitiesTitle}>Recommended Activities</Text>
                                            {stage.activities.map((act, i) => (
                                                <View key={i} style={styles.activityRow}>
                                                    <View style={styles.activityDot} />
                                                    <Text style={styles.activityText}>{act}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
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
    errorText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 90,
    },

    // Season Tag
    seasonTagRow: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    seasonTag: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    seasonTagText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1B5E20',
        letterSpacing: 0.5,
    },

    // Progress Card
    progressCard: {
        backgroundColor: '#1B5E20',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
    },
    progressSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 3,
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFF',
        borderRadius: 3,
    },
    progressStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    progressStatText: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 0.5,
    },

    // Section
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#374151',
    },

    // Timeline
    timelineWrap: {
        paddingLeft: 20,
        paddingRight: 20,
    },
    stageRow: {
        flexDirection: 'row',
    },
    markerCol: {
        alignItems: 'center',
        width: 28,
    },
    markerDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerDotCurrent: {
        borderColor: '#1B5E20',
        backgroundColor: '#FFF',
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 3,
    },
    markerInnerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1B5E20',
    },
    markerDotDone: {
        borderColor: '#1B5E20',
        backgroundColor: '#1B5E20',
    },
    markerLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 2,
    },
    markerLineDone: {
        backgroundColor: '#1B5E20',
    },

    // Stage Card
    stageCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        marginLeft: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    stageCardActive: {
        borderColor: '#1B5E20',
        borderWidth: 2,
    },
    stageCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    stageIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    stageName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    stageDays: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        marginTop: 1,
    },
    activeBadge: {
        backgroundColor: '#1B5E20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    activeBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    stageDesc: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 19,
        marginBottom: 12,
        fontWeight: '500',
    },

    // Info row
    infoRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    infoItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 10,
    },
    infoLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
        marginTop: 1,
    },

    // Activities
    activitiesBox: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    activitiesTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1B5E20',
        marginBottom: 8,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
        gap: 8,
    },
    activityDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#1B5E20',
        marginTop: 6,
    },
    activityText: {
        flex: 1,
        fontSize: 12,
        color: '#374151',
        lineHeight: 18,
        fontWeight: '600',
    },
});

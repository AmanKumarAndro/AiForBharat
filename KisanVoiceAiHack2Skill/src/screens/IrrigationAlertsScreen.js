import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    ScrollView,
} from 'react-native';
import { COLORS } from '../utils/constants';
import IrrigationAPI from '../services/IrrigationAPI';
import Header from '../components/Header';
import BellIcon from '../../assets/svg/BellIcon';
import DropletIcon from '../../assets/svg/DropletIcon';
import SunIcon from '../../assets/svg/SunIcon';

const { width } = Dimensions.get('window');

const FilterTab = ({ label, count, isActive, onPress }) => (
    <TouchableOpacity
        style={[styles.filterTab, isActive && styles.filterTabActive]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
        <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
            <Text style={[styles.countText, isActive && styles.countTextActive]}>{count}</Text>
        </View>
    </TouchableOpacity>
);

export default function IrrigationAlertsScreen({ navigation }) {
    const [alerts, setAlerts] = useState([]);
    const [filteredAlerts, setFilteredAlerts] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [farmerData, setFarmerData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadAlerts(); }, []);
    useEffect(() => { filterAlerts(); }, [activeFilter, alerts]);

    const loadAlerts = async () => {
        try {
            const farmer = await IrrigationAPI.getStoredFarmerData();
            setFarmerData(farmer);
            if (farmer) {
                const data = await IrrigationAPI.getAlertsByPhone(farmer.phone);
                setAlerts(data?.alerts || []);
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    const filterAlerts = () => {
        switch (activeFilter) {
            case 'irrigation':
                setFilteredAlerts(alerts.filter(a => !a.messageType.startsWith('weather_')));
                break;
            case 'weather':
                setFilteredAlerts(alerts.filter(a => a.messageType.startsWith('weather_')));
                break;
            default:
                setFilteredAlerts(alerts);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadAlerts();
        setRefreshing(false);
    }, []);

    const handleDeleteAlert = (alertId) => {
        Alert.alert('Delete Notification', 'Remove this insight from your history?', [
            { text: 'Keep', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive',
                onPress: async () => {
                    try {
                        await IrrigationAPI.deleteAlert(farmerData.farmerId, alertId);
                        setAlerts(alerts.filter(a => (a.alertId || a.timestamp) !== alertId));
                    } catch (error) {
                        Alert.alert('Error', error.message);
                    }
                }
            }
        ]);
    };

    const getAlertColor = (type, severity) => {
        if (severity === 'critical') return '#EF4444';
        if (severity === 'high') return '#F59E0B';
        if (type?.startsWith('weather_')) return '#EF4444';
        return '#1B5E20';
    };

    const getAlertBg = (type) => {
        if (type?.startsWith('weather_')) return '#FEF2F2';
        if (type === 'irrigate') return '#F0FDF4';
        if (type === 'skip') return '#FFFBEB';
        return '#F0FDF4';
    };

    const AlertIcon = ({ type }) => {
        if (type?.startsWith('weather_')) return <SunIcon width={16} height={16} color="#EF4444" />;
        if (type === 'irrigate') return <DropletIcon width={16} height={16} color="#1B5E20" />;
        return <BellIcon width={16} height={16} color="#1B5E20" />;
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const renderAlert = ({ item }) => {
        const color = getAlertColor(item.messageType, item.severity);
        const bg = getAlertBg(item.messageType);
        return (
            <View style={styles.alertCard}>
                <View style={styles.alertHeader}>
                    <View style={[styles.alertIconWrap, { backgroundColor: bg }]}>
                        <AlertIcon type={item.messageType} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.alertTypeRow}>
                            <Text style={styles.alertType}>
                                {item.messageType.replace('weather_', '').replace('_', ' ').toUpperCase()}
                            </Text>
                            {item.severity === 'critical' && (
                                <View style={styles.criticalBadge}>
                                    <Text style={styles.criticalText}>CRITICAL</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.alertTime}>{formatTimestamp(item.timestamp)}</Text>
                    </View>
                </View>

                <Text style={styles.alertMessage}>{item.messageBody}</Text>

                <View style={styles.cardFooter}>
                    <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => item.messageType === 'irrigate' && navigation.navigate('Home')}
                    >
                        <Text style={styles.viewBtnText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteAlert(item.alertId || item.timestamp)}
                    >
                        <Text style={styles.deleteBtnText}>Remove</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
            <Header title="Insights & Alerts" />

            {farmerData?.district && (
                <Text style={styles.subtitle}>Real-time updates for {farmerData.district}</Text>
            )}

            {/* Filter Tabs */}
            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <FilterTab label="All" count={alerts.length} isActive={activeFilter === 'all'} onPress={() => setActiveFilter('all')} />
                    <FilterTab label="Irrigation" count={alerts.filter(a => !a.messageType.startsWith('weather_')).length} isActive={activeFilter === 'irrigation'} onPress={() => setActiveFilter('irrigation')} />
                    <FilterTab label="Weather" count={alerts.filter(a => a.messageType.startsWith('weather_')).length} isActive={activeFilter === 'weather'} onPress={() => setActiveFilter('weather')} />
                </ScrollView>
            </View>

            <FlatList
                data={filteredAlerts}
                keyExtractor={(item) => item.alertId || item.timestamp?.toString() || Math.random().toString()}
                renderItem={renderAlert}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} />}
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator size="large" color="#1B5E20" style={{ marginTop: 100 }} />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconWrap}>
                                <BellIcon width={28} height={28} color="#D1D5DB" />
                            </View>
                            <Text style={styles.emptyText}>No alerts yet</Text>
                            <Text style={styles.emptySubtext}>We'll notify you as soon as there's an update for your field.</Text>
                        </View>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFBFC',
    },
    subtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '600',
        paddingHorizontal: 20,
        marginTop: -8,
        marginBottom: 8,
    },

    // Filters
    filterWrapper: {
        paddingVertical: 8,
    },
    filterScroll: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 6,
    },
    filterTabActive: {
        backgroundColor: '#1B5E20',
        borderColor: '#1B5E20',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
    },
    filterTextActive: {
        color: '#FFF',
    },
    countBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    countBadgeActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    countText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#6B7280',
    },
    countTextActive: {
        color: '#FFF',
    },

    // List
    listContainer: {
        padding: 20,
        paddingBottom: 90,
    },

    // Alert Card
    alertCard: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    alertIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    alertTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    alertType: {
        fontSize: 11,
        fontWeight: '800',
        color: '#374151',
        letterSpacing: 0.5,
    },
    criticalBadge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    criticalText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#EF4444',
    },
    alertTime: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        marginTop: 1,
    },
    alertMessage: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        lineHeight: 20,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 10,
    },
    viewBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F0FDF4',
    },
    viewBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B5E20',
    },
    deleteBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
    },
    deleteBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#EF4444',
    },

    // Empty
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#374151',
        marginBottom: 6,
    },
    emptySubtext: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '600',
    },
});

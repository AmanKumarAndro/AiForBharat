import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, Linking, Modal, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import farmServicesApi from '../services/farmServicesApi';
import Header from '../components/Header';
import TractorIcon from '../../assets/svg/TractorIcon';
import LeafIcon from '../../assets/svg/LeafIcon';
import ShopIcon from '../../assets/svg/ShopIcon';
import MapPinIcon from '../../assets/svg/MapPinIcon';

const STATUS_CONFIG = {
    PENDING: { label: 'Sending Request…', sub: 'Creating your service request', color: '#D97706', pulse: true },
    NOTIFYING: { label: 'Notifying Providers…', sub: 'Providers are receiving your SMS', color: '#2563EB', pulse: true },
    MATCHED: { label: 'Provider Found!', sub: 'A provider accepted your request', color: '#059669', pulse: false },
    COMPLETED: { label: 'Service Completed', sub: 'Thank you for using KisanVoice Services', color: '#1B5E20', pulse: false },
    NO_PROVIDERS_FOUND: { label: 'No Providers Found', sub: 'No available providers in your area', color: '#ef4444', pulse: false },
};

const SERVICE_ICONS = {
    TRACTOR: { Icon: TractorIcon, bg: '#FEF3C7', color: '#D97706' },
    LABOUR: { Icon: LeafIcon, bg: '#D1FAE5', color: '#059669' },
    TRANSPORT: { Icon: ShopIcon, bg: '#DBEAFE', color: '#2563EB' },
};

export default function RequestStatusScreen({ route, navigation }) {
    const { requestId, serviceType, providerName: initProviderName, providerPhone: initProviderPhone, providerRating: initRating } = route.params || {};

    const [status, setStatus] = useState('PENDING');
    const [requestData, setRequestData] = useState(null);
    const [polling, setPolling] = useState(true);
    const [rateModal, setRateModal] = useState(false);
    const [starRating, setStarRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [rated, setRated] = useState(false);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pollRef = useRef(null);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        startPolling();
        return () => clearInterval(pollRef.current);
    }, []);

    useEffect(() => {
        const cfg = STATUS_CONFIG[status];
        if (cfg?.pulse) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
        }
        if (['MATCHED', 'NO_PROVIDERS_FOUND', 'COMPLETED'].includes(status)) {
            clearInterval(pollRef.current);
            setPolling(false);
        }
    }, [status]);

    const startPolling = () => {
        poll();
        pollRef.current = setInterval(poll, 4000);
    };

    const poll = async () => {
        if (!requestId) return;
        const result = await farmServicesApi.getRequestStatus(requestId);
        if (result.success) {
            setRequestData(result.data);
            setStatus(result.data.status || 'PENDING');
        }
    };

    const handleRate = async () => {
        if (starRating === 0) { Alert.alert('Please select a rating'); return; }
        setSubmitting(true);
        const result = await farmServicesApi.completeAndRate(requestId, starRating);
        setSubmitting(false);
        setRateModal(false);
        if (result.success) {
            setRated(true);
            setStatus('COMPLETED');
            Alert.alert('⭐ Thank you!', `Rating submitted! Provider's new rating: ${result.data?.new_rating?.toFixed(2) || starRating}`);
        } else {
            Alert.alert('Error', result.error || 'Could not submit rating');
        }
    };

    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const matchedProvider = requestData?.matched_provider || {
        name: initProviderName,
        phone: initProviderPhone,
        rating: initRating,
    };
    const svcIcon = SERVICE_ICONS[requestData?.service_type || serviceType] || SERVICE_ICONS.TRACTOR;

    return (
        <View style={st.root}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
            <Header title="Service Request" />

            <Animated.View style={[st.body, { opacity: fadeAnim }]}>
                {/* Status Blob */}
                <View style={st.blobWrap}>
                    <Animated.View style={[st.blobOuter, { borderColor: cfg.color + '25', transform: [{ scale: pulseAnim }] }]}>
                        <View style={[st.blobMiddle, { backgroundColor: cfg.color + '15' }]}>
                            <View style={[st.blobCore, { backgroundColor: cfg.color }]}>
                                <svcIcon.Icon width={32} height={32} color="#FFF" />
                            </View>
                        </View>
                    </Animated.View>
                </View>

                <Text style={[st.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                <Text style={st.statusSub}>{cfg.sub}</Text>

                {/* Request ID */}
                {requestId && (
                    <View style={st.idBadge}>
                        <Text style={st.idText}>Request ID: {requestId.slice(0, 8).toUpperCase()}</Text>
                    </View>
                )}

                {/* Stepper */}
                <View style={st.stepper}>
                    {['PENDING', 'NOTIFYING', 'MATCHED'].map((s, idx) => {
                        const steps = ['PENDING', 'NOTIFYING', 'MATCHED', 'COMPLETED'];
                        const currentIdx = steps.indexOf(status);
                        const done = steps.indexOf(s) < currentIdx || status === s;
                        const active = s === status;
                        return (
                            <React.Fragment key={s}>
                                <View style={st.stepItem}>
                                    <View style={[st.stepDot, done && st.stepDotDone, active && { borderColor: cfg.color }]}>
                                        {done && <Text style={st.stepCheck}>✓</Text>}
                                    </View>
                                    <Text style={[st.stepLabel, done && { color: '#1B5E20', fontWeight: '700' }]}>
                                        {s === 'PENDING' ? 'Sent' : s === 'NOTIFYING' ? 'Notified' : 'Matched'}
                                    </Text>
                                </View>
                                {idx < 2 && <View style={[st.stepLine, done && steps.indexOf(s) < currentIdx && st.stepLineDone]} />}
                            </React.Fragment>
                        );
                    })}
                </View>

                {/* Matched Provider Card */}
                {(status === 'MATCHED' || status === 'COMPLETED') && matchedProvider?.name && (
                    <View style={st.provCard}>
                        <View style={st.provHeader}>
                            <View style={[st.provAvatar, { backgroundColor: svcIcon.bg }]}>
                                <svcIcon.Icon width={22} height={22} color={svcIcon.color} />
                            </View>
                            <View style={st.provMeta}>
                                <Text style={st.provName}>{matchedProvider.name}</Text>
                                {matchedProvider.rating && (
                                    <Text style={st.provRating}>⭐ {Number(matchedProvider.rating).toFixed(1)}</Text>
                                )}
                            </View>
                            <View style={st.availBadge}>
                                <View style={st.availDot} />
                                <Text style={st.availText}>On the way</Text>
                            </View>
                        </View>

                        <View style={st.provActions}>
                            {matchedProvider.phone && (
                                <TouchableOpacity
                                    style={st.callBtn}
                                    onPress={() => Linking.openURL(`tel:${matchedProvider.phone}`)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={st.callBtnText}>Call Provider</Text>
                                </TouchableOpacity>
                            )}
                            {!rated && status !== 'COMPLETED' && (
                                <TouchableOpacity
                                    style={st.rateBtn}
                                    onPress={() => setRateModal(true)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={st.rateBtnText}>⭐ Rate Service</Text>
                                </TouchableOpacity>
                            )}
                            {rated && (
                                <View style={st.ratedBadge}>
                                    <Text style={st.ratedText}>Rated {starRating} stars</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* No providers */}
                {status === 'NO_PROVIDERS_FOUND' && (
                    <TouchableOpacity style={st.retryBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Text style={st.retryText}>← Go Back & Try Again</Text>
                    </TouchableOpacity>
                )}

                {/* Polling */}
                {polling && (
                    <View style={st.pollingRow}>
                        <ActivityIndicator size="small" color="#D1D5DB" />
                        <Text style={st.pollingText}>Checking for updates…</Text>
                    </View>
                )}
            </Animated.View>

            {/* Star Rating Modal */}
            <Modal visible={rateModal} transparent animationType="slide">
                <View style={st.modalOverlay}>
                    <View style={st.modalCard}>
                        <Text style={st.modalTitle}>Rate the Service</Text>
                        <Text style={st.modalSub}>How was your experience with {matchedProvider?.name}?</Text>
                        <View style={st.starsRow}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <TouchableOpacity key={s} onPress={() => setStarRating(s)}>
                                    <Text style={[st.star, s <= starRating && st.starActive]}>★</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={st.starLabel}>
                            {starRating === 0 ? 'Tap to rate' : starRating === 5 ? 'Excellent!' : starRating >= 4 ? 'Very good!' : starRating >= 3 ? 'Good' : 'Could be better'}
                        </Text>
                        <View style={st.modalBtns}>
                            <TouchableOpacity style={st.modalCancel} onPress={() => setRateModal(false)}>
                                <Text style={st.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={st.modalSubmit} onPress={handleRate} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={st.modalSubmitText}>Submit Rating</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FAFBFC' },
    body: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 28 },

    // Blob
    blobWrap: { marginBottom: 24 },
    blobOuter: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blobMiddle: {
        width: 106,
        height: 106,
        borderRadius: 53,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blobCore: {
        width: 76,
        height: 76,
        borderRadius: 38,
        justifyContent: 'center',
        alignItems: 'center',
    },

    statusLabel: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 6,
        textAlign: 'center',
    },
    statusSub: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 14,
    },

    idBadge: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    idText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 0.5,
    },

    // Stepper
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        width: '90%',
    },
    stepItem: { alignItems: 'center', width: 60 },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    stepDotDone: {
        backgroundColor: '#1B5E20',
        borderColor: '#1B5E20',
    },
    stepCheck: { color: '#FFF', fontSize: 13, fontWeight: '900' },
    stepLabel: { fontSize: 11, color: '#D1D5DB', fontWeight: '600' },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#F3F4F6',
        marginBottom: 14,
    },
    stepLineDone: { backgroundColor: '#1B5E20' },

    // Provider Card
    provCard: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    provHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    provAvatar: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    provMeta: { flex: 1 },
    provName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
    },
    provRating: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        marginTop: 2,
    },
    availBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#D1FAE5',
        gap: 4,
    },
    availDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
    },
    availText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#065f46',
    },
    provActions: {
        flexDirection: 'row',
        gap: 10,
    },
    callBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    callBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#10b981',
    },
    rateBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#D97706',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rateBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFF',
    },
    ratedBadge: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    ratedText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#065f46',
    },

    retryBtn: {
        paddingHorizontal: 28,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#1B5E20',
        marginTop: 8,
    },
    retryText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },

    pollingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 8,
    },
    pollingText: {
        fontSize: 12,
        color: '#D1D5DB',
        fontWeight: '500',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 28,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 6,
    },
    modalSub: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    star: { fontSize: 40, color: '#E5E7EB' },
    starActive: { color: '#D97706' },
    starLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '700',
        marginBottom: 24,
    },
    modalBtns: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    modalCancel: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        alignItems: 'center',
    },
    modalCancelText: {
        fontWeight: '700',
        color: '#9CA3AF',
        fontSize: 14,
    },
    modalSubmit: {
        flex: 2,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#D97706',
        alignItems: 'center',
    },
    modalSubmitText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 14,
    },
});

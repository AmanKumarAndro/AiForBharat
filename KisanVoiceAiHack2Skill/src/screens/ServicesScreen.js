import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    Alert,
    Linking,
    TextInput,
    RefreshControl,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import farmServicesApi from '../services/farmServicesApi';
import api from '../services/api';
import ActiveRequestStore from '../services/ActiveRequestStore';
import Header from '../components/Header';
import BackIconSvg from '../../assets/svg/BackIconSvg';
import TractorIcon from '../../assets/svg/TractorIcon';
import LeafIcon from '../../assets/svg/LeafIcon';
import ShopIcon from '../../assets/svg/ShopIcon';
import MapPinIcon from '../../assets/svg/MapPinIcon';
import ClipboardIcon from '../../assets/svg/ClipboardIcon';
import ChevronRightIcon from '../../assets/svg/ChevronRightIcon';
import UserIcon from '../../assets/svg/UserIcon';
import CheckIcon from '../../assets/svg/CheckIcon';

const { width } = Dimensions.get('window');

const SERVICES = [
    {
        id: 'TRACTOR', label: 'Tractor', hindi: 'ट्रैक्टर',
        SvgIcon: TractorIcon, desc: 'Ploughing, levelling, sowing',
        descHindi: 'जुताई, समतलीकरण, बुवाई',
        color: '#D97706', bg: '#FEF3C7',
    },
    {
        id: 'LABOUR', label: 'Labour', hindi: 'मज़दूर',
        SvgIcon: LeafIcon, desc: 'Harvesting, weeding, planting',
        descHindi: 'फसल कटाई, निराई, रोपण',
        color: '#059669', bg: '#D1FAE5',
    },
    {
        id: 'TRANSPORT', label: 'Transport', hindi: 'ट्रांसपोर्ट',
        SvgIcon: ShopIcon, desc: 'Mandi delivery, crop movement',
        descHindi: 'मंडी डिलीवरी, फसल परिवहन',
        color: '#2563EB', bg: '#DBEAFE',
    },
];

const getColor = (type) => SERVICES.find(s => s.id === type)?.color || '#1B5E20';

export default function ServicesScreen({ navigation }) {
    const [step, setStep] = useState('select');
    const [selectedService, setSelectedService] = useState(null);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [pincode, setPincode] = useState('411001');
    const [editPincode, setEditPincode] = useState(false);
    const [tempPincode, setTempPincode] = useState('411001');
    const [farmerPhone, setFarmerPhone] = useState('');
    const [farmerName, setFarmerName] = useState('');
    const [booking, setBooking] = useState(false);
    const [activeBooking, setActiveBooking] = useState(ActiveRequestStore.get());

    const selectFade = useRef(new Animated.Value(1)).current;
    const listSlide = useRef(new Animated.Value(width)).current;
    const cardScales = useRef(SERVICES.map(() => new Animated.Value(1))).current;

    useEffect(() => {
        loadProfile();
        const unsubscribe = navigation.addListener('focus', refreshActiveBooking);
        return unsubscribe;
    }, [navigation]);

    const refreshActiveBooking = async () => {
        const stored = ActiveRequestStore.get();
        if (stored) setActiveBooking(stored);
        if (farmerPhone) {
            const result = await farmServicesApi.getFarmerRequests(farmerPhone);
            if (result.success && result.data.ongoing?.length > 0) {
                const latest = result.data.ongoing[0];
                const merged = {
                    requestId: latest.request_id,
                    serviceType: latest.service_type,
                    providerName: latest.matched_provider_id ? 'Provider matched' : 'Finding provider…',
                    bookedAt: latest.created_at,
                };
                ActiveRequestStore.set(merged);
                setActiveBooking(merged);
            } else if (result.success && result.data.ongoing?.length === 0 && stored) {
                if (['COMPLETED', 'NO_PROVIDERS_FOUND'].includes(stored.status)) {
                    ActiveRequestStore.clear();
                    setActiveBooking(null);
                }
            }
        }
    };

    const loadProfile = async () => {
        try {
            const ud = await api.getUserData();
            if (ud?.phone) setFarmerPhone(ud.phone);
            if (ud?.name) setFarmerName(ud.name);
            if (ud?.pincode) { setPincode(ud.pincode); setTempPincode(ud.pincode); }
        } catch (e) { }
    };

    const handleSelectService = (service) => {
        setSelectedService(service);
        Animated.parallel([
            Animated.timing(selectFade, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.spring(listSlide, { toValue: 0, friction: 9, useNativeDriver: true }),
        ]).start();
        setStep('list');
        fetchProviders(service.id, pincode);
    };

    const handleBack = () => {
        Animated.parallel([
            Animated.timing(selectFade, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(listSlide, { toValue: width, duration: 220, useNativeDriver: true }),
        ]).start(() => setStep('select'));
        setProviders([]);
        setExpandedId(null);
    };

    const fetchProviders = async (serviceId, pin, isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        const result = await farmServicesApi.getProviders(pin || pincode, serviceId || selectedService?.id);
        if (result.success) setProviders(result.data.providers || []);
        else Alert.alert('Error', result.error || 'Could not load providers');
        if (isRefresh) setRefreshing(false); else setLoading(false);
    };

    const applyPincode = () => {
        setEditPincode(false);
        if (tempPincode.length === 6) {
            setPincode(tempPincode);
            fetchProviders(selectedService?.id, tempPincode);
        }
    };

    const handleBook = async (provider) => {
        setBooking(true);
        const result = await farmServicesApi.createRequest(
            farmerPhone, farmerName || 'Farmer',
            provider.service_type, pincode, provider.price_per_hour
        );
        setBooking(false);
        if (result.success) {
            const bookingData = {
                requestId: result.data.request_id, serviceType: provider.service_type,
                providerName: provider.name, providerPhone: provider.phone,
                providerRating: provider.rating, price: provider.price_per_hour,
                bookedAt: new Date().toISOString(),
            };
            ActiveRequestStore.set(bookingData);
            setActiveBooking(bookingData);
            navigation.navigate('RequestStatus', bookingData);
        } else {
            Alert.alert('Book Directly', `Call ${provider.name}: ${provider.phone}`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Call', onPress: () => Linking.openURL(`tel:${provider.phone}`) },
            ]);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // STEP 1 — Service Selection
    // ═══════════════════════════════════════════════════════════════
    const SelectionView = () => (
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: selectFade }]}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1F12" />
            <SafeAreaView style={{ flex: 1, backgroundColor: '#0D1F12' }} edges={['top']}>
                <View style={st.root}>
                    {/* ── Dark Hero Header (original design) ── */}
                    <View style={st.darkHero}>
                        <TouchableOpacity style={st.heroBackBtn} onPress={() => navigation.goBack()}>
                            <BackIconSvg width={22} height={22} stroke="#FFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                        <Text style={st.heroTag}>KISANVOICE SERVICES</Text>
                        <Text style={st.heroHeading}>What do you{'\n'}need today?</Text>
                        <Text style={st.heroHindi}>आज आपको क्या चाहिए?</Text>
                    </View>

                    {/* ── Content Below Hero ── */}
                    <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Active Booking Banner */}
                        {activeBooking && (
                            <TouchableOpacity
                                style={st.activeCard}
                                onPress={() => navigation.navigate('RequestStatus', activeBooking)}
                                activeOpacity={0.8}
                            >
                                <View style={st.activeLeft}>
                                    <View style={st.activeDotWrap}>
                                        <View style={st.activeDot} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={st.activeTitle}>Active Booking</Text>
                                        <Text style={st.activeSub}>
                                            {activeBooking.serviceType} · {activeBooking.providerName || 'Finding…'}
                                        </Text>
                                    </View>
                                </View>
                                <ChevronRightIcon width={16} height={16} color="#1B5E20" />
                            </TouchableOpacity>
                        )}

                        {/* Service Cards */}
                        {SERVICES.map((svc, idx) => (
                            <Animated.View key={svc.id} style={{ transform: [{ scale: cardScales[idx] }] }}>
                                <TouchableOpacity
                                    style={st.serviceCard}
                                    activeOpacity={0.85}
                                    onPressIn={() => Animated.spring(cardScales[idx], { toValue: 0.97, useNativeDriver: true }).start()}
                                    onPressOut={() => Animated.spring(cardScales[idx], { toValue: 1, useNativeDriver: true }).start()}
                                    onPress={() => handleSelectService(svc)}
                                >
                                    <View style={[st.svcIconWrap, { backgroundColor: svc.bg }]}>
                                        <svc.SvgIcon width={24} height={24} color={svc.color} />
                                    </View>
                                    <View style={st.svcBody}>
                                        <View style={st.svcTitleRow}>
                                            <Text style={st.svcTitle}>{svc.label}</Text>
                                            <Text style={st.svcHindi}>{svc.hindi}</Text>
                                        </View>
                                        <Text style={st.svcDesc}>{svc.desc}</Text>
                                        <Text style={st.svcDescHi}>{svc.descHindi}</Text>
                                    </View>
                                    <ChevronRightIcon width={18} height={18} color={svc.color} />
                                </TouchableOpacity>
                            </Animated.View>
                        ))}

                        {/* Pincode */}
                        <View style={st.pincodeCard}>
                            <View style={st.pincodeHeaderRow}>
                                <MapPinIcon width={14} height={14} color="#9CA3AF" />
                                <Text style={st.pincodeLabel}>SEARCH AREA</Text>
                            </View>
                            {editPincode ? (
                                <View style={st.pincodeEditRow}>
                                    <TextInput
                                        style={st.pincodeInput}
                                        value={tempPincode}
                                        onChangeText={setTempPincode}
                                        keyboardType="numeric"
                                        maxLength={6}
                                        autoFocus
                                        returnKeyType="done"
                                        onSubmitEditing={applyPincode}
                                    />
                                    <TouchableOpacity onPress={applyPincode} style={st.pincodeDoneBtn}>
                                        <CheckIcon width={16} height={16} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => { setTempPincode(pincode); setEditPincode(true); }}
                                    style={st.pincodeTapRow}
                                >
                                    <Text style={st.pincodeValue}>{pincode}</Text>
                                    <Text style={st.pincodeChange}>Change ▾</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Provider Action Buttons */}
                        <View style={st.actionRow}>
                            <TouchableOpacity
                                style={st.actionCard}
                                onPress={() => navigation.navigate('ProviderRegister')}
                                activeOpacity={0.8}
                            >
                                <View style={st.actionIconWrap}>
                                    <TractorIcon width={18} height={18} color="#FFF" />
                                </View>
                                <Text style={st.actionTitle}>Register</Text>
                                <Text style={st.actionSub}>Become a provider</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={st.actionCard}
                                onPress={() => navigation.navigate('ProviderDashboard')}
                                activeOpacity={0.8}
                            >
                                <View style={st.actionIconWrap}>
                                    <ClipboardIcon width={18} height={18} color="#FFF" />
                                </View>
                                <Text style={st.actionTitle}>My Dashboard</Text>
                                <Text style={st.actionSub}>Accept requests</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </Animated.View>
    );

    // ═══════════════════════════════════════════════════════════════
    // STEP 2 — Provider List
    // ═══════════════════════════════════════════════════════════════
    const ProviderListView = () => {
        const svc = selectedService;
        const color = svc?.color || '#1B5E20';

        return (
            <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateX: listSlide }] }]}>
                <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
                <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFBFC' }} edges={['top']}>
                    <View style={st.root}>
                        <Header title={`${svc?.label} / ${svc?.hindi}`} />

                        {/* Floating Pincode */}
                        {editPincode && (
                            <View style={st.floatingPincode}>
                                <TextInput
                                    style={st.floatingInput}
                                    value={tempPincode}
                                    onChangeText={setTempPincode}
                                    keyboardType="numeric"
                                    maxLength={6}
                                    autoFocus
                                    returnKeyType="done"
                                    onSubmitEditing={applyPincode}
                                    placeholder="Enter pincode"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity style={[st.floatingBtn, { backgroundColor: color }]} onPress={applyPincode}>
                                    <Text style={st.floatingBtnText}>Search</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Content */}
                        {loading ? (
                            <View style={st.centerWrap}>
                                <View style={[st.loadingIcon, { backgroundColor: svc?.bg }]}>
                                    {svc?.SvgIcon && <svc.SvgIcon width={28} height={28} color={svc?.color} />}
                                </View>
                                <ActivityIndicator size="large" color={color} style={{ marginTop: 16 }} />
                                <Text style={st.loadingText}>Finding {svc?.label}s near {pincode}...</Text>
                            </View>
                        ) : providers.length === 0 ? (
                            <View style={st.centerWrap}>
                                <Text style={st.emptyTitle}>No {svc?.label}s found</Text>
                                <Text style={st.emptySub}>Try a different pincode</Text>
                                <TouchableOpacity style={[st.retryBtn, { backgroundColor: color }]} onPress={() => fetchProviders()}>
                                    <Text style={st.retryText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <ScrollView
                                contentContainerStyle={st.provScroll}
                                showsVerticalScrollIndicator={false}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={() => fetchProviders(selectedService?.id, pincode, true)}
                                        colors={[color]}
                                    />
                                }
                            >
                                {/* Sub-header with pincode */}
                                <TouchableOpacity onPress={() => setEditPincode(!editPincode)} style={st.provSubHeader}>
                                    <MapPinIcon width={14} height={14} color="#9CA3AF" />
                                    <Text style={st.provSubText}>
                                        {providers.length} provider{providers.length !== 1 ? 's' : ''} near {pincode}
                                    </Text>
                                    <Text style={st.provSubChange}>Change ▾</Text>
                                </TouchableOpacity>

                                {/* Provider Cards */}
                                {providers.map((p) => {
                                    const expanded = expandedId === p.provider_id;
                                    return (
                                        <TouchableOpacity
                                            key={p.provider_id}
                                            style={[st.provCard, expanded && { borderColor: color, borderWidth: 2 }]}
                                            activeOpacity={0.88}
                                            onPress={() => setExpandedId(expanded ? null : p.provider_id)}
                                        >
                                            <View style={st.provRow}>
                                                <View style={[st.provAvatar, { backgroundColor: svc?.bg }]}>
                                                    {svc?.SvgIcon && <svc.SvgIcon width={22} height={22} color={svc?.color} />}
                                                </View>
                                                <View style={st.provMeta}>
                                                    <Text style={st.provName}>{p.name}</Text>
                                                    <View style={st.provMetaRow}>
                                                        <Text style={st.provRating}>⭐ {p.rating.toFixed(1)}</Text>
                                                        <Text style={st.provSep}>·</Text>
                                                        <Text style={st.provJobs}>{p.total_jobs} jobs</Text>
                                                        <Text style={st.provSep}>·</Text>
                                                        <View style={[st.statusDot, { backgroundColor: p.status === 'IDLE' ? '#10b981' : '#ef4444' }]} />
                                                        <Text style={st.provStatusText}>{p.status === 'IDLE' ? 'Available' : 'Busy'}</Text>
                                                    </View>
                                                </View>
                                                <View style={[st.priceBadge, { backgroundColor: color }]}>
                                                    <Text style={st.priceVal}>₹{p.price_per_hour}</Text>
                                                    <Text style={st.priceSuffix}>/hr</Text>
                                                </View>
                                            </View>

                                            {/* Chips */}
                                            <View style={st.chipRow}>
                                                <View style={st.chip}>
                                                    <MapPinIcon width={11} height={11} color="#6B7280" />
                                                    <Text style={st.chipText}>{p.pincode}</Text>
                                                </View>
                                                <View style={st.chip}>
                                                    <UserIcon width={11} height={11} color="#6B7280" />
                                                    <Text style={st.chipText}>{p.phone}</Text>
                                                </View>
                                            </View>

                                            {/* Expanded Actions */}
                                            {expanded && (
                                                <View style={st.expandedRow}>
                                                    <TouchableOpacity
                                                        style={[st.callBtn, { borderColor: color }]}
                                                        onPress={() => Linking.openURL(`tel:${p.phone}`)}
                                                    >
                                                        <Text style={[st.callBtnText, { color }]}>Call</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[st.bookBtn, { backgroundColor: color }]}
                                                        onPress={() => handleBook(p)}
                                                        disabled={booking}
                                                    >
                                                        {booking
                                                            ? <ActivityIndicator color="#FFF" />
                                                            : <Text style={st.bookBtnText}>Book Now</Text>}
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </SafeAreaView>
            </Animated.View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FAFBFC' }}>
            <SelectionView />
            {step === 'list' && <ProviderListView />}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FAFBFC' },

    // ── Dark Hero Header (keep original) ──
    darkHero: {
        backgroundColor: '#0D1F12',
        paddingTop: 10,
        paddingBottom: 28,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    heroBackBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    heroTag: {
        fontSize: 11,
        color: '#86EFAC',
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    heroHeading: {
        fontSize: 30,
        fontWeight: '900',
        color: '#FFF',
        lineHeight: 36,
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    heroHindi: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.45)',
        fontWeight: '500',
    },

    // ── Scroll Content ──
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },

    // ── Active Booking ──
    activeCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    activeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    activeDotWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#1B5E20',
    },
    activeTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1B5E20',
    },
    activeSub: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        marginTop: 1,
    },

    // ── Service Cards ──
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    svcIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    svcBody: { flex: 1 },
    svcTitleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
        marginBottom: 3,
    },
    svcTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    svcHindi: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    svcDesc: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '600',
    },
    svcDescHi: {
        fontSize: 11,
        color: '#D1D5DB',
        marginTop: 1,
        fontWeight: '500',
    },

    // ── Pincode ──
    pincodeCard: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        marginTop: 4,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    pincodeHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    pincodeLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 0.5,
    },
    pincodeEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pincodeInput: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    pincodeDoneBtn: {
        marginLeft: 10,
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#1B5E20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pincodeTapRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pincodeValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    pincodeChange: {
        fontSize: 13,
        color: '#1B5E20',
        fontWeight: '700',
    },

    // ── Provider Action Cards ──
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#0D1F12',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
    },
    actionIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(134,239,172,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFF',
    },
    actionSub: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
        marginTop: 2,
    },

    // ═══════════════════════════════════════════
    // PROVIDER LIST (Step 2)
    // ═══════════════════════════════════════════
    floatingPincode: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 4,
        marginBottom: 8,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 6,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    floatingInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        paddingHorizontal: 10,
    },
    floatingBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    floatingBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 13,
    },

    centerWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loadingIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '600',
        textAlign: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 6,
    },
    emptySub: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
    },
    retryBtn: {
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },

    provScroll: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    provSubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
    },
    provSubText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    provSubChange: {
        fontSize: 12,
        color: '#1B5E20',
        fontWeight: '700',
    },

    // Provider Card
    provCard: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    provRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
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
        marginBottom: 3,
    },
    provMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    provRating: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
    },
    provSep: {
        color: '#D1D5DB',
        marginHorizontal: 5,
        fontSize: 12,
    },
    provJobs: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    provStatusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#374151',
    },
    priceBadge: {
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignItems: 'center',
    },
    priceVal: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FFF',
    },
    priceSuffix: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },

    chipRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    chipText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },

    expandedRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    callBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    bookBtn: {
        flex: 2,
        paddingVertical: 13,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFF',
    },
});

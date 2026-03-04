import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, StatusBar, ActivityIndicator, Alert, Animated, Linking, RefreshControl,
} from 'react-native';
import farmServicesApi from '../services/farmServicesApi';
import api from '../services/api';
import Header from '../components/Header';
import CheckIcon from '../../assets/svg/CheckIcon';
import ClipboardIcon from '../../assets/svg/ClipboardIcon';
import ChevronRightIcon from '../../assets/svg/ChevronRightIcon';
import UserIcon from '../../assets/svg/UserIcon';
import MapPinIcon from '../../assets/svg/MapPinIcon';

const STATUS_COLORS = { MATCHED: '#10b981', COMPLETED: '#6B7280', PENDING: '#f59e0b', NOTIFYING: '#3b82f6' };
const STATUS_LABELS = { MATCHED: 'Ongoing', COMPLETED: 'Done', PENDING: 'Pending', NOTIFYING: 'Notifying' };

export default function ProviderDashboardScreen({ navigation }) {
    const [profile, setProfile] = useState(null);
    const [providerId, setProviderId] = useState('');
    const [editProviderId, setEditProviderId] = useState(false);
    const [jobs, setJobs] = useState({ ongoing: [], completed: [], summary: {} });
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [jobsError, setJobsError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [requestId, setRequestId] = useState('');
    const [accepting, setAccepting] = useState(false);
    const [testAccepting, setTestAccepting] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [tab, setTab] = useState('ongoing');

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadProviderProfile();
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, []);

    useEffect(() => {
        if (providerId) fetchJobs();
    }, [providerId]);

    const loadProviderProfile = async () => {
        try {
            const ud = await api.getUserData();
            if (ud) {
                setProfile(ud);
                const id = await farmServicesApi.getStoredProviderId(ud.phone || '');
                setProviderId(id);
            }
        } catch (e) { }
        setLoadingProfile(false);
    };

    const fetchJobs = async (id, isRefresh = false) => {
        const target = id || providerId;
        if (!target) return;
        setJobsError(null);
        if (isRefresh) setRefreshing(true); else setLoadingJobs(true);
        const result = await farmServicesApi.getProviderJobs(target);
        if (isRefresh) setRefreshing(false); else setLoadingJobs(false);
        if (result.success) {
            setJobs({
                ongoing: result.data.ongoing || [],
                completed: result.data.completed || [],
                summary: result.data.summary || {},
            });
        } else {
            setJobsError(`Could not load jobs: ${result.error || 'Network error'}\nProvider ID: ${target}`);
        }
    };

    useEffect(() => {
        if (providerId) fetchJobs(providerId);
    }, [providerId]);

    const handleAccept = async () => {
        const trimmed = requestId.trim();
        if (!trimmed) {
            Alert.alert('Enter Request ID', 'Paste the full UUID from your SMS or from the farmer.\n\nExample: a6706841-c5e1-4fb9-b973-4a606a24986e');
            return;
        }
        setAccepting(true);
        try {
            const result = await farmServicesApi.acceptRequest(trimmed, providerId);
            setAccepting(false);
            if (result.success) {
                setRequestId('');
                Alert.alert('Accepted!', 'Job accepted! Farmer has been notified.');
                fetchJobs(providerId);
            } else if (result.alreadyTaken) {
                Alert.alert('Already Taken', 'Another provider was faster.');
            } else {
                Alert.alert('Failed', `${result.error}\n\nCheck:\n• Full UUID entered?\n• Provider ID correct?\n• Request still PENDING/NOTIFYING?`,
                    [{ text: 'OK' }, { text: 'Edit Provider ID', onPress: () => setEditProviderId(true) }]);
            }
        } catch (e) {
            setAccepting(false);
            Alert.alert('Network Error', e.message);
        }
    };

    const handleTestAccept = async () => {
        if (!profile?.phone) { Alert.alert('No phone number in profile'); return; }
        Alert.alert(
            'Test Accept',
            'This will auto-accept the latest NOTIFYING request for your service type without needing SMS.\n\nUseful for testing/demo.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept Latest Request',
                    onPress: async () => {
                        setTestAccepting(true);
                        const result = await farmServicesApi.testAccept(profile.phone);
                        setTestAccepting(false);
                        if (result.success) {
                            Alert.alert('Test Accept Success!', `Accepted request!\nFarmer: ${result.data?.farmer?.name || '—'}\nRequest ID: ${result.data?.request_id?.slice(0, 8).toUpperCase()}`);
                            fetchJobs(providerId);
                        } else if (result.noRequests) {
                            Alert.alert('No Requests', 'No NOTIFYING requests found for your service type right now.');
                        } else if (result.alreadyTaken) {
                            Alert.alert('Already Taken', 'The latest request was already accepted.');
                        } else {
                            Alert.alert('Error', result.error || 'Test accept failed');
                        }
                    }
                }
            ]
        );
    };

    if (loadingProfile) {
        return <View style={s.centerFull}><ActivityIndicator size="large" color="#1B5E20" /></View>;
    }

    const displayJobs = tab === 'ongoing' ? jobs.ongoing : jobs.completed;

    return (
        <Animated.View style={[s.root, { opacity: fadeAnim }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
            <Header title="Provider Dashboard" />

            <ScrollView
                contentContainerStyle={s.body}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchJobs(providerId, true)} colors={['#1B5E20']} />}
            >
                {/* ── Profile Card ── */}
                <View style={s.card}>
                    <View style={s.profileRow}>
                        <View style={s.avatar}>
                            <Text style={s.avatarText}>{profile?.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
                        </View>
                        <View style={s.profileMeta}>
                            <Text style={s.profileName}>{profile?.name || 'Provider'}</Text>
                            <Text style={s.profilePhone}>{profile?.phone || '—'}</Text>
                        </View>
                        <View style={[s.statusPill, { backgroundColor: jobs.ongoing.length > 0 ? '#FEE2E2' : '#D1FAE5' }]}>
                            <View style={[s.statusDot, { backgroundColor: jobs.ongoing.length > 0 ? '#ef4444' : '#10b981' }]} />
                            <Text style={[s.statusPillText, { color: jobs.ongoing.length > 0 ? '#991b1b' : '#065f46' }]}>
                                {jobs.ongoing.length > 0 ? 'On Job' : 'Available'}
                            </Text>
                        </View>
                    </View>

                    {/* Provider ID */}
                    <View style={s.provIdSection}>
                        <View style={s.provIdLabelRow}>
                            <Text style={s.provIdLabel}>YOUR PROVIDER ID</Text>
                            <TouchableOpacity onPress={() => setEditProviderId(!editProviderId)}>
                                <Text style={s.editLink}>{editProviderId ? 'Done' : 'Edit'}</Text>
                            </TouchableOpacity>
                        </View>
                        {editProviderId ? (
                            <TextInput
                                style={s.provIdInput}
                                value={providerId}
                                onChangeText={setProviderId}
                                placeholder="PRV_9910890180"
                                autoCapitalize="none"
                                returnKeyType="done"
                                onSubmitEditing={() => { setEditProviderId(false); fetchJobs(providerId); }}
                            />
                        ) : (
                            <View style={s.provIdBadge}>
                                <Text style={s.provIdText}>{providerId || '— Tap Edit to set —'}</Text>
                            </View>
                        )}
                    </View>

                    {/* Stats */}
                    <View style={s.statsRow}>
                        <StatBox label="Ongoing" value={jobs.summary.ongoing ?? '—'} />
                        <View style={s.statDivider} />
                        <StatBox label="Completed" value={jobs.summary.completed ?? '—'} />
                        <View style={s.statDivider} />
                        <StatBox label="Total" value={jobs.summary.total ?? '—'} />
                    </View>
                </View>

                {/* ── Accept Card ── */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Accept a Request</Text>

                    <TouchableOpacity
                        style={s.testAcceptBtn}
                        onPress={handleTestAccept}
                        disabled={testAccepting}
                        activeOpacity={0.8}
                    >
                        {testAccepting
                            ? <ActivityIndicator color="#FFF" />
                            : (
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={s.testAcceptText}>Auto-Accept Latest Request</Text>
                                    <Text style={s.testAcceptSub}>No SMS needed — for testing/demo</Text>
                                </View>
                            )}
                    </TouchableOpacity>

                    <View style={s.orDivider}>
                        <View style={s.dividerLine} />
                        <Text style={s.orText}>OR enter request ID manually</Text>
                        <View style={s.dividerLine} />
                    </View>

                    <Text style={s.inputLabel}>Full Request UUID from SMS</Text>
                    <TextInput
                        style={s.requestInput}
                        value={requestId}
                        onChangeText={setRequestId}
                        placeholder="a6706841-c5e1-4fb9-b973-..."
                        placeholderTextColor="#D1D5DB"
                        autoCapitalize="none"
                    />
                    <Text style={s.inputHint}>Paste the FULL UUID — not just the 8-char prefix</Text>

                    <TouchableOpacity
                        style={s.acceptBtn}
                        onPress={handleAccept}
                        disabled={accepting}
                        activeOpacity={0.8}
                    >
                        {accepting
                            ? <ActivityIndicator color="#FFF" />
                            : <Text style={s.acceptBtnText}>Accept by Request ID</Text>}
                    </TouchableOpacity>
                </View>

                {/* ── Jobs Tabs ── */}
                {jobsError && (
                    <TouchableOpacity style={s.errorBanner} onPress={() => fetchJobs(providerId)}>
                        <Text style={s.errorText}>{jobsError}</Text>
                        <Text style={s.errorRetry}>Tap to retry</Text>
                    </TouchableOpacity>
                )}

                <View style={s.tabsRow}>
                    <TouchableOpacity
                        style={[s.tabBtn, tab === 'ongoing' && s.tabBtnActive]}
                        onPress={() => setTab('ongoing')}
                    >
                        <Text style={[s.tabText, tab === 'ongoing' && s.tabTextActive]}>
                            Ongoing ({jobs.ongoing.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.tabBtn, tab === 'completed' && s.tabBtnActive]}
                        onPress={() => setTab('completed')}
                    >
                        <Text style={[s.tabText, tab === 'completed' && s.tabTextActive]}>
                            Completed ({jobs.completed.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {loadingJobs ? (
                    <ActivityIndicator color="#1B5E20" style={{ marginTop: 20 }} />
                ) : displayJobs.length === 0 ? (
                    <View style={s.emptyJobs}>
                        <Text style={s.emptyJobsText}>
                            {tab === 'ongoing' ? 'No ongoing jobs' : 'No completed jobs yet'}
                        </Text>
                    </View>
                ) : displayJobs.map((job) => (
                    <JobCard key={job.request_id} job={job} onCallFarmer={() => Linking.openURL(`tel:${job.farmer_id}`)} />
                ))}

                {/* ── Tips ── */}
                <View style={s.tipsCard}>
                    <Text style={s.tipsTitle}>Tips</Text>
                    {[
                        'Tap "Auto-Accept" to grab the latest request instantly',
                        'Pull down to refresh your job list',
                        'Tap Edit to correct your Provider ID if needed',
                        'Higher ratings = more requests',
                    ].map((tip, i) => (
                        <View key={i} style={s.tipRow}>
                            <Text style={s.tipBullet}>•</Text>
                            <Text style={s.tipText}>{tip}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </Animated.View>
    );
}

const StatBox = ({ label, value }) => (
    <View style={s.statBox}>
        <Text style={s.statValue}>{String(value)}</Text>
        <Text style={s.statLabel}>{label}</Text>
    </View>
);

const JobCard = ({ job, onCallFarmer }) => {
    const statusColor = STATUS_COLORS[job.status] || '#6B7280';
    return (
        <View style={s.jobCard}>
            <View style={s.jobTop}>
                <View style={{ flex: 1 }}>
                    <Text style={s.jobFarmer}>{job.farmer_name || job.farmer_id}</Text>
                    <Text style={s.jobSvc}>{job.service_type} · {job.farmer_pincode}</Text>
                    <Text style={s.jobId}>ID: {job.request_id?.slice(0, 8).toUpperCase()}</Text>
                </View>
                <View>
                    <View style={[s.jobStatusBadge, { backgroundColor: statusColor + '18' }]}>
                        <Text style={[s.jobStatusText, { color: statusColor }]}>{STATUS_LABELS[job.status] || job.status}</Text>
                    </View>
                    <Text style={s.jobPrice}>₹{job.estimated_price}/hr</Text>
                </View>
            </View>
            {job.status === 'MATCHED' && (
                <TouchableOpacity style={s.callFarmerBtn} onPress={onCallFarmer} activeOpacity={0.8}>
                    <Text style={s.callFarmerText}>Call Farmer</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FAFBFC' },
    centerFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFBFC' },
    body: { paddingHorizontal: 20, paddingBottom: 20 },

    // Card
    card: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 14,
    },

    // Profile
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1B5E20',
    },
    profileMeta: { flex: 1 },
    profileName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    profilePhone: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
        marginTop: 2,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '800',
    },

    // Provider ID
    provIdSection: { marginBottom: 16 },
    provIdLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    provIdLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 0.5,
    },
    editLink: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B5E20',
    },
    provIdBadge: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    provIdText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#111827',
        fontFamily: 'monospace',
    },
    provIdInput: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#1B5E20',
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '900', color: '#111827' },
    statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: '#F3F4F6' },

    // Accept
    testAcceptBtn: {
        backgroundColor: '#0D1F12',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginBottom: 14,
    },
    testAcceptText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
    testAcceptSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
    orDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#F3F4F6' },
    orText: { fontSize: 11, color: '#D1D5DB', fontWeight: '600' },
    inputLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6 },
    requestInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 6,
    },
    inputHint: { fontSize: 11, color: '#ef4444', fontWeight: '600', marginBottom: 14 },
    acceptBtn: {
        backgroundColor: '#1B5E20',
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
    },
    acceptBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

    // Tabs
    tabsRow: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 3,
        marginBottom: 12,
    },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: '#FFF' },
    tabText: { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
    tabTextActive: { color: '#111827' },

    emptyJobs: { alignItems: 'center', paddingVertical: 28 },
    emptyJobsText: { fontSize: 13, color: '#D1D5DB', fontWeight: '600' },

    // Job Card
    jobCard: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    jobTop: { flexDirection: 'row', alignItems: 'flex-start' },
    jobFarmer: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 3 },
    jobSvc: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    jobId: { fontSize: 11, color: '#D1D5DB', marginTop: 2 },
    jobStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4, alignSelf: 'flex-end' },
    jobStatusText: { fontSize: 11, fontWeight: '800' },
    jobPrice: { fontSize: 14, fontWeight: '800', color: '#1B5E20', textAlign: 'right' },
    callFarmerBtn: {
        marginTop: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#10b981',
        alignItems: 'center',
    },
    callFarmerText: { fontSize: 13, fontWeight: '700', color: '#10b981' },

    // Tips
    tipsCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 14,
        padding: 14,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    tipsTitle: { fontSize: 13, fontWeight: '800', color: '#1B5E20', marginBottom: 10 },
    tipRow: { flexDirection: 'row', gap: 8, marginBottom: 5 },
    tipBullet: { color: '#1B5E20', fontWeight: '900', marginTop: 1 },
    tipText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },

    // Error
    errorBanner: {
        backgroundColor: '#FEF2F2',
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: { fontSize: 12, fontWeight: '600', color: '#991b1b' },
    errorRetry: { fontSize: 11, color: '#ef4444', fontWeight: '700', marginTop: 4 },
});

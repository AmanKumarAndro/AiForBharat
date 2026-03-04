import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Animated, Linking, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import farmServicesApi from '../services/farmServicesApi';
import LeafIcon from '../../assets/svg/LeafIcon';
import TractorIcon from '../../assets/svg/TractorIcon';
import ToolIcon from '../../assets/svg/ToolIcon';
import ClipboardIcon from '../../assets/svg/ClipboardIcon';
import CheckIcon from '../../assets/svg/CheckIcon';
import MapPinIcon from '../../assets/svg/MapPinIcon';
import ChevronRightIcon from '../../assets/svg/ChevronRightIcon';

const STATUS_META = {
  PENDING: { label: 'Pending', color: '#f59e0b', bg: '#FEF3C7' },
  NOTIFYING: { label: 'Notifying Providers', color: '#3b82f6', bg: '#DBEAFE' },
  MATCHED: { label: 'Provider Matched', color: '#10b981', bg: '#D1FAE5' },
  COMPLETED: { label: 'Completed', color: '#6B7280', bg: '#F3F4F6' },
  NO_PROVIDERS_FOUND: { label: 'No Providers Found', color: '#ef4444', bg: '#FEE2E2' },
};

const SVC_LABELS = { TRACTOR: 'Tractor', LABOUR: 'Labour', TRANSPORT: 'Transport' };

export default function MyFarmScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState('farmer'); // 'farmer' | 'provider'
  const [farmerJobs, setFarmerJobs] = useState({ ongoing: [], completed: [], pending: [], summary: {} });
  const [provJobs, setProvJobs] = useState({ ongoing: [], completed: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setApiError(null);

    const ud = await api.getUserData();
    setUserData(ud);

    const phone = ud?.phone || '';
    const provId = farmServicesApi.toProviderId(phone);

    if (!phone) {
      setApiError('Could not find your phone number. Please log in again.');
      setLoading(false);
      return;
    }

    // Fetch both in parallel
    const [farmerResult, provResult] = await Promise.all([
      farmServicesApi.getFarmerRequests(phone),
      provId ? farmServicesApi.getProviderJobs(provId) : Promise.resolve({ success: false }),
    ]);

    if (farmerResult.success) {
      const d = farmerResult.data;
      setFarmerJobs({
        ongoing: d.ongoing || [],
        completed: d.completed || [],
        pending: d.pending || [],
        summary: d.summary || {},
      });
    } else {
      setApiError(`Could not load your requests: ${farmerResult.error || 'Network error'}`);
    }

    // Determine role from provider API
    const isKnownProvider = provResult.success && provResult.data?.provider_name;
    if (isKnownProvider) {
      setRole('provider');
      const d = provResult.data;
      setProvJobs({
        ongoing: d.ongoing || [],
        completed: d.completed || [],
        summary: d.summary || {},
        name: d.provider_name,
        rating: d.rating,
        totalJobs: d.total_jobs,
        status: d.provider_status,
      });
    }
    // else role stays 'farmer'

    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    if (isRefresh) setRefreshing(false); else setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centerFull}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text style={styles.loadingText}>Loading your jobs…</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: '#FAFBFC' }, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={['#1B5E20']}
            tintColor="#1B5E20"
          />
        }
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>मेरा खेत</Text>
          <Text style={styles.pageSubtitle}>My Farm Dashboard</Text>
        </View>

        {/* API error banner */}
        {apiError && (
          <TouchableOpacity style={styles.errorBanner} onPress={() => loadData()}>
            <Text style={styles.errorBannerText}>{apiError}</Text>
            <Text style={styles.errorBannerRetry}>Tap to retry</Text>
          </TouchableOpacity>
        )}

        {/* Role toggle — lets user switch between both views */}
        <View style={styles.roleToggle}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'farmer' && styles.roleBtnActive]}
            onPress={() => setRole('farmer')}
          >
            <LeafIcon width={16} height={16} color={role === 'farmer' ? '#1B5E20' : '#9CA3AF'} />
            <Text style={[styles.roleBtnText, role === 'farmer' && styles.roleBtnTextActive]}>Farmer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'provider' && styles.roleBtnActive]}
            onPress={() => setRole('provider')}
          >
            <TractorIcon width={16} height={16} color={role === 'provider' ? '#1B5E20' : '#9CA3AF'} />
            <Text style={[styles.roleBtnText, role === 'provider' && styles.roleBtnTextActive]}>Provider</Text>
          </TouchableOpacity>
        </View>

        {role === 'farmer'
          ? <FarmerView jobs={farmerJobs} navigation={navigation} />
          : <ProviderView jobs={provJobs} navigation={navigation} profile={userData} />}

        <View style={{ height: 32 }} />
      </ScrollView>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────
// FARMER VIEW
// ─────────────────────────────────────────────────────────
function FarmerView({ jobs, navigation }) {
  const hasSomething = jobs.ongoing.length > 0 || jobs.completed.length > 0 || jobs.pending.length > 0;
  const [tab, setTab] = useState('ongoing');

  const displayList = tab === 'ongoing' ? jobs.ongoing
    : tab === 'completed' ? jobs.completed
      : jobs.pending;

  return (
    <>
      {/* Summary */}
      <View style={styles.summaryRow}>
        <SummaryBox label="Ongoing" value={jobs.summary.ongoing ?? jobs.ongoing.length} color="#10b981" />
        <SummaryBox label="Completed" value={jobs.summary.completed ?? jobs.completed.length} color="#6B7280" />
        <SummaryBox label="Pending" value={jobs.summary.pending ?? jobs.pending.length} color="#f59e0b" />
      </View>

      {/* Quick action */}
      <TouchableOpacity
        style={styles.quickActionBtn}
        onPress={() => navigation.navigate('Services')}
      >
        <View style={styles.quickActionIconWrap}>
          <ToolIcon width={20} height={20} color="#1B5E20" />
        </View>
        <View>
          <Text style={styles.quickActionTitle}>Book a Service</Text>
          <Text style={styles.quickActionSub}>Tractor, Labour, Transport</Text>
        </View>
        <ChevronRightIcon width={18} height={18} color="#1B5E20" />
      </TouchableOpacity>

      {/* Tabs */}
      {hasSomething && (
        <>
          <View style={styles.tabsRow}>
            {['ongoing', 'completed', 'pending'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {displayList.length === 0 ? (
            <EmptyState text={`No ${tab} requests`} />
          ) : displayList.map((req) => (
            <FarmerRequestCard
              key={req.request_id}
              req={req}
              onView={() => navigation.navigate('RequestStatus', {
                requestId: req.request_id,
                serviceType: req.service_type,
                providerName: req.matched_provider_id || '',
              })}
            />
          ))}
        </>
      )}

      {!hasSomething && (
        <EmptyState
          text="No service requests yet"
          sub="Book a tractor, labour, or transport service to see them here"
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// PROVIDER VIEW
// ─────────────────────────────────────────────────────────
function ProviderView({ jobs, navigation, profile }) {
  const [tab, setTab] = useState('ongoing');
  const displayList = tab === 'ongoing' ? jobs.ongoing : jobs.completed;

  return (
    <>
      {/* Provider profile mini-card */}
      {jobs.name && (
        <View style={styles.provMiniCard}>
          <View style={styles.provMiniAvatar}>
            <Text style={styles.provMiniAvatarText}>{jobs.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.provMiniName}>{jobs.name}</Text>
            <View style={styles.provMiniRow}>
              <Text style={styles.provMiniRating}>⭐ {jobs.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.provMiniSep}>·</Text>
              <Text style={styles.provMiniJobs}>{jobs.totalJobs || 0} jobs</Text>
            </View>
          </View>
          <View style={[styles.provStatusPill, { backgroundColor: jobs.ongoing.length > 0 ? '#ef4444' : '#10b981' }]}>
            <Text style={styles.provStatusText}>{jobs.ongoing.length > 0 ? 'On Job' : 'Available'}</Text>
          </View>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summaryRow}>
        <SummaryBox label="Ongoing" value={jobs.summary.ongoing ?? jobs.ongoing.length} color="#10b981" />
        <SummaryBox label="Completed" value={jobs.summary.completed ?? jobs.completed.length} color="#6B7280" />
        <SummaryBox label="Total" value={jobs.summary.total ?? (jobs.ongoing.length + jobs.completed.length)} color="#3b82f6" />
      </View>

      {/* Quick Action */}
      <TouchableOpacity
        style={[styles.quickActionBtn, { backgroundColor: '#0D1F12' }]}
        onPress={() => navigation.navigate('ProviderDashboard')}
      >
        <View style={styles.quickActionIconWrap}>
          <ToolIcon width={20} height={20} color="#86EFAC" />
        </View>
        <View>
          <Text style={[styles.quickActionTitle, { color: '#FFF' }]}>Accept New Request</Text>
          <Text style={[styles.quickActionSub, { color: 'rgba(255,255,255,0.55)' }]}>Open Provider Dashboard</Text>
        </View>
        <ChevronRightIcon width={18} height={18} color="#86EFAC" />
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {['ongoing', 'completed'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'ongoing' ? `Ongoing (${jobs.ongoing.length})` : `Completed (${jobs.completed.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {displayList.length === 0 ? (
        <EmptyState
          text={tab === 'ongoing' ? 'No ongoing jobs' : 'No completed jobs yet'}
        />
      ) : displayList.map((job) => (
        <ProviderJobCard key={job.request_id} job={job} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────
function FarmerRequestCard({ req, onView }) {
  const meta = STATUS_META[req.status] || STATUS_META.PENDING;
  const hasProvider = req.status === 'MATCHED' && req.matched_provider_id;

  return (
    <TouchableOpacity style={styles.reqCard} onPress={onView} activeOpacity={0.88}>
      <View style={styles.reqCardTop}>
        <View style={styles.reqIconWrap}>
          <TractorIcon width={20} height={20} color="#1B5E20" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reqSvcType}>{req.service_type}</Text>
          <Text style={styles.reqMeta}>{req.farmer_pincode} · ₹{req.estimated_price}/hr</Text>
          <Text style={styles.reqId}>ID: {req.request_id?.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={[styles.reqStatusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.reqStatusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      {hasProvider && (
        <View style={styles.providerMatchedRow}>
          <Text style={styles.providerMatchedText}>Provider assigned</Text>
          <Text style={styles.viewDetailsCta}>View Details →</Text>
        </View>
      )}
      {req.status === 'MATCHED' && (
        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>Tap to view provider details & rate service</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ProviderJobCard({ job }) {
  const meta = STATUS_META[job.status] || STATUS_META.MATCHED;
  return (
    <View style={styles.reqCard}>
      <View style={styles.reqCardTop}>
        <View style={styles.reqIconWrap}>
          <TractorIcon width={20} height={20} color="#1B5E20" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reqSvcType}>{job.farmer_name || job.farmer_id}</Text>
          <Text style={styles.reqMeta}>{job.service_type} · {job.farmer_pincode}</Text>
          <Text style={styles.reqMeta}>₹{job.estimated_price}/hr · {new Date(job.created_at).toLocaleDateString('en-IN')}</Text>
          <Text style={styles.reqId}>ID: {job.request_id?.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={[styles.reqStatusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.reqStatusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      {job.status === 'MATCHED' && (
        <TouchableOpacity
          style={styles.callFarmerBtn}
          onPress={() => Linking.openURL(`tel:${job.farmer_id}`)}
        >
          <Text style={styles.callFarmerText}>Call Farmer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const SummaryBox = ({ label, value, color }) => (
  <View style={[styles.summaryBox, { borderTopColor: color, borderTopWidth: 3 }]}>
    <Text style={[styles.summaryValue, { color }]}>{String(value ?? '0')}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const EmptyState = ({ text, sub }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyText}>{text}</Text>
    {sub && <Text style={styles.emptySub}>{sub}</Text>}
  </View>
);

const styles = StyleSheet.create({
  centerFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFBFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280', fontWeight: '500' },
  body: { padding: 20, paddingTop: 60 },

  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#0D1F12' },
  pageSubtitle: { fontSize: 14, color: '#6B7280', fontWeight: '500', marginTop: 2 },

  // Role toggle
  roleToggle: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 16, padding: 4, marginBottom: 20, gap: 4 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 13, gap: 6 },
  roleBtnActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  roleIcon: { fontSize: 18 },
  roleBtnText: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
  roleBtnTextActive: { color: '#0D1F12' },

  // Summary row
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  summaryIcon: { fontSize: 18, marginBottom: 6 },
  summaryValue: { fontSize: 20, fontWeight: '900' },
  summaryLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

  // Quick action
  quickActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  quickActionIconWrap: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  reqIconWrap: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  quickActionTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  quickActionSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  quickActionArrow: { fontSize: 20, fontWeight: '700', color: '#1B5E20', marginLeft: 'auto' },

  // Tabs
  tabsRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 14, padding: 4, marginBottom: 14, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  tabTextActive: { color: '#111827' },

  // Request / Job cards
  reqCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  reqCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reqEmoji: { fontSize: 26, marginTop: 2 },
  reqSvcType: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 3 },
  reqMeta: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginBottom: 1 },
  reqId: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  reqStatusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  reqStatusText: { fontSize: 11, fontWeight: '800' },
  providerMatchedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  providerMatchedText: { fontSize: 13, color: '#10b981', fontWeight: '700' },
  viewDetailsCta: { fontSize: 13, color: '#1B5E20', fontWeight: '800' },
  tapHint: { marginTop: 8 },
  tapHintText: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic' },
  callFarmerBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: '#10b981', alignItems: 'center' },
  callFarmerText: { fontSize: 14, fontWeight: '700', color: '#10b981' },

  // Provider mini card
  provMiniCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginBottom: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  provMiniAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
  provMiniAvatarText: { fontSize: 22, fontWeight: '900', color: '#1B5E20' },
  provMiniName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  provMiniRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  provMiniRating: { fontSize: 12, fontWeight: '700', color: '#374151' },
  provMiniSep: { color: '#D1D5DB', marginHorizontal: 5 },
  provMiniJobs: { fontSize: 12, color: '#6B7280' },
  provStatusPill: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  provStatusText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 36 },
  emptyEmoji: { fontSize: 48, marginBottom: 10 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  // Error banner
  errorBanner: { backgroundColor: '#FEE2E2', borderRadius: 14, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  errorBannerText: { fontSize: 13, fontWeight: '600', color: '#991b1b' },
  errorBannerRetry: { fontSize: 12, color: '#ef4444', fontWeight: '700', marginTop: 4 },
});

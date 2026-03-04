import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, StatusBar, ActivityIndicator, Animated,
    Alert, FlatList, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api';

const API_BASE = 'https://4uaevdp24a.execute-api.us-east-1.amazonaws.com/Prod';

const POPULAR_COMMODITIES = ['Onion', 'Tomato', 'Potato', 'Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize'];
const STATES = ['Maharashtra', 'Karnataka', 'Uttar Pradesh', 'West Bengal', 'Punjab', 'Gujarat', 'Rajasthan', 'Tamil Nadu', 'Andhra Pradesh', 'Madhya Pradesh'];

async function fetchMarket(body) {
    const resp = await fetch(`${API_BASE}/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, action: 'fetch' }),
    });
    return resp.json();
}

async function analyzeMarket(body) {
    const resp = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, action: 'analyze' }),
    });
    return resp.json();
}

export default function MarketScreen() {
    const navigation = useNavigation();
    const [tab, setTab] = useState('prices'); // 'prices' | 'analyze'

    // Filters
    const [state, setState] = useState('');
    const [district, setDistrict] = useState('');
    const [commodity, setCommodity] = useState('');
    const [limit, setLimit] = useState('10');

    // Data
    const [records, setRecords] = useState([]);
    const [meta, setMeta] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [analysisMeta, setAnalysisMeta] = useState(null);

    // UI state
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [hasFetched, setHasFetched] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;

    const buildBody = () => {
        const body = { limit: parseInt(limit, 10) || 10 };
        if (state.trim()) body.state = state.trim();
        if (district.trim()) body.district = district.trim();
        if (commodity.trim()) body.commodity = commodity.trim();
        return body;
    };

    const handleFetch = async (isRefresh = false) => {
        setError(null);
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await fetchMarket(buildBody());
            if (res.success) {
                setRecords(res.data.records || []);
                setMeta({ total: res.data.total, count: res.data.count });
                setHasFetched(true);
            } else {
                setError(res.error || 'Failed to fetch prices');
            }
        } catch (e) {
            setError('Network error: ' + e.message);
        }
        if (isRefresh) setRefreshing(false); else setLoading(false);
    };

    const handleAnalyze = async () => {
        setError(null);
        setAnalysis(null);
        setAnalysisMeta(null);
        setLoading(true);
        try {
            const body = buildBody();
            body.limit = parseInt(limit, 10) || 50;
            const res = await analyzeMarket(body);
            if (res.success) {
                setAnalysis(res.data.analysis);
                setAnalysisMeta(res.data.metadata);
                setHasFetched(true);
            } else {
                setError(res.error || 'AI analysis failed');
            }
        } catch (e) {
            setError('Network error: ' + e.message);
        }
        setLoading(false);
    };

    const onAction = () => tab === 'prices' ? handleFetch() : handleAnalyze();

    const clear = () => {
        setState(''); setDistrict(''); setCommodity(''); setLimit('10');
        setRecords([]); setMeta(null); setAnalysis(null); setAnalysisMeta(null);
        setHasFetched(false); setError(null);
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle="light-content" backgroundColor="#14532d" />
            <View style={styles.root}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Mandi Prices</Text>
                        <Text style={styles.headerSub}>Live market data · AI analysis</Text>
                    </View>
                </View>

                {/* Tab switcher */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tabBtn, tab === 'prices' && styles.tabActive]}
                        onPress={() => setTab('prices')}
                    >
                        <Text style={[styles.tabText, tab === 'prices' && styles.tabTextActive]}>Prices</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, tab === 'analyze' && styles.tabActive]}
                        onPress={() => setTab('analyze')}
                    >
                        <Text style={[styles.tabText, tab === 'analyze' && styles.tabTextActive]}>AI Analysis</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.body}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        tab === 'prices'
                            ? <RefreshControl refreshing={refreshing} onRefresh={() => handleFetch(true)} colors={['#16a34a']} />
                            : undefined
                    }
                >
                    {/* Filters */}
                    <View style={styles.filterCard}>
                        <Text style={styles.filterTitle}>Filter Data</Text>

                        <View style={styles.filterRow}>
                            <FilterInput
                                label="State"
                                placeholder="Maharashtra"
                                value={state}
                                onChange={setState}
                                flex={1.3}
                            />
                            <FilterInput
                                label="District"
                                placeholder="Pune (optional)"
                                value={district}
                                onChange={setDistrict}
                                flex={1}
                            />
                        </View>

                        <View style={styles.filterRow}>
                            <FilterInput
                                label="Commodity"
                                placeholder="Onion, Tomato…"
                                value={commodity}
                                onChange={setCommodity}
                                flex={1.3}
                            />
                            <FilterInput
                                label="Limit"
                                placeholder={tab === 'analyze' ? '50' : '10'}
                                value={limit}
                                onChange={setLimit}
                                keyboardType="number-pad"
                                flex={0.55}
                            />
                        </View>

                        {/* Quick commodity chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                            {POPULAR_COMMODITIES.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.chip, commodity === c && styles.chipActive]}
                                    onPress={() => setCommodity(commodity === c ? '' : c)}
                                >
                                    <Text style={[styles.chipText, commodity === c && styles.chipTextActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Quick state chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                            {STATES.map(s => (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.chip, state === s && styles.chipActive]}
                                    onPress={() => setState(state === s ? '' : s)}
                                >
                                    <Text style={[styles.chipText, state === s && styles.chipTextActive]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Action buttons */}
                        <View style={styles.actionRow}>
                            {hasFetched && (
                                <TouchableOpacity style={styles.clearBtn} onPress={clear}>
                                    <Text style={styles.clearBtnText}>✕ Clear</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.fetchBtn, loading && { opacity: 0.7 }]}
                                onPress={onAction}
                                disabled={loading}
                            >
                                {loading
                                    ? <ActivityIndicator color="#FFF" />
                                    : <Text style={styles.fetchBtnText}>
                                        {tab === 'prices' ? 'Fetch Prices' : 'Analyze with AI'}
                                    </Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Error */}
                    {error && (
                        <View style={styles.errorCard}>
                            <Text style={styles.errorTitle}>Error</Text>
                            <Text style={styles.errorMsg}>{error}</Text>
                            {error.includes('429') && (
                                <Text style={styles.errorHint}>Rate limited — wait 10–30s and retry</Text>
                            )}
                        </View>
                    )}

                    {/* PRICES TAB */}
                    {tab === 'prices' && meta && (
                        <>
                            <View style={styles.metaRow}>
                                <View style={styles.metaBox}>
                                    <Text style={styles.metaValue}>{meta.count}</Text>
                                    <Text style={styles.metaLabel}>Shown</Text>
                                </View>
                                <View style={styles.metaBox}>
                                    <Text style={styles.metaValue}>{(meta.total / 1e6).toFixed(1)}M</Text>
                                    <Text style={styles.metaLabel}>Total Records</Text>
                                </View>
                                <View style={styles.metaBox}>
                                    <Text style={styles.metaValue}>₹/qtl</Text>
                                    <Text style={styles.metaLabel}>Price Unit</Text>
                                </View>
                            </View>

                            {records.length === 0 ? (
                                <View style={styles.empty}>
                                    <Text style={styles.emptyEmoji}>No data</Text>
                                    <Text style={styles.emptyText}>No records found</Text>
                                </View>
                            ) : records.map((rec, i) => <PriceCard key={i} rec={rec} />)}
                        </>
                    )}

                    {/* ANALYZE TAB */}
                    {tab === 'analyze' && analysis && (
                        <>
                            {analysisMeta && <AnalysisMeta meta={analysisMeta} />}
                            <View style={styles.analysisCard}>
                                <Text style={styles.analysisTitle}>AI Market Intelligence</Text>
                                <Text style={styles.analysisText}>{analysis}</Text>
                                <Text style={styles.analysisPowered}>Powered by Amazon Nova AI · data.gov.in</Text>
                            </View>
                        </>
                    )}

                    {/* Empty state hint */}
                    {!hasFetched && !loading && !error && (
                        <View style={styles.hintCard}>
                            <Text style={styles.hintEmoji}>{tab === 'prices' ? '' : ''}</Text>
                            <Text style={styles.hintTitle}>
                                {tab === 'prices' ? 'Check Live Mandi Prices' : 'Get AI Market Insights'}
                            </Text>
                            <Text style={styles.hintText}>
                                {tab === 'prices'
                                    ? 'Select a state and commodity, then tap Fetch Prices to see today\'s rates across India.'
                                    : 'Select filters and tap Analyze to get buy/sell recommendations, price trends, and trade opportunities powered by AI.'}
                            </Text>

                            <View style={styles.hintExample}>
                                <Text style={styles.hintExampleTitle}>Try this:</Text>
                                {tab === 'prices' ? (
                                    <>
                                        <Text style={styles.hintExampleLine}>State: Maharashtra</Text>
                                        <Text style={styles.hintExampleLine}>Commodity: Onion</Text>
                                        <Text style={styles.hintExampleLine}>Limit: 10</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.hintExampleLine}>State: Maharashtra</Text>
                                        <Text style={styles.hintExampleLine}>Commodity: (leave empty)</Text>
                                        <Text style={styles.hintExampleLine}>Limit: 50</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

// ── Sub-components ──────────────────────────────────────────

const FilterInput = ({ label, placeholder, value, onChange, flex = 1, keyboardType = 'default' }) => (
    <View style={[styles.filterInputWrap, { flex }]}>
        <Text style={styles.filterLabel}>{label}</Text>
        <TextInput
            style={styles.filterInput}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
        />
    </View>
);

const PriceCard = ({ rec }) => {
    const modal = parseInt(rec.Modal_Price, 10);
    const min = parseInt(rec.Min_Price, 10);
    const max = parseInt(rec.Max_Price, 10);
    const spread = max && min ? Math.round(((max - min) / min) * 100) : 0;
    const pricePerKg = modal ? (modal / 100).toFixed(1) : '—';

    return (
        <View style={pStyles.card}>
            <View style={pStyles.topRow}>
                <View style={{ flex: 1 }}>
                    <Text style={pStyles.commodity}>{rec.Commodity}</Text>
                    <Text style={pStyles.variety}>{rec.Variety} · {rec.Grade}</Text>
                    <Text style={pStyles.location}>{rec.Market}, {rec.District}, {rec.State}</Text>
                </View>
                <View style={pStyles.priceBox}>
                    <Text style={pStyles.modalPrice}>₹{modal?.toLocaleString('en-IN')}</Text>
                    <Text style={pStyles.priceUnit}>per quintal</Text>
                    <Text style={pStyles.priceKg}>₹{pricePerKg}/kg</Text>
                </View>
            </View>

            <View style={pStyles.rangeRow}>
                <RangeItem label="Min" value={min} color="#10b981" />
                <View style={pStyles.rangeBar}>
                    <View style={pStyles.rangeTrack}>
                        <View
                            style={[pStyles.rangeThumb, {
                                left: max > min ? `${((modal - min) / (max - min)) * 100}%` : '50%'
                            }]}
                        />
                    </View>
                </View>
                <RangeItem label="Max" value={max} color="#ef4444" align="right" />
            </View>

            <View style={pStyles.footer}>
                <Text style={pStyles.date}>{rec.Arrival_Date}</Text>
                {spread > 0 && (
                    <View style={[pStyles.spreadBadge, { backgroundColor: spread > 20 ? '#FEF3C7' : '#F0FDF4' }]}>
                        <Text style={[pStyles.spreadText, { color: spread > 20 ? '#92400e' : '#166534' }]}>
                            {spread}% spread
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const RangeItem = ({ label, value, color, align = 'left' }) => (
    <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start', minWidth: 70 }}>
        <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: '800', color }}>{value ? `₹${value.toLocaleString('en-IN')}` : '—'}</Text>
    </View>
);

const AnalysisMeta = ({ meta }) => (
    <View style={styles.analysisMetaCard}>
        <View style={styles.analysisMetaRow}>
            <MetaChip icon="" label={meta.state || 'All India'} />
            {meta.district && <MetaChip icon="" label={meta.district} />}
            {meta.commodity && <MetaChip icon="" label={meta.commodity} />}
            <MetaChip icon="" label={`${meta.analyzed_records} records`} />
        </View>
        {meta.timestamp && (
            <Text style={styles.analysisTimestamp}>
                Generated: {new Date(meta.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
        )}
    </View>
);

const MetaChip = ({ icon, label }) => (
    <View style={styles.metaChip}>
        <Text style={styles.metaChipText}>{icon} {label}</Text>
    </View>
);

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F0FDF4' },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#14532d', paddingTop: 52, paddingBottom: 18, paddingHorizontal: 16,
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    backIcon: { color: '#FFF', fontSize: 20, fontWeight: '700' },
    headerTitle: { fontSize: 19, fontWeight: '900', color: '#FFF' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

    tabs: { flexDirection: 'row', backgroundColor: '#14532d', paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
    tabActive: { backgroundColor: '#FFF' },
    tabText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
    tabTextActive: { color: '#14532d' },

    body: { padding: 16 },

    filterCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
    filterTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 12 },
    filterRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    filterInputWrap: {},
    filterLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 },
    filterInput: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: '600', color: '#111827' },

    chipsScroll: { marginBottom: 10 },
    chip: { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 7, borderWidth: 1.5, borderColor: 'transparent' },
    chipActive: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
    chipText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
    chipTextActive: { color: '#14532d' },

    actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    clearBtn: { backgroundColor: '#F3F4F6', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, justifyContent: 'center' },
    clearBtnText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
    fetchBtn: { flex: 1, backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    fetchBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

    errorCard: { backgroundColor: '#FEE2E2', borderRadius: 16, padding: 14, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
    errorTitle: { fontSize: 14, fontWeight: '800', color: '#991b1b', marginBottom: 4 },
    errorMsg: { fontSize: 12, color: '#7f1d1d', lineHeight: 18 },
    errorHint: { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 6 },

    metaRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    metaBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    metaValue: { fontSize: 18, fontWeight: '900', color: '#14532d', marginBottom: 2 },
    metaLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase' },

    empty: { alignItems: 'center', paddingVertical: 32 },
    emptyEmoji: { fontSize: 40, marginBottom: 8 },
    emptyText: { fontSize: 15, color: '#9CA3AF', fontWeight: '600' },

    analysisCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 4 },
    analysisTitle: { fontSize: 16, fontWeight: '900', color: '#14532d', marginBottom: 14 },
    analysisText: { fontSize: 13, color: '#374151', lineHeight: 22 },
    analysisPowered: { fontSize: 10, color: '#9CA3AF', marginTop: 16, textAlign: 'right', fontStyle: 'italic' },

    analysisMetaCard: { backgroundColor: '#f0fdf4', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#bbf7d0' },
    analysisMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
    metaChip: { backgroundColor: '#dcfce7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    metaChipText: { fontSize: 12, fontWeight: '700', color: '#14532d' },
    analysisTimestamp: { fontSize: 11, color: '#6B7280', fontStyle: 'italic' },

    hintCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 22, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    hintEmoji: { fontSize: 48, marginBottom: 12 },
    hintTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 8, textAlign: 'center' },
    hintText: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
    hintExample: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, width: '100%', borderLeftWidth: 4, borderLeftColor: '#16a34a' },
    hintExampleTitle: { fontSize: 12, fontWeight: '800', color: '#374151', marginBottom: 6 },
    hintExampleLine: { fontSize: 13, color: '#374151', fontWeight: '500', marginBottom: 2 },
});

const pStyles = StyleSheet.create({
    card: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    commodity: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 2 },
    variety: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 2 },
    location: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    priceBox: { alignItems: 'flex-end' },
    modalPrice: { fontSize: 20, fontWeight: '900', color: '#16a34a' },
    priceUnit: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginTop: 1 },
    priceKg: { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 2 },
    rangeRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6', marginBottom: 10 },
    rangeBar: { flex: 1, marginHorizontal: 10 },
    rangeTrack: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, position: 'relative' },
    rangeThumb: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#16a34a', borderWidth: 2, borderColor: '#FFF', position: 'absolute', top: -4, marginLeft: -7, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    date: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
    spreadBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    spreadText: { fontSize: 11, fontWeight: '700' },
});

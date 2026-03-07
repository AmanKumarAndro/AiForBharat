import { useState, useEffect, useCallback } from 'react'

const API = 'https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com'

/* ─── tiny icon helpers ─── */
const I = ({ d, className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {typeof d === 'string' ? <path d={d} /> : d}
    </svg>
)
const UsersIcon = (p) => <I {...p} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />
const MicIcon = (p) => <I {...p} d={<><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></>} />
const AlertIcon = (p) => <I {...p} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></>} />
const TractorIcon = (p) => <I {...p} d={<><path d="M3 17h1m12 0h5M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10-2V9a2 2 0 0 0-2-2H5v8" /><circle cx="17" cy="17" r="2" /></>} />
const DropletIcon = (p) => <I {...p} d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
const BarChartIcon = (p) => <I {...p} d={<><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></>} />
const RefreshIcon = (p) => <I {...p} d={<><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-10.32L23 10" /></>} />
const LogOutIcon = (p) => <I {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></>} />
const ClockIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />
const MapPinIcon = (p) => <I {...p} d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>} />
const LeafIcon = (p) => <I {...p} d={<><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 .5 20 .5s-1.5 7-6.5 11A5 5 0 0 0 11 20" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></>} />
const SunIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>} />
const ActivityIcon = (p) => <I {...p} d={<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>} />

/* ─── Tabs definition ─── */
const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChartIcon },
    { id: 'voice', label: 'Voice AI', icon: MicIcon },
    { id: 'services', label: 'Helping Hand', icon: TractorIcon },
    { id: 'irrigation', label: 'Irrigation', icon: DropletIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'activity', label: 'Activity', icon: ActivityIcon },
]

/* ─── Fetch helper ─── */
async function apiFetch(path) {
    try {
        const r = await fetch(`${API}${path}`)
        if (!r.ok) throw new Error(`${r.status}`)
        return await r.json()
    } catch (e) {
        console.error(`API ${path}:`, e)
        return null
    }
}

/* ─── Stat Card ─── */
function StatCard({ icon: Ic, label, value, color = 'text-[#1B5E20]', bg = 'bg-green-50' }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-green-50 transition-all">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}>
                    <Ic className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{value ?? '—'}</p>
        </div>
    )
}

/* ═══════════════════════════════════════════════
   TAB PANELS
   ═══════════════════════════════════════════════ */

function OverviewTab({ data }) {
    if (!data) return <Loading />
    const { overview, farmers, aiUsage, alerts, services } = data

    return (
        <div className="space-y-6">
            {/* Top metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard icon={UsersIcon} label="Total Farmers" value={overview?.totalFarmers} bg="bg-blue-50" color="text-blue-600" />
                <StatCard icon={MicIcon} label="Voice Queries" value={aiUsage?.totalQueries} bg="bg-purple-50" color="text-purple-600" />
                <StatCard icon={SunIcon} label="Weather Alerts" value={alerts?.weatherAlerts ?? overview?.weatherAlerts} bg="bg-orange-50" color="text-orange-600" />
                <StatCard icon={DropletIcon} label="Irrigation Alerts" value={alerts?.irrigationAlerts ?? overview?.irrigationAlerts} bg="bg-emerald-50" color="text-emerald-600" />
                <StatCard icon={TractorIcon} label="Service Requests" value={services?.totalRequests ?? overview?.serviceRequests} bg="bg-amber-50" color="text-amber-600" />
                <StatCard icon={BarChartIcon} label="Market Queries" value={overview?.marketQueries} bg="bg-sky-50" color="text-sky-600" />
            </div>

            {/* Row 2: Farmers by State + AI Top Queries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Farmers */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-blue-500" /> Farmers by State
                    </h3>
                    {farmers?.topStates?.length > 0 ? (
                        <div className="space-y-3">
                            {farmers.topStates.map((s, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-semibold text-gray-700">{s.state}</span>
                                            <span className="font-bold text-gray-900">{s.count}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#1B5E20] to-[#10B981] rounded-full transition-all"
                                                style={{ width: `${Math.min(100, (s.count / (farmers.totalFarmers || 1)) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-400">No farmer data yet</p>}
                </div>

                {/* Top queries */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MicIcon className="w-4 h-4 text-purple-500" /> Top Voice Queries
                    </h3>
                    {aiUsage?.topQueries?.length > 0 ? (
                        <ul className="space-y-2.5">
                            {aiUsage.topQueries.map((q, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm">
                                    <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                                        {i + 1}
                                    </span>
                                    <span className="text-gray-700 font-medium leading-relaxed" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                                        {q}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-400">No queries yet</p>}
                    {aiUsage?.avgResponseTime && (
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-500">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            Avg response: <span className="font-bold text-gray-900">{aiUsage.avgResponseTime}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function VoiceAITab() {
    const [data, setData] = useState(null)
    useEffect(() => { apiFetch('/dashboard/features/voice-ai').then(setData) }, [])
    if (!data) return <Loading />

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={MicIcon} label="Total Queries" value={data.total} bg="bg-purple-50" color="text-purple-600" />
                <StatCard icon={ClockIcon} label="Avg Latency" value={`${(data.avgLatency / 1000).toFixed(1)}s`} bg="bg-blue-50" color="text-blue-600" />
                <StatCard icon={BarChartIcon} label="Unique Questions" value={data.topQuestions?.length ?? 0} bg="bg-emerald-50" color="text-emerald-600" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Top Questions by Frequency</h3>
                {data.topQuestions?.length > 0 ? (
                    <div className="space-y-3">
                        {data.topQuestions.map((q, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{q.value}</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold">{q.count}×</span>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-gray-400">No queries yet</p>}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Sessions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">Question</th>
                                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">Session ID</th>
                                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">Latency</th>
                                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.sessions || []).slice(0, 15).map((s, i) => (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <td className="py-3 px-3 font-medium text-gray-700 max-w-xs truncate" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{s.question}</td>
                                    <td className="py-3 px-3 text-gray-500 font-mono text-xs">{s.sessionId?.slice(0, 16)}</td>
                                    <td className="py-3 px-3">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold
                      ${s.latency < 5000 ? 'bg-green-50 text-green-700' : s.latency < 10000 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                            {(s.latency / 1000).toFixed(1)}s
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-gray-400 text-xs">{new Date(s.timestamp).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function HelpingHandTab() {
    const [data, setData] = useState(null)
    useEffect(() => { apiFetch('/dashboard/features/helping-hand').then(setData) }, [])
    if (!data) return <Loading />

    const sr = data.serviceRequests || {}
    const prov = data.providers || {}

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={TractorIcon} label="Total Requests" value={sr.total} bg="bg-amber-50" color="text-amber-600" />
                <StatCard icon={UsersIcon} label="Providers" value={prov.total} bg="bg-blue-50" color="text-blue-600" />
                <StatCard icon={BarChartIcon} label="Completed" value={sr.completedRequests} bg="bg-emerald-50" color="text-emerald-600" />
                <StatCard icon={BarChartIcon} label="Revenue" value={sr.totalRevenue ? `₹${sr.totalRevenue.toLocaleString()}` : '₹0'} bg="bg-green-50" color="text-[#1B5E20]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Requests by Status</h3>
                    {sr.byStatus && Object.keys(sr.byStatus).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(sr.byStatus).map(([status, count]) => {
                                const colors = { MATCHED: 'bg-emerald-500', NOTIFYING: 'bg-blue-500', COMPLETED: 'bg-gray-400', NO_PROVIDERS_FOUND: 'bg-red-400', PENDING: 'bg-amber-400' }
                                return (
                                    <div key={status} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-gray-300'}`} />
                                        <span className="flex-1 text-sm font-medium text-gray-600">{status.replace(/_/g, ' ')}</span>
                                        <span className="text-sm font-bold text-gray-900">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : <p className="text-sm text-gray-400">No data</p>}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Requests by Service Type</h3>
                    {sr.byServiceType && Object.keys(sr.byServiceType).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(sr.byServiceType).map(([type, count]) => {
                                const total = Object.values(sr.byServiceType).reduce((a, b) => a + b, 0)
                                return (
                                    <div key={type}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-semibold text-gray-700">{type}</span>
                                            <span className="font-bold text-gray-900">{count}</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : <p className="text-sm text-gray-400">No data</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                    <p className="text-2xl font-black text-gray-900">{data.treatments?.total ?? 0}</p>
                    <p className="text-xs font-bold text-gray-400 mt-1">Treatments</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                    <p className="text-2xl font-black text-gray-900">{data.bannedPesticides?.total ?? 0}</p>
                    <p className="text-xs font-bold text-gray-400 mt-1">Banned Pesticides</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                    <p className="text-2xl font-black text-gray-900">{data.kvkContacts?.total ?? 0}</p>
                    <p className="text-xs font-bold text-gray-400 mt-1">KVK Contacts</p>
                </div>
            </div>
        </div>
    )
}

function IrrigationTab() {
    const [data, setData] = useState(null)
    useEffect(() => { apiFetch('/dashboard/features/irrigation').then(setData) }, [])
    if (!data) return <Loading />

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={UsersIcon} label="Registered Farmers" value={data.farmers?.total} bg="bg-blue-50" color="text-blue-600" />
                <StatCard icon={LeafIcon} label="Crop Records" value={data.cropData?.total} bg="bg-green-50" color="text-[#1B5E20]" />
                <StatCard icon={SunIcon} label="Monsoon Entries" value={data.monsoonCalendar?.total} bg="bg-orange-50" color="text-orange-600" />
                <StatCard icon={DropletIcon} label="Soil States" value={data.soilState?.total} bg="bg-emerald-50" color="text-emerald-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Registered Irrigation Farmers</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase">Name</th>
                                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase">Crop</th>
                                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase">District</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.farmers?.farmers || []).slice(0, 10).map((f, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="py-2.5 px-3 font-medium text-gray-700">{f.name || f.farmerName || '—'}</td>
                                        <td className="py-2.5 px-3">
                                            <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-bold">{f.crop || f.cropType || '—'}</span>
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-500">{f.district || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">System Summary</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'SMS Logs', value: data.smsLog?.total ?? 0, icon: '📱' },
                            { label: 'Water Savings Records', value: data.savings?.total ?? 0, icon: '💧' },
                            { label: 'Soil State Monitored', value: data.soilState?.total ?? 0, icon: '🌱' },
                            { label: 'Crop Types Tracked', value: data.cropData?.total ?? 0, icon: '🌾' },
                            { label: 'Monsoon Calendar Entries', value: data.monsoonCalendar?.total ?? 0, icon: '🌧️' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <span className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>{item.icon}</span> {item.label}
                                </span>
                                <span className="text-sm font-bold text-gray-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function UsersTab() {
    const [data, setData] = useState(null)
    useEffect(() => { apiFetch('/dashboard/users').then(setData) }, [])
    if (!data) return <Loading />

    const sourceColors = { auth: 'bg-blue-50 text-blue-700', irrigation: 'bg-emerald-50 text-emerald-700', service_requests: 'bg-amber-50 text-amber-700', serviceRequests: 'bg-amber-50 text-amber-700' }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard icon={UsersIcon} label="Total Users" value={data.total} bg="bg-blue-50" color="text-blue-600" />
                <StatCard icon={UsersIcon} label="Auth Users" value={data.bySource?.auth ?? 0} bg="bg-sky-50" color="text-sky-600" />
                <StatCard icon={DropletIcon} label="Irrigation Users" value={data.bySource?.irrigation ?? 0} bg="bg-emerald-50" color="text-emerald-600" />
                <StatCard icon={TractorIcon} label="Service Users" value={data.bySource?.serviceRequests ?? 0} bg="bg-amber-50" color="text-amber-600" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">All Users ({data.total})</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">Name</th>
                                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">Source</th>
                                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">Location</th>
                                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.users || []).map((u, i) => (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-xs font-bold text-[#1B5E20]">
                                                {(u.name || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{u.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-400">{u.phone?.replace(/farmer#/, '').slice(0, 20)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3">
                                        {(u.sources || [u.source]).map((src, j) => (
                                            <span key={j} className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold mr-1 ${sourceColors[src] || 'bg-gray-50 text-gray-500'}`}>
                                                {src?.replace(/_/g, ' ') || '?'}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="py-3 px-3 text-gray-500 text-xs">{u.location || '—'}</td>
                                    <td className="py-3 px-3 text-gray-400 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function ActivityTab() {
    const [data, setData] = useState(null)
    useEffect(() => { apiFetch('/dashboard/activity?limit=20').then(setData) }, [])
    if (!data) return <Loading />

    const typeIcon = { voice_query: <MicIcon className="w-4 h-4" />, service_request: <TractorIcon className="w-4 h-4" /> }
    const typeBg = { voice_query: 'bg-purple-50 text-purple-600', service_request: 'bg-amber-50 text-amber-600' }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Activity Feed</h3>
                {Array.isArray(data) && data.length > 0 ? (
                    <div className="space-y-3">
                        {data.map((a, i) => (
                            <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeBg[a.type] || 'bg-gray-50 text-gray-500'}`}>
                                    {typeIcon[a.type] || <ActivityIcon className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {a.type === 'voice_query' ? 'Voice Query' : a.type === 'service_request' ? `Service Request: ${a.service}` : a.type?.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate" style={{ fontFamily: a.query ? "'Noto Sans Devanagari', sans-serif" : undefined }}>
                                        {a.query || a.location || a.description || ''}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                                    {a.time ? (typeof a.time === 'number'
                                        ? new Date(a.time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
                                        : new Date(a.time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }))
                                        : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-gray-400">No recent activity</p>}
            </div>
        </div>
    )
}

function Loading() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400">
                <span className="w-5 h-5 border-2 border-gray-300 border-t-[#1B5E20] rounded-full animate-spin" />
                <span className="text-sm font-semibold">Loading data…</span>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD LAYOUT
   ═══════════════════════════════════════════════ */
export default function AdminDashboard() {
    const [tab, setTab] = useState('overview')
    const [overviewData, setOverviewData] = useState(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const loadOverview = useCallback(async () => {
        const [overview, farmers, aiUsage, alerts, services] = await Promise.all([
            apiFetch('/dashboard/overview'),
            apiFetch('/dashboard/farmers'),
            apiFetch('/dashboard/ai-usage'),
            apiFetch('/dashboard/alerts'),
            apiFetch('/dashboard/services'),
        ])
        setOverviewData({ overview, farmers, aiUsage, alerts, services })
    }, [])

    useEffect(() => { loadOverview() }, [loadOverview, refreshKey])

    const handleLogout = () => {
        sessionStorage.removeItem('kv_admin')
        window.location.reload()
    }

    return (
        <div className="min-h-screen bg-[#FAFBFC]">
            {/* Top bar */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1B5E20] flex items-center justify-center">
                            <LeafIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-extrabold text-gray-900 leading-tight">KisanVoice<span className="text-[#10B981]">AI</span></h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest -mt-0.5">Admin Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => setRefreshKey(k => k + 1)}
                            className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors" title="Refresh">
                            <RefreshIcon className="w-4 h-4" />
                        </button>
                        <button onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                            <LogOutIcon className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tab navigation */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-6 no-scrollbar">
                    {TABS.map(t => {
                        const active = tab === t.id
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all
                  ${active
                                        ? 'bg-[#1B5E20] text-white shadow-lg shadow-green-900/15'
                                        : 'bg-white text-gray-500 border border-gray-100 hover:border-green-200 hover:text-[#1B5E20]'}`}>
                                <t.icon className="w-4 h-4" />
                                {t.label}
                            </button>
                        )
                    })}
                </div>

                {/* Tab content */}
                {tab === 'overview' && <OverviewTab data={overviewData} />}
                {tab === 'voice' && <VoiceAITab key={refreshKey} />}
                {tab === 'services' && <HelpingHandTab key={refreshKey} />}
                {tab === 'irrigation' && <IrrigationTab key={refreshKey} />}
                {tab === 'users' && <UsersTab key={refreshKey} />}
                {tab === 'activity' && <ActivityTab key={refreshKey} />}
            </div>
        </div>
    )
}

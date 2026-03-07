import { useState } from 'react'

const ADMIN_ID = 'admin'
const ADMIN_PASS = 'kisanvoice2026'

export default function AdminGuard({ children }) {
    const [authed, setAuthed] = useState(() => sessionStorage.getItem('kv_admin') === '1')
    const [id, setId] = useState('')
    const [pass, setPass] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    if (authed) return children

    const handleLogin = (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setTimeout(() => {
            if (id === ADMIN_ID && pass === ADMIN_PASS) {
                sessionStorage.setItem('kv_admin', '1')
                setAuthed(true)
            } else {
                setError('Invalid credentials')
            }
            setLoading(false)
        }, 600)
    }

    return (
        <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#1B5E20] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-900/20">
                        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 .5 20 .5s-1.5 7-6.5 11A5 5 0 0 0 11 20" />
                            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Admin Panel</h1>
                    <p className="text-sm text-gray-500 mt-1">KisanVoice AI Analytics</p>
                </div>

                {/* Login Card */}
                <form onSubmit={handleLogin}
                    className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-green-100/30 p-6 space-y-4">

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Admin ID</label>
                        <input
                            type="text"
                            value={id}
                            onChange={e => setId(e.target.value)}
                            placeholder="Enter admin ID"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-900
                focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/20 focus:border-[#1B5E20] transition-all
                placeholder:text-gray-400"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                        <input
                            type="password"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-900
                focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/20 focus:border-[#1B5E20] transition-all
                placeholder:text-gray-400"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                            <svg className="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="15" x2="9" y1="9" y2="15" /><line x1="9" x2="15" y1="9" y2="15" />
                            </svg>
                            <span className="text-sm font-medium text-red-600">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !id || !pass}
                        className="w-full py-3.5 bg-[#1B5E20] text-white text-sm font-bold rounded-xl
              hover:bg-[#0D3B12] transition-all shadow-lg shadow-green-900/20
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-6">Protected admin area · Session only</p>
            </div>
        </div>
    )
}

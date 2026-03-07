import { useState, useEffect, useRef } from 'react'

/* ─── Icon components (inline SVG for zero deps) ─── */
const Icon = ({ children, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`w-5 h-5 ${className}`}>{children}</svg>
)

const MicIcon = ({ className }) => <Icon className={className}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></Icon>
const SunIcon = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></Icon>
const DropletIcon = ({ className }) => <Icon className={className}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></Icon>
const CameraIcon = ({ className }) => <Icon className={className}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></Icon>
const LeafIcon = ({ className }) => <Icon className={className}><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 .5 20 .5s-1.5 7-6.5 11A5 5 0 0 0 11 20" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></Icon>
const TractorIcon = ({ className }) => <Icon className={className}><path d="M3 17h1m12 0h5M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10-2V9a2 2 0 0 0-2-2H5v8" /><circle cx="17" cy="17" r="2" /></Icon>
const ShopIcon = ({ className }) => <Icon className={className}><path d="M3 9l1.5-4.5A2 2 0 0 1 6.4 3h11.2a2 2 0 0 1 1.9 1.5L21 9" /><path d="M3 9v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9" /><path d="M3 9h18" /></Icon>
const CheckCircle = ({ className }) => <Icon className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Icon>
const BarChart = ({ className }) => <Icon className={className}><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></Icon>
const Shield = ({ className }) => <Icon className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>
const Zap = ({ className }) => <Icon className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Icon>
const Globe = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Icon>
const Phone = ({ className }) => <Icon className={className}><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><line x1="12" x2="12.01" y1="18" y2="18" /></Icon>
const ChevronRight = ({ className }) => <Icon className={className}><polyline points="9 18 15 12 9 6" /></Icon>
const Github = ({ className }) => <Icon className={className}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></Icon>
const Server = ({ className }) => <Icon className={className}><rect width="20" height="8" x="2" y="2" rx="2" ry="2" /><rect width="20" height="8" x="2" y="14" rx="2" ry="2" /><line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" /></Icon>
const Brain = ({ className }) => <Icon className={className}><path d="M9.5 2A5.5 5.5 0 0 0 5 7.5c0 .53.08 1.04.22 1.52A5.5 5.5 0 0 0 7 19.5a5.5 5.5 0 0 0 5 3 5.5 5.5 0 0 0 5-3 5.5 5.5 0 0 0 1.78-10.48c.14-.48.22-.99.22-1.52A5.5 5.5 0 0 0 14.5 2" /><path d="M12 2v20" /></Icon>
const MessageCircle = ({ className }) => <Icon className={className}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></Icon>
const ArrowRight = ({ className }) => <Icon className={className}><line x1="5" x2="19" y1="12" y2="12" /><polyline points="12 5 19 12 12 19" /></Icon>


/* ─── Intersection Observer hook ─── */
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

/* ═══════════════════════════════════════════════════
   SECTION COMPONENTS
   ═══════════════════════════════════════════════════ */

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'Services', href: '#services' },
    { label: 'Tech Stack', href: '#tech' },
    { label: 'Impact', href: '#impact' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1B5E20] flex items-center justify-center">
              <LeafIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-gray-900">KisanVoice<span className="text-[#10B981]">AI</span></span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <a key={l.href} href={l.href}
                className="text-sm font-semibold text-gray-600 hover:text-[#1B5E20] transition-colors">{l.label}</a>
            ))}
            <a href="https://github.com/AmanKumarAndro/AiForBharat" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5E20] text-white text-sm font-bold rounded-xl
                         hover:bg-[#0D3B12] transition-colors shadow-lg shadow-green-900/20">
              <Github className="w-4 h-4" /> GitHub
            </a>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4 flex flex-col gap-3 bg-white/95 backdrop-blur-xl rounded-b-2xl px-2">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold text-gray-700 hover:text-[#1B5E20] py-2 px-3 rounded-lg hover:bg-green-50 transition">{l.label}</a>
            ))}
            <a href="https://github.com/AmanKumarAndro/AiForBharat" target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B5E20] text-white text-sm font-bold rounded-xl mt-2">
              <Github className="w-4 h-4" /> View on GitHub
            </a>
          </div>
        )}
      </div>
    </nav>
  )
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
      {/* Background deco */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/80 via-white to-white pointer-events-none" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-green-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100/70 border border-green-200 text-sm font-semibold text-[#1B5E20] mb-6 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            AI For Bharat — Hackathon Submission
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-gradient">Voice-First AI</span> for{' '}
            <br className="hidden sm:block" />
            Indian Farmers
          </h1>

          {/* Hindi subtitle */}
          <p className="text-lg sm:text-xl text-gray-500 font-medium max-w-2xl mx-auto mb-2 animate-slide-up" style={{ animationDelay: '0.2s', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            🌾 किसानों के लिए AI-powered आवाज सहायक — हिंदी में
          </p>

          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.25s' }}>
            Speak your query in Hindi. Get real-time weather, market prices, irrigation advice,
            and on-demand farm services — all through natural voice conversation.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.35s' }}>
            <a href="https://github.com/AmanKumarAndro/AiForBharat" target="_blank" rel="noreferrer"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1B5E20] text-white text-base font-bold rounded-2xl
              hover:bg-[#0D3B12] transition-all shadow-xl shadow-green-900/25 hover:shadow-2xl hover:shadow-green-900/30">
              <Github className="w-5 h-5" />
              View Source Code
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-200 text-gray-700 text-base font-bold rounded-2xl
              hover:border-[#1B5E20] hover:text-[#1B5E20] transition-all bg-white/50 backdrop-blur-sm">
              Explore Features
            </a>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto stagger">
            {[
              { value: '6', label: 'AI Services', icon: <Server className="w-4 h-4" /> },
              { value: '27', label: 'App Screens', icon: <Phone className="w-4 h-4" /> },
              { value: '30+', label: 'Lambda Functions', icon: <Zap className="w-4 h-4" /> },
              { value: '$0.0005', label: 'Per AI Query', icon: <BarChart className="w-4 h-4" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center
                shadow-sm hover:shadow-md hover:border-green-200 transition-all">
                <div className="flex items-center justify-center gap-1.5 text-[#10B981] mb-1">{s.icon}</div>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Voice CTA Banner (mirrors the green card on HomeScreen) ─── */
function VoiceBanner() {
  const [ref, vis] = useInView()
  return (
    <section ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-16">
      <div className={`relative bg-[#1B5E20] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 overflow-hidden
        transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Deco circles */}
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-white/5 rounded-full" />

        {/* Mic pulse */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-white/10 animate-mic-pulse" />
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <MicIcon className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-xl font-extrabold text-white mb-1">
            बात करो, हल पाओ — <span className="text-green-200">Speak & Get Answers</span>
          </h3>
          <p className="text-green-100/70 text-sm font-medium">
            Farmers speak their question in Hindi → AI responds with voice answers, weather advisories, market insights & more
          </p>
        </div>

        <ChevronRight className="w-6 h-6 text-white/60 hidden sm:block" />
      </div>
    </section>
  )
}

/* ─── Features Grid (mirrors HomeScreen feature cards) ─── */
function FeaturesGrid() {
  const [ref, vis] = useInView()

  const features = [
    { icon: <MicIcon />, label: 'Voice AI Agent', desc: 'Hindi speech-to-text + AI answers + voice playback', bg: 'bg-green-50', accent: 'text-[#1B5E20]', border: 'border-green-100' },
    { icon: <SunIcon />, label: 'Weather Advisory', desc: 'Real-time spray safety & 7-day forecast with AI insights', bg: 'bg-blue-50', accent: 'text-blue-600', border: 'border-blue-100' },
    { icon: <DropletIcon />, label: 'Irrigation Alerts', desc: 'FAO-56 soil moisture + 24/7 weather monitoring via SMS', bg: 'bg-emerald-50', accent: 'text-emerald-600', border: 'border-emerald-100' },
    { icon: <ShopIcon />, label: 'Live Market', desc: 'Real-time commodity prices with AI buy/sell recommendations', bg: 'bg-green-50', accent: 'text-green-600', border: 'border-green-100' },
    { icon: <CameraIcon />, label: 'Pest Scan', desc: 'Camera-based pest identification with ICAR guidance', bg: 'bg-orange-50', accent: 'text-orange-600', border: 'border-orange-100' },
    { icon: <TractorIcon />, label: 'Helping Hand', desc: 'On-demand tractor, labour & transport — Uber-style matching', bg: 'bg-amber-50', accent: 'text-amber-600', border: 'border-amber-100' },
    { icon: <LeafIcon />, label: 'Crop Guide', desc: 'ICAR-verified crop guides with Hindi video tutorials', bg: 'bg-purple-50', accent: 'text-purple-600', border: 'border-purple-100' },
    { icon: <Shield />, label: 'OTP Login', desc: 'Phone-based OTP authentication + JWT sessions', bg: 'bg-sky-50', accent: 'text-sky-600', border: 'border-sky-100' },
    { icon: <MessageCircle />, label: 'Bilingual SMS', desc: 'Critical alerts in Hindi + English on any phone', bg: 'bg-rose-50', accent: 'text-rose-600', border: 'border-rose-100' },
  ]

  return (
    <section id="features" ref={ref} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-sm font-bold text-[#10B981] tracking-widest uppercase mb-3">Platform Features</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-4">Everything a Farmer Needs</h2>
          <p className="text-gray-500 max-w-xl mx-auto">One app, one voice — access six integrated AI services for smarter farming.</p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ${vis ? 'stagger' : ''}`}>
          {features.map((f, i) => (
            <div key={i}
              className={`group rounded-2xl border ${f.border} p-6 bg-white hover:shadow-lg hover:shadow-green-100/50 transition-all duration-300 hover:-translate-y-1`}>
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center ${f.accent} mb-4
                group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">{f.label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Services Architecture ─── */
function ServicesSection() {
  const [ref, vis] = useInView()

  const services = [
    { name: 'Mobile App', tech: 'React Native · TypeScript', desc: '27 screens with voice AI, weather, market, irrigation, services, pest scan', color: 'bg-blue-500', screens: '27 screens' },
    { name: 'Login System', tech: 'Node.js · Serverless · DynamoDB', desc: 'OTP via Twilio Verify → JWT sessions with 7-day expiry', color: 'bg-sky-500', endpoints: '4 endpoints' },
    { name: 'AI Voice Agent', tech: 'Bedrock · Llama 3 · Polly', desc: 'Hindi queries → auto tool selection → YouTube, web search, RAG', color: 'bg-purple-500', endpoints: '5 endpoints' },
    { name: 'Weather Advisory', tech: 'Python · OpenWeather · Nova', desc: 'Spray safety rules: wind, rain, humidity, UV → friendly Hindi advisory', color: 'bg-orange-500', endpoints: '1 endpoint' },
    { name: 'Irrigation Alerts', tech: 'Node.js · EventBridge · Twilio', desc: 'FAO-56 soil moisture + 6 crop types · 6 growth stages · bilingual SMS', color: 'bg-emerald-500', endpoints: '12 functions' },
    { name: 'Live Market', tech: 'Python · data.gov.in · Nova Micro', desc: 'Real-time commodity prices → AI analysis → buy/sell recommendations', color: 'bg-green-500', endpoints: '2 endpoints' },
    { name: 'Helping Hand', tech: 'Python · DynamoDB · Twilio SMS', desc: 'Farmer requests → top 3 providers notified → reply YES to accept', color: 'bg-amber-500', endpoints: '10 endpoints' },
  ]

  return (
    <section id="services" ref={ref} className="py-20 bg-[#FAFBFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-sm font-bold text-[#10B981] tracking-widest uppercase mb-3">System Architecture</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-4">7 Integrated Components</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Each service is independently deployable on AWS Lambda with its own API, database, and deployment pipeline.</p>
        </div>

        <div className={`space-y-4 ${vis ? 'stagger' : ''}`}>
          {services.map((s, i) => (
            <div key={i}
              className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4
              hover:shadow-lg hover:shadow-green-50 hover:border-green-100 transition-all group">
              {/* Color bar */}
              <div className={`w-1.5 h-12 rounded-full ${s.color} shrink-0 hidden sm:block`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-bold text-gray-900">{s.name}</h3>
                  <span className="px-2.5 py-0.5 text-xs font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded-lg">
                    {s.endpoints || s.screens}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>

              <div className="shrink-0 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 whitespace-nowrap">{s.tech}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Tech Stack ─── */
function TechStack() {
  const [ref, vis] = useInView()

  const categories = [
    {
      title: 'AI / ML',
      icon: <Brain className="w-5 h-5" />,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      items: ['AWS Bedrock', 'Claude 3.5 Sonnet', 'Meta Llama 3 8B', 'Amazon Nova', 'AWS Polly (Neural)', 'AWS Transcribe']
    },
    {
      title: 'Mobile',
      icon: <Phone className="w-5 h-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      items: ['React Native', 'TypeScript', 'React Navigation', '@react-native-voice/voice', 'AWS SDK v3']
    },
    {
      title: 'Backend',
      icon: <Server className="w-5 h-5" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      items: ['AWS Lambda', 'API Gateway', 'DynamoDB', 'EventBridge', 'S3', 'CloudWatch']
    },
    {
      title: 'Services',
      icon: <Globe className="w-5 h-5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      items: ['Twilio SMS + Verify', 'OpenWeather API', 'data.gov.in API', 'Serverless Framework', 'Node.js 18/20', 'Python 3.12']
    },
  ]

  return (
    <section id="tech" ref={ref} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-sm font-bold text-[#10B981] tracking-widest uppercase mb-3">Technology</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-4">Built on Production AWS</h2>
          <p className="text-gray-500 max-w-xl mx-auto">100% serverless, auto-scaling, pay-per-use architecture running on 30+ Lambda functions.</p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${vis ? 'stagger' : ''}`}>
          {categories.map((cat, i) => (
            <div key={i}
              className="rounded-2xl border border-gray-100 p-6 bg-white hover:shadow-lg hover:shadow-green-50 transition-all">
              <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center ${cat.color} mb-4`}>
                {cat.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-3">{cat.title}</h3>
              <ul className="space-y-2">
                {cat.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Impact Section ─── */
function Impact() {
  const [ref, vis] = useInView()

  const metrics = [
    { value: '30-40%', label: 'Water Saved Per Season', icon: <DropletIcon className="w-6 h-6" /> },
    { value: '10-15%', label: 'Yield Increase', icon: <BarChart className="w-6 h-6" /> },
    { value: '₹23,000', label: 'Farmer Savings / Season', icon: <Zap className="w-6 h-6" /> },
    { value: '4,500%', label: 'Farmer ROI', icon: <CheckCircle className="w-6 h-6" /> },
    { value: '2-5s', label: 'Text Query Response', icon: <Brain className="w-6 h-6" /> },
    { value: '12', label: 'Districts in Haryana', icon: <Globe className="w-6 h-6" /> },
  ]

  return (
    <section id="impact" ref={ref} className="py-20 bg-[#FAFBFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-sm font-bold text-[#10B981] tracking-widest uppercase mb-3">Measurable Impact</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-4">Real Results for Real Farmers</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Built for impact — saving water, increasing yield, and reducing costs.</p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${vis ? 'stagger' : ''}`}>
          {metrics.map((m, i) => (
            <div key={i}
              className="bg-white rounded-2xl border border-gray-100 p-6 text-center
              hover:shadow-lg hover:shadow-green-50 hover:border-green-200 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-[#1B5E20] mx-auto mb-4">
                {m.icon}
              </div>
              <p className="text-3xl font-black text-gradient mb-1">{m.value}</p>
              <p className="text-sm font-semibold text-gray-500">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How It Works ─── */
function HowItWorks() {
  const [ref, vis] = useInView()

  const steps = [
    { num: '01', title: 'Farmer Speaks in Hindi', desc: 'Tap the mic and ask any farming question in natural Hindi voice', icon: <MicIcon className="w-6 h-6" /> },
    { num: '02', title: 'AI Routes to Service', desc: 'Smart tool selection routes the query to weather, market, irrigation, or services', icon: <Brain className="w-6 h-6" /> },
    { num: '03', title: 'Real-time Intelligence', desc: 'Live data from OpenWeather, data.gov.in, ICAR knowledge base, and Bedrock AI', icon: <Zap className="w-6 h-6" /> },
    { num: '04', title: 'Voice Response in Hindi', desc: 'AI answer converted to speech via AWS Polly — farmer hears the answer', icon: <MessageCircle className="w-6 h-6" /> },
  ]

  return (
    <section ref={ref} className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-sm font-bold text-[#10B981] tracking-widest uppercase mb-3">Voice Pipeline</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-4">How It Works</h2>
        </div>

        <div className="space-y-0 relative">
          {/* Vertical line */}
          <div className="absolute left-6 sm:left-8 top-8 bottom-8 w-0.5 bg-green-100 hidden sm:block" />

          {steps.map((s, i) => (
            <div key={i}
              className={`flex items-start gap-5 sm:gap-6 p-4 sm:p-5 transition-all duration-700
              ${vis ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
              style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#1B5E20] flex items-center justify-center text-white shrink-0 relative z-10 shadow-lg shadow-green-900/20">
                {s.icon}
              </div>
              <div className="pt-1">
                <span className="text-xs font-black text-[#10B981] tracking-widest">STEP {s.num}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── CTA Footer ─── */
function CTAFooter() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#1B5E20] via-[#0D3B12] to-[#1B5E20] relative overflow-hidden">
      {/* Deco */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
          Built with ❤️ for<br />Indian Farmers
        </h2>
        <p className="text-green-100/70 text-lg mb-8 max-w-xl mx-auto">
          Open source. 6 AI services. 27 screens. 100% serverless. Production deployed on AWS.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="https://github.com/AmanKumarAndro/AiForBharat" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#1B5E20] text-base font-bold rounded-2xl
            hover:bg-green-50 transition-all shadow-xl group">
            <Github className="w-5 h-5" />
            Star on GitHub
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="bg-[#0D3B12] text-green-100/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <LeafIcon className="w-4 h-4 text-green-300" />
          </div>
          <span className="text-sm font-bold text-green-200">KisanVoice AI</span>
        </div>
        <p className="text-xs">© 2026 AI For Bharat · Hackathon Submission</p>
        <a href="https://github.com/AmanKumarAndro/AiForBharat" target="_blank" rel="noreferrer"
          className="text-xs hover:text-green-200 transition-colors flex items-center gap-1.5">
          <Github className="w-3.5 h-3.5" /> AmanKumarAndro/AiForBharat
        </a>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════ */
export default function App() {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      <Hero />
      <VoiceBanner />
      <FeaturesGrid />
      <HowItWorks />
      <ServicesSection />
      <TechStack />
      <Impact />
      <CTAFooter />
      <Footer />
    </div>
  )
}

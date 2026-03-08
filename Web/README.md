# 🌐 KisanVoice AI — Web Landing Page + Admin Dashboard

> Static landing page showcasing the KisanVoice AI platform, with a live admin analytics dashboard.

---

## 🚀 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | React 19 |
| **Build Tool** | Vite 7 |
| **Styling** | Tailwind CSS 4 |
| **Routing** | React Router v7 |
| **Fonts** | Inter + Noto Sans Devanagari (Google Fonts) |

---

## 📁 Project Structure

```
Web/
├── index.html                   # SEO-optimized entry point
├── vite.config.js               # Vite + React + Tailwind config
├── package.json                 # Dependencies
├── public/                      # Static assets
└── src/
    ├── main.jsx                 # App entry + routing (/ and /admin)
    ├── App.jsx                  # Landing page (static showcase)
    ├── index.css                # Global styles
    └── admin/
        ├── AdminGuard.jsx       # Session-based admin authentication
        └── AdminDashboard.jsx   # Live analytics dashboard (6 tabs)
```

---

## 🏠 Landing Page (`/`)

A **static showcase** of the KisanVoice AI platform with animated scroll sections:

| Section | Description |
|---------|-------------|
| **Navbar** | Responsive navigation with scroll toggle |
| **Hero** | Headline, description, CTA buttons |
| **VoiceBanner** | Hindi voice interaction CTA card |
| **FeaturesGrid** | Platform feature cards (Weather, Market, Irrigation, etc.) |
| **ServicesSection** | Backend services architecture showcase |
| **TechStack** | AWS, AI, mobile technology stack display |
| **Impact** | Impact metrics — water savings, yield increase, ROI |
| **HowItWorks** | Step-by-step user journey explanation |
| **Footer** | CTA + site footer |

---

## 📊 Admin Dashboard (`/admin`)

A **live analytics panel** that connects to the Master Dashboard API to display real-time platform metrics.

### 🔑 Admin Access

| Field | Value |
|-------|-------|
| **URL** | `<deployed-url>/admin` |
| **Admin ID** | `admin` |
| **Password** | `kisanvoice2026` |

### Dashboard Tabs

| Tab | Data Displayed |
|-----|----------------|
| **Overview** | Total farmers, voice queries, weather & irrigation alerts, service requests |
| **Voice AI** | Session analytics, top questions asked, average latency |
| **Helping Hand** | Service requests by status/type, providers, treatments, KVK contacts |
| **Irrigation** | Enrolled farmers, crop data, monsoon calendar, water savings, SMS logs |
| **Users** | Cross-system user aggregation with phone-based deduplication |
| **Activity** | Real-time activity feed with configurable limit |

### API Integration

The admin dashboard fetches live data from the **Master Dashboard Analytics API** (`Services/master_dashboard/`):

- **Base URL**: `https://[api-id].execute-api.ap-south-1.amazonaws.com`
- **All endpoints**: GET requests to `/dashboard/*`
- **Error Handling**: Graceful fallback with loading spinners

---

## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📝 Notes

- The **landing page** is fully static — no backend API calls, just a project showcase.
- The **admin dashboard** requires the Master Dashboard API to be deployed for live data.
- Session-based auth (sessionStorage) — login persists only for the current browser session.

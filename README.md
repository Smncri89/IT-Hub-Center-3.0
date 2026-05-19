<div align="center">
<img width="1200" height="475" alt="IT Hub Center Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# IT Hub Center 3.0

**Enterprise IT Service Management — one platform instead of six.**

[![Live Demo](https://img.shields.io/badge/Live-it--hub--center--3--0.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://it-hub-center-3-0.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)]()

</div>

---

## Overview

IT Hub Center is a cloud-based ITSM platform designed for small and mid-size teams that need ticketing, asset tracking, incident management, a knowledge base, license management, and analytics — all in one place.

Built with React 19, TypeScript, Tailwind CSS, and Supabase. Powered by Google Gemini for AI-assisted triage, smart replies, and content generation.

---

## Features

### Core Modules

| Module | Description |
|--------|-------------|
| **Ticketing** | Kanban board with drag & drop, SLA tracking, AI auto-triage, priority escalation |
| **Asset Management** | 25+ asset types, QR code scanning, depreciation tracking, bulk import (CSV/Excel), geolocation map |
| **Incident Management** | Severity-based escalation, live timeline, root cause analysis, AI post-mortem generation |
| **Knowledge Base** | Rich text editor, multi-language (EN/IT/ES), role-targeted articles, AI content generation |
| **License Management** | Seat tracking, cost monitoring, renewal alerts, vendor linking |
| **Vendor Management** | Contracts, interactions, scheduled interventions, comment threads |
| **Reports & Analytics** | 6 interactive dashboards, PDF & Excel export, trend analysis |
| **Onboarding/Offboarding** | Employee lifecycle workflows with checklists and assignments |

### Platform Capabilities

- **AI Assistant** — Gemini-powered chatbot, smart ticket replies, auto-categorization, KB article generation
- **Role-Based Access Control** — Admin, Agent, Member, End User with granular permissions
- **Multi-Language** — English, Italian, Spanish with AI-assisted translation
- **Dark Mode** — Full light/dark theme with system preference detection
- **PWA** — Installable on any device, offline support, push notifications
- **Real-Time** — Live updates via Supabase Realtime subscriptions
- **Asset Geo-Map** — Interactive Leaflet map with asset locations
- **QR Scanner** — In-app QR code scanning for asset lookup
- **Command Palette** — Quick navigation with keyboard shortcuts
- **Bulk Operations** — CSV/Excel import for assets, users, and licenses

### Security & Compliance

| Standard | Implementation |
|----------|---------------|
| **GDPR** | EU data hosting (Frankfurt), data export, right to erasure |
| **NIS2** | Strong password policy (12+ chars), account lockout, audit trail, log retention (365 days), CSP headers |
| **ISO 27001** | Supabase SOC 2 Type II & ISO 27001 certified infrastructure |
| **OWASP** | Content Security Policy, XSS prevention, input validation |
| **Encryption** | AES-256 at rest, TLS 1.3 in transit |
| **Access Control** | Row-Level Security (RLS), RBAC, 2FA (TOTP) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.8, Tailwind CSS 3 |
| Build | Vite 7 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL 17 + Auth + Storage + Edge Functions + Realtime) |
| AI | Google Gemini 2.5 Flash |
| Charts | Recharts |
| Maps | Leaflet |
| QR | jsQR (scan), qrcode (generate) |
| Export | jsPDF, html2canvas, xlsx, PapaParse |
| Auth | Supabase Auth + TOTP 2FA (otpauth) |
| Hosting | Vercel (EU edge) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (for AI features)

### Installation

```bash
git clone https://github.com/your-username/IT-Hub-Center-3.0.git
cd IT-Hub-Center-3.0
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
├── components/           # React components organized by feature
│   ├── assets/           # Asset management (list, detail, forms)
│   ├── incidents/        # Incident management (timeline, RCA)
│   ├── kb/               # Knowledge base (editor, viewer)
│   ├── legal/            # Privacy Policy, Terms of Service
│   ├── licenses/         # License tracking
│   ├── locations/        # Company locations
│   ├── maps/             # Asset geolocation (Leaflet)
│   ├── onboarding/       # Onboarding/offboarding workflows
│   ├── pulse/            # Team activity & sessions
│   ├── reports/          # Analytics dashboards
│   ├── settings/         # Profile, security, billing, users, integrations
│   ├── tickets/          # Ticket management (Kanban, list, detail)
│   └── vendors/          # Vendor management
├── contexts/             # Auth, Data, Localization, Notifications, PWA
├── hooks/                # Custom React hooks
├── services/             # Supabase client, API, auth, AI, audit
├── utils/                # Localization, mappers, depreciation, event bus
├── types.ts              # TypeScript type definitions
└── constants.tsx          # Icons, roles, permissions, app config

supabase/
└── functions/            # Edge Functions (invite-user, etc.)
```

---

## Database

PostgreSQL 17 hosted on Supabase (EU - Frankfurt). Key tables:

- `profiles` — User accounts with roles and preferences
- `tickets` — Support tickets with SLA tracking
- `assets` — Hardware/software inventory
- `licenses` — Software license management
- `incidents` — Incident records with timeline
- `kb_articles` — Knowledge base content
- `vendors` — Vendor directory
- `audit_logs` — Security audit trail
- `onboarding_processes` — Employee lifecycle workflows
- `organization_invites` — User invitations

Row-Level Security (RLS) is enabled on all tables.

---

## Deployment

The app is deployed on **Vercel** with automatic deployments on push to `main`.

```bash
npm run build    # Produces dist/
```

Environment variables must be configured in the Vercel dashboard.

---

## Screenshots

<details>
<summary>Click to expand</summary>

> Screenshots coming soon. Visit the [live demo](https://it-hub-center-3-0.vercel.app) to explore the platform.

</details>

---

## Roadmap

- [ ] SSO / SAML integration
- [ ] Real-time anomaly detection (SIEM)
- [ ] Incident reporting to authorities (NIS2 24h/72h CSIRT)
- [ ] IP restriction & geo-blocking
- [ ] Password history tracking
- [ ] 2FA enforcement for admin roles
- [ ] Immutable audit logs
- [ ] Webhook integrations (Slack, Teams, PagerDuty)
- [ ] Public API with rate limiting

---

## License

Private — All rights reserved.

&copy; 2026 IT Hub Center.
</div>

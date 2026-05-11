<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# IT Hub Center 3.0

A comprehensive IT Service Management (ITSM) platform built with React, TypeScript, and Supabase.

## Features

- **Ticketing System** - Create, assign, track, and resolve IT support tickets with SLA tracking
- **Asset Management** - Track hardware/software assets with lifecycle management, depreciation, and QR codes
- **License Management** - Monitor software licenses, seat assignments, and expiration alerts
- **Incident Management** - Log and track incidents with timeline, root cause analysis, and AI-powered post-mortems
- **Knowledge Base** - Multi-language article editor with AI content generation
- **Vendor Management** - Track vendors, contracts, interactions, and scheduled interventions
- **Asset Map** - Geolocation view of all assets via Leaflet
- **Onboarding/Offboarding** - Employee lifecycle workflows
- **Reports & Analytics** - Charts, PDF export, and Excel export
- **AI Assistant** - Gemini-powered chatbot, smart ticket replies, and auto-triage
- **Role-Based Access** - Admin, Agent, Member, End User roles with granular permissions
- **Multi-Language** - English, Italian, Spanish with AI translation
- **Dark Mode** - Full dark/light theme support
- **PWA** - Installable progressive web app with offline support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.8, Tailwind CSS 3 |
| Build | Vite 7 |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| AI | Google Gemini 2.5 Flash |
| Charts | Recharts |
| Maps | Leaflet |
| Export | jsPDF, html2canvas, xlsx |

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Project Structure

```
src/
  components/       # React components organized by feature
    assets/         # Asset management views
    incidents/      # Incident management views
    kb/             # Knowledge base views
    licenses/       # License management views
    locations/      # Company locations
    maps/           # Asset geolocation map
    onboarding/     # Onboarding/offboarding workflows
    pulse/          # Team session/pulse view
    reports/        # Reports & analytics
    settings/       # App settings (profile, security, integrations, etc.)
    tickets/        # Ticket management views
    vendors/        # Vendor management views
  contexts/         # React context providers (Auth, Data, Localization, Notifications, PWA)
  hooks/            # Custom React hooks
  services/         # API, Auth, Supabase client, AI services
  utils/            # Mappers, localization, depreciation calculator, event bus
  types.ts          # TypeScript type definitions
  constants.tsx     # App constants, icons, role permissions
```

## License

Private - All rights reserved.

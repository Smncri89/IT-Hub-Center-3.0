# IT Hub Center 3.0 — Documentazione Completa per NotebookLM

**Versione**: 3.1.0  
**Ultimo aggiornamento**: 15 Maggio 2026  
**Sviluppatore**: Ciro Simione (BHBlasted S.r.l.)  
**URL produzione**: Vercel (custom domain in configurazione)  
**Stack**: React 19 + TypeScript + Vite + Supabase + Tailwind CSS (CDN)

---

## 1. Cos'e IT Hub Center

IT Hub Center e una piattaforma SaaS multi-tenant per la gestione delle operazioni IT aziendali. E progettata per team IT di qualsiasi dimensione, con supporto per ticketing, gestione asset, licenze software, incident management, knowledge base, onboarding dipendenti, gestione fornitori e molto altro.

L'applicazione e una Progressive Web App (PWA) installabile su desktop, tablet e smartphone, con supporto offline e notifiche in-app. Supporta tre lingue (Inglese, Italiano, Spagnolo) e quattro ruoli utente con permessi granulari.

---

## 2. Architettura Tecnica

### Frontend
- **Framework**: React 19.2.0 con TypeScript 5.8.2
- **Build tool**: Vite 7.2.4
- **Routing**: React Router v7 con HashRouter per compatibilita SPA
- **CSS**: Tailwind CSS caricato via CDN (nessun PostCSS build-time)
- **Grafici**: Recharts 3.3
- **Icone**: Lucide React + SVG custom inline (60+ icone in constants.tsx)
- **Export**: XLSX per Excel, jsPDF + html2canvas per PDF, PapaParse per CSV
- **QR Code**: jsqr per lettura, qrcode per generazione
- **2FA**: otpauth (TOTP compatibile con Google Authenticator/Authy)

### Backend
- **Database**: Supabase (PostgreSQL) con Row Level Security (RLS)
- **Autenticazione**: Supabase Auth (email/password + 2FA TOTP)
- **Storage**: Supabase Storage per avatar e documenti
- **Edge Functions**: Deno runtime su Supabase per logica server-side
- **Real-time**: PostgreSQL LISTEN/NOTIFY via Supabase channels

### Infrastruttura
- **Hosting**: Vercel (deploy automatico da GitHub)
- **PWA**: Service Worker con strategia network-first, cache v3.8
- **Pagamenti**: Stripe (Checkout, Billing Portal, Webhooks)

---

## 3. Struttura del Progetto

```
src/
  App.tsx                    — Routing principale con protezione ruoli
  index.tsx                  — Entry point React DOM
  constants.tsx              — Costanti globali, icone, configurazioni, permessi
  types.ts                   — Definizioni TypeScript per tutto il progetto

  components/
    Layout.tsx               — Layout wrapper (sidebar + header + contenuto)
    Sidebar.tsx              — Menu navigazione laterale (collassabile, responsive)
    Header.tsx               — Barra superiore con ricerca, notifiche, profilo
    Dashboard.tsx            — Dashboard con KPI, grafici, azioni rapide
    Login.tsx                — Pagina di login con supporto 2FA
    Register.tsx             — Registrazione utente
    ForgotPassword.tsx       — Recupero password
    UpdatePassword.tsx       — Reset password via email
    LandingPage.tsx          — Pagina pubblica di marketing
    AIAssistant.tsx          — Chat AI (Claude/Gemini)
    CommandPalette.tsx       — Ricerca globale con scorciatoie tastiera
    Notifications.tsx        — Centro notifiche (bottom sheet su mobile)
    PWAInstallBanner.tsx     — Banner installazione PWA
    TrialBanner.tsx          — Banner stato abbonamento/trial
    ErrorBoundary.tsx        — Gestione errori globale con auto-reload chunk
    ImportModal.tsx          — Importazione dati bulk (CSV/Excel)
    QRScannerModal.tsx       — Scanner QR code per asset

    tickets/
      TicketsList.tsx        — Lista ticket con vista board Kanban e tabella
      TicketDetail.tsx       — Dettaglio ticket con commenti e timeline

    assets/
      AssetsList.tsx         — Lista asset con filtri avanzati
      AssetDetail.tsx        — Dettaglio asset con storico e ticket collegati
      AddAsset.tsx           — Creazione/modifica asset

    licenses/
      LicensesList.tsx       — Gestione licenze software
      LicenseDetail.tsx      — Dettaglio licenza con assegnazioni
      LicenseFormModal.tsx   — Form creazione/modifica licenza

    incidents/
      IncidentsList.tsx      — Log incidenti con severita e stato
      IncidentDetail.tsx     — Dettaglio incidente con timeline e analisi

    kb/
      KnowledgeBase.tsx      — Articoli knowledge base
      KBArticleDetail.tsx    — Lettura articolo
      KBArticleEditor.tsx    — Editor articoli (Admin/Agent)

    reports/
      Reports.tsx            — 6 viste analitiche con grafici interattivi

    settings/
      Settings.tsx           — Pagina settings con tab laterali
      ProfileSettings.tsx    — Profilo utente, avatar, firma email
      SecuritySettings.tsx   — Password, 2FA, sessioni
      UsersSettings.tsx      — Gestione utenti (solo Admin)
      IntegrationsSettings.tsx — Integrazioni API terze parti
      BillingSettings.tsx    — Abbonamento e fatturazione Stripe
      AuditLogSettings.tsx   — Log audit attivita
      BackupSettings.tsx     — Backup e ripristino dati
      PolicySettings.tsx     — Policy aziendali
      SLAPolicySettings.tsx  — Configurazione SLA per priorita
      ApplicationSettings.tsx — Configurazione app generale
      AppearanceSettings.tsx — Tema e aspetto
      LanguageSettings.tsx   — Preferenze lingua
      NotificationSettings.tsx — Preferenze notifiche

    vendors/
      VendorsList.tsx        — Gestione fornitori con contratti e interazioni

    locations/
      LocationsList.tsx      — Sedi aziendali

    onboarding/
      OnboardingList.tsx     — Lista processi onboarding/offboarding
      OnboardingDetail.tsx   — Dettaglio workflow onboarding

    maps/
      AssetMap.tsx           — Mappa geolocalizzazione asset

    pulse/
      Pulse.tsx              — Monitoraggio sessioni utente e presenza

    legal/
      PrivacyPolicy.tsx      — Privacy policy GDPR-compliant
      TermsOfService.tsx     — Termini di servizio

  contexts/
    AuthContext.tsx           — Stato autenticazione (login, logout, 2FA, registrazione)
    DataContext.tsx           — Stato dati globale (ticket, asset, licenze, incidenti, articoli, utenti)
    LocalizationContext.tsx   — Supporto multilingua (EN, IT, ES)
    NotificationsContext.tsx  — Notifiche in-app
    PWAInstallContext.tsx     — Stato installazione PWA

  hooks/
    useAuth.ts               — Hook per accedere al contesto autenticazione
    useData.ts               — Hook per accedere ai dati globali
    useLocalization.ts       — Hook per traduzioni: t('chiave')
    useNotifications.ts      — Hook per gestire notifiche
    useDebounce.ts           — Hook per debounce input
    useAnimatedModal.ts      — Hook per animazioni modali

  services/
    supabaseClient.js        — Inizializzazione client Supabase
    api.ts                   — Tutte le chiamate REST API (CRUD per ogni entita)
    auth.ts                  — Logica autenticazione (login, signup, 2FA, reset password)
    claudeService.ts         — Integrazione Claude AI via Edge Function
    auditService.ts          — Logging audit (localStorage + DB)
    locationsService.ts      — CRUD sedi
    onboardingService.ts     — Logica workflow onboarding
    webhookSimulator.ts      — Simulazione webhook per test
    mappers.ts               — Trasformazione dati Supabase → tipi TypeScript
    depreciation.ts          — Calcolo ammortamento asset
    eventBus.ts              — Event emitter per comunicazione cross-component

  utils/
    localization.ts          — 400+ chiavi di traduzione in 3 lingue

supabase/functions/
  claude/index.ts            — Proxy AI Claude (ANTHROPIC_API_KEY server-side)
  invite-user/index.ts       — Invio email invito utenti
  create-checkout/index.ts   — Creazione sessione Stripe Checkout
  create-portal/index.ts     — Apertura Stripe Billing Portal
  stripe-webhook/index.ts    — Gestione eventi Stripe (abbonamenti, pagamenti)
```

---

## 4. Moduli Funzionali

### 4.1 Dashboard
- KPI in tempo reale: ticket aperti, asset totali, licenze in scadenza, incidenti attivi
- Grafici interattivi (pie chart, bar chart)
- Azioni rapide personalizzabili dall'admin
- Widget configurabili con drag-and-drop

### 4.2 Ticketing
- Vista Kanban (board con colonne per stato) e vista tabella
- Priorita: Urgent, High, Medium, Low
- Categorie: Hardware, Software, Network, Access, Other (con sottocategorie)
- SLA automatico con timer e scadenze
- Triage automatico AI
- Commenti con note interne (visibili solo agli agenti)
- Allegati file
- Collegamento asset

### 4.3 Gestione Asset
- 25+ tipi di asset con campi specifici per tipo
- Stati: In Use, Ready to Deploy, Pending, Archived, Broken, Lost/Stolen, Out for Diagnostics, Out for Repair
- Check-in / Check-out con storico
- Scanner QR code per operazioni rapide
- Calcolo ammortamento automatico
- Geolocalizzazione su mappa
- Libreria immagini automatica (500+ keyword → immagini Unsplash)
- Campi specifici smartphone: numero telefono, operatore, SIM serial, eSIM
- Import/Export CSV e Excel

### 4.4 Licenze Software
- Tracking posti totali vs assegnati
- Assegnazione licenze a utenti
- Date acquisto e scadenza
- Costo totale e per posto
- Collegamento fornitore
- Alert scadenza

### 4.5 Incident Management
- Severita: Critical, High, Medium, Low
- Stati: Investigating, Identified, Monitoring, Resolved
- Timeline con aggiornamenti cronologici
- Analisi impatto e root cause
- Soluzione documentata
- Tag per categorizzazione

### 4.6 Knowledge Base
- Articoli multilingua (contenuto in EN, IT, ES)
- Categorie e tag
- Audience targeting per ruolo (Admin, Agent, Member, End User)
- Editor ricco per Admin/Agent
- Ricerca full-text

### 4.7 Report e Analytics
- 6 viste analitiche:
  1. Panoramica ticket (volume, trend, distribuzione)
  2. Performance SLA (rispetto tempi, violazioni)
  3. Asset analytics (distribuzione tipo, stato, valore)
  4. Licenze (utilizzo, costi, scadenze)
  5. Incidenti (trend, MTTR, distribuzione severita)
  6. Team performance (ticket per agente, tempi risposta)
- Export PDF e Excel

### 4.8 Gestione Fornitori
- Anagrafica fornitori con contatti
- Contratti con date inizio/fine e documenti
- Interazioni/interventi con thread di commenti
- Performance: tempo medio risposta, numero interventi
- Tag e note

### 4.9 Sedi Aziendali
- Lista sedi con indirizzo
- Collegamento ad asset per sede
- Gestione multi-sede

### 4.10 Onboarding / Offboarding
- Workflow strutturati per nuovi dipendenti
- Checklist personalizzabili
- Assegnazione asset e licenze
- Processo offboarding con recupero materiali
- Solo Admin/Agent

### 4.11 Mappa Asset
- Visualizzazione geolocalizzata degli asset
- Coordinate GPS per ogni asset
- Filtri per tipo e stato

### 4.12 Pulse (Sessioni)
- Monitoraggio utenti online
- Stato presenza: Online, Away, Do Not Disturb, Invisible
- Messaggi di stato personalizzati

---

## 5. Sistema di Ruoli e Permessi

### Ruoli Disponibili
| Ruolo | Descrizione |
|-------|-------------|
| **Admin** | Accesso completo a tutte le funzionalita |
| **Agent** | Come Admin (personale supporto IT) |
| **Member** | Accesso limitato a funzionalita collaborative |
| **End User** | Solo ticket e knowledge base in lettura |

### Matrice Permessi

| Funzionalita | Admin | Agent | Member | End User |
|--------------|-------|-------|--------|----------|
| Dashboard | Si | Si | Si | Si |
| Ticket (CRUD) | Si | Si | Si | Solo lettura |
| Asset | Si | Si | Si | No |
| Licenze | Si | Si | Si | No |
| Incidenti | Si | Si | Si | No |
| Sessioni/Pulse | Si | Si | No | No |
| Report | Si | Si | Si | No |
| Knowledge Base | Si (edit) | Si (edit) | Si (read) | Si (read) |
| Settings completi | Si | Parziale | Parziale | Solo profilo |
| Fornitori | Si | Si | No | No |
| Mappa | Si | Si | Si | No |
| Sedi | Si | Si | No | No |
| Onboarding | Si | Si | No | No |
| Gestione utenti | Si | No | No | No |
| Billing | Si | No | No | No |
| Audit Log | Si | No | No | No |
| Backup | Si | No | No | No |

---

## 6. Sistema di Localizzazione

### Lingue Supportate
1. **Inglese (en)** — Default
2. **Italiano (it)** — Traduzione completa
3. **Spagnolo (es)** — Traduzione completa

### Implementazione
- 400+ chiavi di traduzione in `src/utils/localization.ts`
- Hook `useLocalization()` restituisce `t()` per tradurre e `setLanguage()` per cambiare lingua
- Articoli KB hanno contenuto separato per ogni lingua
- Selettore lingua nel sidebar

---

## 7. Autenticazione e Sicurezza

### Flusso di Autenticazione
1. Login con email/password via Supabase Auth
2. Se 2FA abilitato: richiesta codice TOTP
3. JWT token gestito automaticamente da Supabase
4. Timeout inattivita: 1 ora (auto-logout)
5. Retry automatico su errori fetch profilo (3 tentativi, backoff esponenziale)

### Sicurezza
- **RLS (Row Level Security)**: Tutte le tabelle protette a livello database
- **2FA TOTP**: Compatibile con Google Authenticator e Authy
- **API Keys**: Ruotate e protette
- **Edge Functions**: Logica sensibile eseguita server-side (chiavi Stripe, API Claude)
- **CORS**: Headers configurati su tutte le Edge Functions

---

## 8. PWA e Mobile

### Caratteristiche PWA
- Installabile su iOS, Android, Windows, macOS
- Modalita standalone (senza barra browser)
- Service Worker con cache network-first
- Funzionamento offline con dati cached
- Banner installazione automatico

### Ottimizzazione Mobile
- Layout completamente responsive (breakpoint 768px per mobile, 1024px per tablet)
- Hook `useIsMobile()` con `window.innerWidth < 768`
- Bottom sheet per notifiche e menu su mobile
- Touch scrolling ottimizzato per board Kanban
- Hamburger menu per sidebar su dispositivi < 1024px
- Header compatto (56px mobile vs 80px desktop)

### Gestione Chunk Errors
- `lazyRetry()`: wrapper per lazy import con auto-reload su errore chunk
- `ErrorBoundary`: rileva errori chunk e mostra pulsante "Ricarica App"
- Previene loop infiniti con sessionStorage flag

---

## 9. Integrazioni AI

### Gemini 2.5 Flash
- Elaborazione locale via `@google/genai`
- Analisi forza password
- Triage automatico ticket
- Suggerimenti KB

### Claude AI
- Server-side via Supabase Edge Function
- Chiave ANTHROPIC_API_KEY protetta lato server
- Chat conversazionale nell'AIAssistant

---

## 10. Billing e Monetizzazione

### Piani Tariffari
| Piano | Prezzo | Utenti | Asset | Caratteristiche |
|-------|--------|--------|-------|-----------------|
| **Starter (Free)** | Gratis | 5 | 50 | Funzionalita base |
| **Pro** | 29 EUR/mese | Illimitati | Illimitati | Tutte le funzionalita |
| **Enterprise** | Custom | Illimitati | Illimitati | SLA dedicato, supporto prioritario |

### Integrazione Stripe
- **create-checkout**: Crea sessione di pagamento Stripe Checkout
- **create-portal**: Apre il Billing Portal per gestione abbonamento
- **stripe-webhook**: Gestisce eventi: checkout completato, abbonamento aggiornato/cancellato, pagamento fallito
- Tabella `organizations` con campi: `stripe_customer_id`, `stripe_subscription_id`, `billing_email`, `plan`, `max_users`, `max_assets`, `trial_starts_at`, `trial_ends_at`

### Trial
- Trial gratuito con countdown giorni
- Banner visibile in app con giorni rimanenti
- Upgrade tramite BillingSettings

---

## 11. Database (Supabase PostgreSQL)

### Tabelle Principali
- **profiles**: Utenti con ruolo, avatar, impostazioni personali, 2FA
- **organizations**: Organizzazioni multi-tenant con piano e Stripe
- **tickets**: Ticket di supporto con SLA, priorita, categorie
- **comments**: Commenti su ticket (pubblici e note interne)
- **assets**: Inventario asset IT con tipo, stato, posizione, fornitore
- **licenses**: Licenze software con posti e scadenze
- **license_assignments**: Assegnazione licenze a utenti
- **incidents**: Incidenti con severita, timeline, analisi
- **kb_articles**: Articoli knowledge base multilingua
- **vendors**: Fornitori con contratti e interazioni
- **locations**: Sedi aziendali
- **sla_policies**: Configurazione SLA per priorita ticket
- **integrations**: Integrazioni API terze parti
- **notifications**: Notifiche in-app

### Real-time
- Sottoscrizione a tutti i cambiamenti tabelle principali
- Aggiornamento automatico UI su INSERT/UPDATE/DELETE
- Canali Supabase per notifiche live

---

## 12. Export e Import

### Formati Supportati
- **CSV**: Import/export via PapaParse
- **Excel (.xlsx)**: Import/export via XLSX library
- **PDF**: Generazione report via jsPDF + html2canvas
- **QR Code**: Generazione e scansione per asset

### Funzionalita Import
- Modal dedicato per upload file
- Mapping automatico colonne
- Validazione dati pre-import
- Preview dati prima dell'importazione

---

## 13. Configurazione e Deploy

### Variabili d'Ambiente (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_STRIPE_PUBLIC_KEY=pk_live_your-stripe-public-key
```

### Secrets Supabase (Edge Functions)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
```

### Deploy
1. Push su GitHub → deploy automatico Vercel
2. Edge Functions: `supabase functions deploy <nome-funzione>`
3. Migrazioni DB: via Supabase MCP o dashboard

---

## 14. Pagine Pubbliche

### Landing Page (`/`)
- Hero section con CTA "Get Started Free"
- 6 feature highlight con icone
- 3 piani tariffari con confronto feature
- FAQ accordion (6 domande)
- CTA finale
- Footer con link legali
- Navbar sticky con link Login/Register

### Privacy Policy (`/privacy`)
- GDPR-compliant
- Data controller: BHBlasted S.r.l.
- 6 categorie dati raccolti
- 4 basi legali GDPR Art. 6
- Tabella periodi di conservazione
- Diritti completi GDPR
- Cookie policy
- Servizi terzi (Supabase, Stripe, Google)
- Contatto DPO

### Terms of Service (`/terms`)
- Descrizione servizio
- Termini account (registrazione 16+, sicurezza, terminazione)
- Termini pagamento (piani, fatturazione, rimborso 14 giorni)
- Politica uso accettabile (9 attivita proibite)
- Proprieta intellettuale
- Limitazione responsabilita
- Legge italiana applicabile

---

## 15. Tipi TypeScript Principali

```typescript
enum Role { Admin, Agent, Member, EndUser }
enum TicketStatus { Open, InProgress, Resolved, Closed }
enum TicketPriority { Urgent, High, Medium, Low }
type AssetStatus = 'In Use' | 'Ready to Deploy' | 'Pending' | 'Archived' | 'Broken - Not Fixable' | 'Lost/Stolen' | 'Out for Diagnostics' | 'Out for Repair'
type PlanTier = 'free' | 'pro' | 'enterprise'
enum Language { en, it, es }
enum UserStatus { Online, Away, DoNotDisturb, Invisible }

interface User { id, name, email, role, company, avatarUrl, 2FA, statusMessage, signature, preferences }
interface Ticket { id, subject, description, status, priority, category, requester, assignee, comments, asset, SLA, attachments }
interface Asset { id, name, assetTag, type, model, status, purchaseDate, cost, warranty, assignedTo, location, GPS, smartphone fields }
interface License { id, name, software, totalSeats, assignments, dates, costs, vendor }
interface Incident { id, title, description, status, severity, priority, category, reporter, assignee, solution, analysis, timeline }
interface KBArticle { id, title[multilingual], content[multilingual], category, author, tags, audience }
interface Vendor { id, name, contacts, contract, performance, documents }
interface Organization { id, name, slug, plan, stripe fields, limits, trial, is_active }
```

---

## 16. Statistiche Progetto

- **Componenti React**: 85+ file TSX
- **Lingue UI**: 3 (EN, IT, ES)
- **Chiavi traduzione**: 400+
- **Ruoli utente**: 4
- **Tipi asset**: 25+
- **Categorie ticket**: 5 principali + 15 sottocategorie
- **Viste report**: 6
- **Icone SVG**: 60+
- **Immagini asset library**: 500+ keyword
- **Edge Functions**: 5 (Claude AI, inviti, checkout, portal, webhook)
- **Integrazioni**: Supabase, Stripe, Gemini AI, Claude AI

---

*Documento generato automaticamente il 15 Maggio 2026 per uso con Google NotebookLM.*

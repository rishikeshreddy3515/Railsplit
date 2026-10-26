# RailSplit 🚄

> **Same-Train Indian Railways Split-Ticketing Finder**  
> Powered by Hop-Constrained Dijkstra's Algorithm (Stop-State DAG) with 0-Transfer Invariance and Hybrid Quota Protection.

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Jest Tests](https://img.shields.io/badge/Jest-17%20Passed-brightgreen?logo=jest)](https://jestjs.io/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 💡 What is RailSplit?

When long-distance Indian Railways (IRCTC) trains show **Waitlisted (GNWL)** end-to-end, major intermediate commercial junctions (e.g. Vadodara, Surat, Pune, Ahmedabad) often have plenty of **Confirmed Seats (RLWL / Pooled Quota)** reserved for intermediate journeys.

**RailSplit** automatically traverses the train's route graph and pairs these separate station-quota berths into one seamless journey on the **exact same train rake** — so passengers never risk a missed connection!

```
Traditional Booking:
Jodhpur (JU) ───────────────────────────────────────────► Vijayawada (BZA)
Status: GNWL 112 (Waitlisted / High risk of cancellation)

RailSplit Solution:
Jodhpur (JU) ──────────────► Vadodara (BRC) ────────────► Vijayawada (BZA)
Ticket 1: AVL 28 (Confirmed)            Ticket 2: AVL 26 (Confirmed)
Transfer Risk: Strictly 0 min (Same train rake — simple berth switch at BRC)
```

---

## ⚡ Core Architecture & Graph Theory

### 1. Hop-Constrained Stop-State DAG
For a train route with stops $S = [s_0, s_1, \dots, s_n]$:
* **State Graph Formulation**: Nodes are tuples `(stationCode, hops)` where `hops` $\in \{0, 1, 2\}$.
* **Edge Relaxation**:
  * 1-Hop Direct: `(Origin, 0) → (Destination, 1)`
  * 2-Hop Leg 1: `(Origin, 0) → (Junction, 1)`
  * 2-Hop Leg 2: `(Junction, 1) → (Destination, 2)`
* **Cost Function**:
  $$\text{Cost}(u, v) = \text{Fare}(u, v) + \text{Penalty}(\text{Status})$$
  $$\text{Penalty} = \begin{cases} 0 & \text{CONFIRMED} \\ 500 & \text{RAC} \\ 10,000 & \text{WAITLIST} \\ \infty & \text{PRUNED} \end{cases}$$

### 2. Hybrid Data Provider & Quota Protection
* **Multi-Tier TTL Cache**: 2-hour in-memory cache preserves external railway API limits.
* **Automatic Fallback**: If an external provider responds with `HTTP 429 Too Many Requests` (e.g. RailRadar free limit reached), the hybrid engine automatically falls back to the deterministic local timetable engine with zero user downtime.
* **Live Telemetry & Diagnostics**: Real-time attempt counters, response status probes, and live key switcher in the UI header.

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/railsplit.git
cd railsplit
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Optional: add your `RAIL_API_KEY` for live network integration. Without a key, RailSplit runs in full High-Fidelity Local Engine mode with zero setup required!)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
npm test
```
Runs all 17 unit and graph theory validation tests.

---

## 🌐 Deploy to Web in 2 Minutes

The easiest way to deploy RailSplit is using **Vercel**:

### Option A: 1-Click Vercel Web Deploy
1. Push this repository to your GitHub account (see instructions below).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `railsplit` GitHub repository.
4. Leave build settings as default (`next build`).
5. *(Optional)* Add `RAIL_API_KEY` in Environment Variables.
6. Click **Deploy**! Your site is live on a `.vercel.app` URL.

### Option B: Deploy via Vercel CLI
```bash
npx vercel
```

---

## 📂 Project Structure

```
railsplit/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── provider-status/  # Real-time API diagnostics & key probe
│   │   │   ├── search/           # Dijkstra search & split route solver
│   │   │   └── stations/         # Station directory & autocomplete
│   │   ├── layout.tsx            # Global metadata & root layout
│   │   └── page.tsx              # Application entrypoint
│   ├── components/
│   │   ├── BrandLogo.tsx         # RailSplit squircle brand emblem
│   │   ├── HeaderNavbar.tsx      # Dark navbar with API telemetry modal
│   │   ├── HeroSearch.tsx        # Segmented search bar & quick date pills
│   │   ├── LandingSections.tsx   # Three steps & comparative showcase
│   │   ├── SearchResultsView.tsx # Dynamic direct & split listing
│   │   └── JourneyDetailView.tsx # Vertical stoppage timeline & IRCTC booking
│   └── lib/
│       ├── dijkstra-split.ts     # Same-train Dijkstra algorithm & tracer
│       ├── hybrid-provider.ts    # API adapter with 429 quota protection
│       ├── mock-data.ts          # Authentic IRCTC stations & synthetic generator
│       ├── split-search.ts       # Split-search orchestration engine
│       └── utils.ts              # Mathematical duration & transfer calculators
├── jest.config.js
└── package.json
```

---

## 📄 License
MIT License. Built for seamless railway split-ticketing discovery.

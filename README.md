# DateInIndia

India's trust-first dating website — Aadhaar-style verification, free messaging, no fake profiles.

This repo contains a working MVP:

- `backend/` — Node.js + Express + TypeScript + Prisma (SQLite for local dev) + Socket.io
- `frontend/` — React + TypeScript + Vite + Tailwind CSS

## Quick start

```bash
# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev          # http://localhost:4000

# Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

Open http://localhost:5173.

## What's real vs. mocked

Every paid third-party integration is behind a `MOCK_*` env flag in `backend/.env`, defaulting to **mock/dev mode** since this environment has no live API credentials. Application logic (auth, trust scoring, matching, chat safety filtering, premium gating, admin moderation) is fully implemented and runs end-to-end — only the *external provider call* is swapped for a local fake.

| Feature | Mock mode (default) | Real mode |
|---|---|---|
| Phone OTP | OTP code is generated server-side, logged to console, and returned in the API response (so you can log in without an SMS) | Set `MOCK_OTP=false` + `MSG91_*` keys to send real SMS via MSG91 |
| Aadhaar verification | Fake "DigiLocker" flow — user confirms name/DOB on a form, instantly marked `aadhaar_verified` | Set `MOCK_AADHAAR=false` + `SETU_*` keys for real DigiLocker OAuth via Setu.co |
| Selfie liveness | Uploaded selfie is auto-approved | Set `MOCK_SELFIE=false` + `HYPERVERGE_*` keys for real liveness/face-match |
| Payments / Premium | "Fake checkout" endpoint instantly marks the user premium, no money moves | Set `MOCK_PAYMENTS=false` + `RAZORPAY_*` keys for real Razorpay orders/webhooks |
| AI bio suggestions / icebreakers / wingman | Simple rule-based fallback (no API key needed) | Set `OPENAI_API_KEY` to use GPT-4o-backed suggestions |

We never store actual Aadhaar numbers or documents — only boolean `aadhaar_verified` status, per DPDP Act data-minimization requirements.

## Implemented features

- Phone OTP signup/login, JWT access + refresh tokens
- Full profile CRUD (basic info, relationship goals, prompts, interests, photo upload)
- Browse page: filters (age, city/state, looking-for, religion, verified-only, online), sort, pagination
- Trust Score engine: phone +10, Aadhaar +30, selfie +20, profile completeness +10, account age +10, ratings up to +15, zero reports +5 (max 100); harassment report −30; scam/money-request detection → instant ban
- Verification hub (phone / Aadhaar / selfie, mocked as above)
- Likes, super likes, matches, daily like limits by verification tier, "who liked you" (blurred for free users)
- Real-time chat (Socket.io): read receipts, typing indicator, online status, regex-based scam/safety filter (phone numbers, UPI IDs, off-platform redirects, money requests, crypto, fake investment returns), 7-day contact-info lock per match, strike system
- Reporting + blocking
- Premium tiers (Basic/Standard/Trust) gating likes, who-liked-you, filters, badges
- Admin dashboard (shared-secret auth): users, reports queue, verification queue, live transparency stats
- Public `/trust` transparency report page, `/safety` tips, `/privacy`, `/terms`

## Future work (needs real credentials / business approvals)

- MSG91 sender ID (TRAI approval), Setu DigiLocker requester approval (MeitY), HyperVerge production account, Razorpay live mode + GST invoicing
- OpenAI-backed compatibility embeddings (pgvector), AI Wingman, date-planner
- Community chat rooms, voice introductions, reverse image search, device fingerprinting, CSAM detection, automated monthly report job
- Switch `DATABASE_URL` from SQLite to Postgres (Supabase) for production; enable Row Level Security

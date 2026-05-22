# Hired.jo — Business Plan
**Version:** 1.0  
**Date:** May 2026  
**Market:** Jordan (primary) → Arab world (expansion)  
**Live site:** hiredjo.com

---

## 1. Vision

Hired.jo is the AI career copilot for Arab graduates. We help fresh graduates, students, and career-switchers build professional CVs, find real jobs, and get discovered by recruiters — all in one place, built for the Jordan market.

**Mission:** Get every Jordanian graduate hired faster.

---

## 2. Target Users

| Segment | Description | Pain Point |
|---------|-------------|------------|
| Fresh graduates | Just finished university, 0–1 year experience | Don't know how to write a CV, don't know what jobs to apply for |
| University students | Still studying, looking for internships | No experience, scared to start |
| Career switchers | 2–5 years experience, want a new job | CV is outdated, don't know their market value |
| Remote job seekers | Any level, want international/remote work | Don't know how to position themselves globally |
| Co-founder seekers | Builders looking for partners | No platform for Jordan specifically |
| Companies & recruiters | Want to hire Jordanian talent | Expensive job boards, low quality candidates |

**Primary focus now:** Fresh graduates + students (largest segment, highest need, most viral word-of-mouth on campus).

---

## 3. Pricing Model

### Philosophy
- Jordan is not the US. Pricing must feel accessible to a graduate who earns 300–600 JOD/month.
- Free tier gets them hooked. Limits make them pay. One-time purchases capture non-subscribers.
- One free trial per account (email) + one per payment method (card) — enforced via Supabase + Paddle fraud detection.

### Tiers

| Feature | 🆓 Free | ⭐ Pro — 6 JOD/mo | 👑 Hired — 15 JOD/mo |
|---------|---------|-------------------|----------------------|
| CV builds | 1 lifetime | 5/month | 20/month |
| AI section edits | 2/month | 15/month | 40/month |
| Cover letter generation | 1 lifetime | 10/month | 30/month |
| CV Roast | ✅ | ✅ | ✅ |
| Job matching | ✅ Basic | ✅ Full | ✅ Full + priority |
| Saved jobs | ✅ | ✅ | ✅ |
| Recruiter contact | ✅ | ✅ | ✅ |
| Talent marketplace visibility | Normal | Mid boost | Top boost |
| Co-founder visibility | Normal | Mid boost | Top boost |
| CV templates | 1 default | 3 templates | All templates |
| Paid courses access | ❌ | ❌ | ✅ |
| Hired badge on profile | ❌ | ❌ | ✅ |

### One-Time Purchases (for non-subscribers)
When a user hits their limit they see a hard block with two options:
1. **Upgrade to Pro/Hired** (subscription)
2. **Buy a top-up pack** (one-time, no subscription):

| Pack | Price | What you get |
|------|-------|-------------|
| CV Pack | 2 JOD | 3 extra CV builds |
| Edit Pack | 2 JOD | 10 extra AI edits |
| Cover Letter Pack | 2 JOD | 5 extra cover letters |

> One-time purchases are processed via Paddle. No subscription commitment.

### Free Trial Protection
- 1 free trial per email address (Supabase)
- 1 free trial per payment card (Paddle)
- Phone number verification on signup (adds friction against multi-account abuse)
- Paddle's built-in fraud detection flags repeated card use

---

## 4. Revenue Model

### Primary Revenue Streams

**Stream 1: Subscriptions (Pro + Hired)**
- Target: 5% of active users convert to paid within 6 months
- If 1,000 active users → 50 paid → ~350 JOD/month at blended 7 JOD avg
- At 10,000 users → 500 paid → ~3,500 JOD/month

**Stream 2: One-time top-up purchases**
- Lower commitment, higher impulse buy rate
- Estimated 8–10% of free users buy at least one pack

**Stream 3: Recruiter / Company Access (future — 6–12 months)**
- Companies pay to search and contact talent profiles
- Pricing: ~50–150 JOD/month per recruiter seat
- This is the high-margin tier — one company paying 100 JOD = 16 Pro users

**Stream 4: Partner Courses (future — 12+ months)**
- Partner with Jordanian/Arab training providers (Coursera partners, local bootcamps)
- Revenue share: 20–30% of course sale goes to Hired.jo
- Only accessible on Hired tier → drives top-tier upgrades

### Payment Infrastructure
- **Paddle** as Merchant of Record
  - Handles VAT, tax compliance, and fraud globally
  - Works without a Jordan Stripe account
  - ~5% + $0.50 per transaction fee
  - Payments arrive within 30 days of first sale
  - Supports credit cards, Apple Pay, Google Pay
- **Future:** When expanding to UAE/KSA → UAE business entity + Stripe (~3% fees)

---

## 5. Go-To-Market Strategy

### Phase 1: Campus Viral (Now — Month 3)
**Goal:** 1,000 active users from Jordanian universities

- **University WhatsApp groups** — share "build your CV in 5 minutes" with a direct link
- **Instagram Reels** — short videos showing the CV builder + roast feature (most shareable)
- **Word of mouth** — every CV has "Built with Hired.jo" watermark on free tier (removed on Pro+)
- **University career fairs** — demo live, QR code to hiredjo.com
- **Hashemite University** (home base) — leverage existing connections, get official mention in career center

### Phase 2: Paid Acquisition (Month 3–6)
**Goal:** 5,000 users, first paying customers

- Instagram/TikTok ads targeting Jordanian 18–26 year olds, ~5–10 JOD/day budget
- Google search ads for "CV builder Jordan", "وظائف الاردن"
- Partner with university career advisors — they recommend Hired.jo to students

### Phase 3: Recruiter Side (Month 6–12)
**Goal:** First 10 paying companies/recruiters

- Reach out to Jordanian SMEs directly (not big corporates first)
- Offer first month free to recruiters in exchange for testimonials
- Companies that post on Akhtaboot/Bayt are the target — we aggregate their jobs already

### Phase 4: Arab World Expansion (Month 12+)
- Launch `hiredjo.sa` for Saudi Arabia, `hiredjo.ae` for UAE
- Localize job data for those markets (already partially done — UAE/KSA jobs in the system)
- Translate UI to Arabic

---

## 6. Competitive Advantage

| Competitor | Weakness | How we win |
|-----------|----------|-----------|
| Akhtaboot | Just a job board, no CV help | We build the CV + match + score |
| Bayt.com | Generic, not Jordan-specific AI | We're built for Arab graduates specifically |
| LinkedIn | Expensive, Western-focused | Free, Arabic-friendly, understands local market |
| Wuzzuf | Egypt-focused | We're Jordan-first |
| Generic CV builders (Canva, etc.) | No job matching, no AI | Full pipeline from CV → job → score |

**Our moat:** The full pipeline. We don't just build the CV. We build it, score it, match it to real local jobs, roast it, help edit it, and connect you to employers. No one in Jordan does all of this.

---

## 7. Limit Enforcement (Technical)

When a user hits any limit:

1. **Hard block** — action is disabled, modal appears
2. Modal shows:
   - What limit they hit ("You've used your 2 AI edits this month")
   - Reset date if applicable ("Resets June 1")
   - Two CTAs:
     - **"Upgrade to Pro — 6 JOD/month"** (primary, gold button)
     - **"Buy Edit Pack — 2 JOD"** (secondary, for one-time buyers)
3. Clicking either → Paddle checkout opens
4. After payment → limit immediately unlocked, no page reload needed

Limits are tracked in Supabase per user per billing period. Reset automatically at start of each month.

---

## 8. The "Hired Badge"

The Hired badge appears on the user's talent profile and co-founder profile. It signals:
- This person is serious about their career
- They invested in their profile
- They are actively looking

For recruiters browsing talent, the badge is a quality signal — they'll filter for it. This creates organic pressure on non-Hired users to upgrade.

Badge design: gold crown icon next to name, "Hired Member" label.

---

## 9. Financial Projections (Conservative)

| Month | Active Users | Paid Users (5%) | MRR (JOD) |
|-------|-------------|-----------------|-----------|
| 1–2 | 200 | 0 (free launch) | 0 |
| 3 | 500 | 10 | ~70 |
| 6 | 2,000 | 100 | ~700 |
| 9 | 5,000 | 250 | ~1,750 |
| 12 | 10,000 | 500 | ~3,500 |
| 18 | 25,000 | 1,500 | ~12,000 |

> MRR = Monthly Recurring Revenue. Blended ARPU assumed ~7 JOD (mix of Pro + Hired).  
> Does not include one-time packs or recruiter revenue — both upside.

**Break-even:** ~50 paid users covers basic server costs (Vercel, Supabase, Neon, Gemini API).  
**Profitability:** ~200 paid users covers a part-time salary in Jordan.

---

## 10. Roadmap

### Now (Live)
- ✅ CV Builder (AI interview)
- ✅ CV Roast
- ✅ Job matching (10+ boards)
- ✅ Hired Score
- ✅ Talent marketplace
- ✅ Co-founder matching
- ✅ Auth + account sync
- ✅ hiredjo.com domain

### Next (1–2 months)
- [ ] Implement Free/Pro/Hired tier limits in code
- [ ] Paddle checkout integration
- [ ] Upgrade/downgrade flow
- [ ] One-time purchase packs
- [ ] "Hired Badge" on talent + co-founder profiles
- [ ] CV watermark on free tier ("Built with Hired.jo")
- [ ] Premium CV templates (3 new designs)
- [ ] Phone number verification on signup

### Soon (3–6 months)
- [ ] Recruiter/company dashboard
- [ ] Company can search + contact talent
- [ ] Arabic UI option
- [ ] Email job alerts ("3 new jobs match your CV")
- [ ] LinkedIn profile import

### Future (6–12 months)
- [ ] Partner course marketplace
- [ ] UAE/KSA expansion
- [ ] Mobile app (React Native)
- [ ] Employer branding pages

---

## 11. Legal & Compliance

- **Business entity:** Register in Jordan (individual establishment or LLC) before processing real payments
- **Paddle:** Acts as Merchant of Record — they handle tax/VAT compliance globally on our behalf
- **Privacy:** Add privacy policy + terms of service pages before launch of paid tier
- **Data:** All user data stays in Supabase (EU region) — GDPR-compatible

---

## 12. Success Metrics

| Metric | Target (Month 6) |
|--------|-----------------|
| Active users (monthly) | 2,000+ |
| Paid conversion rate | 5%+ |
| MRR | 700+ JOD |
| CV builds per day | 50+ |
| Talent profiles | 500+ |
| Recruiter signups | 5+ |
| Google ranking for "CV builder Jordan" | Top 5 |

# Dir Moments: Phase A directory (v1.0)

A free, commission-free directory of event vendors in Addis Ababa. Clients find vendors and contact them directly by call, Telegram or WhatsApp. Vendors pay only for visibility (Pro and Featured). Scope follows `event-directory-plan-v2.md`.

## What's in v1.0

**Clients**
- Browse and search by category, sub-city, event date (hides vendors booked that day), max starting price, minimum rating, verified only, and free text.
- Results show up to 3 **Sponsored** vendors (Featured plan + a sponsored slot for that category and sub-city this month + rating 3.5 or above + at most 1 no-show report), then everyone else ranked by rating, review count, profile completeness and verification, with a boost for Pro and Featured.
- Vendor profiles built from the category's **portfolio template** (10 templates, each with its own sections and prompts), in one of five looks (Classic, Modern, Bold free; Gold and Night for Pro and Featured).
- Contact buttons (call, Telegram, WhatsApp). Each tap is counted.
- Availability calendar with Gregorian and **Ethiopian** dates.
- Reviews with name and phone, held for moderation. Vendors can reply and flag; paying never removes a review.
- Amharic and English throughout (toggle in the header). Share to Telegram/WhatsApp. SEO metadata and schema.org data on vendor pages.

**Vendors**
- Sign up from a category template at `/join` (no account needed in v1).
- A private management link (`/manage/<token>`): edit profile, upload photos (compressed to WebP automatically), mark busy dates, reply to and flag reviews, see stats (views for Free; contact taps and search appearances for Pro; category comparison for Featured), request Pro or Featured, or claim the founding offer (first 100 vendors: Pro free for 3 months).
- Plan limits enforced: photos, videos, packages, premium looks.

**Admin** (`/admin`)
- Dashboard: live, verified and paying vendors, monthly subscription revenue, contact taps, views, vendors with 5+ leads, plans ending soon.
- Approval queue with in-person verification badge.
- Review moderation (pending and vendor-flagged).
- Subscriptions: mark paid with a Chapa reference to activate (manual, as in the pilot), renewals due in 7 days.
- Sponsored slot inventory per category, sub-city and month (max 5).
- Per-vendor page: status, verification, no-show reports, notes, plans, slots.

## Not in v1 yet

- SMS login (vendors use a private link, admin uses one shared password).
- Chapa API and webhook (payments are recorded by hand, which matches the pilot plan).
- Save and compare shortlists, in-app messages.
- Cloud storage/CDN for photos (stored on local disk in `uploads/`).
- SMS reminders before a plan expires (the admin page lists who to remind).
- Amharic copy needs a native speaker's review.
- Phase B (bookings, deposits, payouts) is out of scope.

## Run it

Requirements: Node 20+, PostgreSQL 14+.

```bash
cp .env.example .env          # set DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET
createdb directory            # or use any Postgres database
npm install
npm run db:reset              # creates tables and seeds 36 sample vendors
npm run dev                   # http://localhost:3000
```

For production: `npm run build && npm start`.

Try it:
- Home: `/`, search: `/vendors?category=photographer&subcity=bole`
- A Featured profile: `/v/afro-addis-band`
- A vendor's private page: `/manage/demo-lucy-lens-studio` (seeded vendors use `demo-<slug>` tokens)
- Admin: `/admin`, password from `ADMIN_PASSWORD`

All seeded vendors, phone numbers and reviews are made up. Photos are generated placeholders.

## Stack

Next.js 15 (App Router, server-rendered, server actions, works without JavaScript except tap counting), PostgreSQL via `pg`, `sharp` for photo compression. No CSS framework or web fonts, to keep pages light on slow connections. About 100 KB of JavaScript per page.

## Layout

```
app/            pages (public, /join, /manage, /admin) and small API routes
components/     VendorCard, VendorForm, Calendar, ContactButtons, SearchForm
lib/            catalog (categories, sub-cities), templates, tiers and prices,
                vendors (queries, ranking, stats), ethiopian (calendar), i18n
db/schema.sql   tables
scripts/        migrate, seed, calendar check
```

Prices, slot counts and ranking rules live in `lib/tiers.ts` and `lib/vendors.ts`; they are starting guesses from the plan, meant to be tested in vendor interviews.

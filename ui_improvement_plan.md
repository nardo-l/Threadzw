# Threadzw UI Improvement Plan

## Product direction

Threadzw should feel like the fastest way for a Zimbabwean clothing seller to move from “I have stock” to “customers can browse and enquire.” The interface should make one promise consistently: **unlimited products on Free, with 50 unique visits and 10 customer-interest events for life; Premium keeps customer actions open and adds premium storefront capabilities.** The current deployed experience is visually coherent, but the onboarding, dashboard, and plan surfaces still describe a legacy nine-product trial and a future Premium tier.

## Priority matrix

| Priority | Screen | Current friction | Design decision | Implementation target |
|---|---|---|---|---|
| P0 | Signup plan step | Free says “Up to 9 products”; Premium says “Coming Soon” | Make Free unlimited for products, explain 50 visits/10 interests, and position Premium as available after setup | Update `SignUp.tsx` plan cards and status copy; remove stale direct activation paths |
| P0 | Signup success step | Says “Lifetime active subscription” for a Free shop | Say “Free storefront active” and show a next-step checklist | Update success card with truthful status and clear next actions |
| P0 | Dashboard plan card | Shows `0 / 9 products used` and “Upgrade to Pro” | Show two lifetime meters: unique visitors and customer interests; use Premium language | Update `DashboardPlanCard.tsx` and its data labels |
| P1 | Inventory empty state | Shows `0 / 2 used` and generic search copy | Remove count-limit framing and guide the first listing with image/price/size/stock steps | Update `Inventory.tsx` empty state/header |
| P1 | Storefront empty state | Empty catalog looks like a missing data error | Use a calm “first drop is being prepared” state with shop identity and browsing-safe copy | Update storefront empty state |
| P1 | Account/profile editor | Banner/location rows are passive and offer little guidance | Make missing profile elements actionable and show completion status | Update profile rows and helper copy |
| P2 | Landing/FAQ | Contains old “limited free trial” and Pro language | Align marketing, FAQ, and pricing with the live product rules | Update stale copy after core flow is stable |

## Visual system

The existing black, white, and neon-lime palette is appropriate for the target audience and should be retained. The redesign should use a tighter mobile-first content width, a visible five-step progress indicator, compact cards with strong headings, and one dominant CTA per screen. Avoid adding more decorative gradients; the main improvement is clarity and hierarchy. Motion should stay under 300ms and be limited to step transitions, card selection, and confirmation moments.

## Scope for this iteration

The first implementation pass will address the P0 surfaces and the inventory empty-state language. It will preserve existing database and authentication behavior, keep the existing clothing-only subscription architecture, and ensure that no client-side redirect or manual status check can activate Premium. The next validation pass will run TypeScript, production build, stale-copy scans, and the existing live test account flow where feasible.

## Source

The observations in this brief were gathered from the deployed application at [threadzw.vercel.app](https://threadzw.vercel.app) and its authenticated disposable test account during this task.


## Local visual smoke test (2026-08-24)

The frontend-only preview renders successfully at the landing route with the rebuilt copy and black/lime visual system. The hero, comparison section, pricing section, FAQ controls, and primary signup CTAs are visible and interactive. The first viewport still contains intentionally illustrative marketing labels such as `threadzw.com/kicks` in the static hero mockup and a few `Orders` words in older marketing sections; these are not runtime data paths but should be normalized if the public copy pass continues. Placeholder Supabase values prevent authenticated route testing in the sandbox, while the production TypeScript check and build both pass.


The local `/signup` entry route renders as a clean mobile-first white screen with ThreadZW branding, a clothing-specific headline, a short no-code promise, product imagery, and one dominant `GET STARTED` CTA. The page visually matches the intended low-friction onboarding direction; authenticated step testing requires real Supabase environment values, which are intentionally not present in the sandbox.

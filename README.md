# CleanMatch

**Book a trusted local cleaner without the chase.**

CleanMatch is a two-sided marketplace that connects households with independent cleaners nearby. Clients compare profiles, see rates before they commit, and manage the job in one place. Cleaners set their own hours and pricing, review incoming requests, and get paid through the platform—not over text or cash.

No more calling around, guessing at the bill, or paying someone off-app. Request, confirm, pay, and review—end to end.

---

## The problem

Hiring a cleaner is still mostly informal. You get a name from a neighbor, wait on a group chat, and hope the price you heard is the price you pay. Cleaners, meanwhile, spend time chasing leads instead of cleaning.

CleanMatch makes that exchange feel like a product: **you choose the person**, **you see the price**, and **both sides stay on the same page** from the first request to the last review.

---

## Who it’s for

**Households** who want a reliable clean without the back-and-forth. Browse local cleaners, filter by what matters, and book with a clear total—hourly rate plus a 15% service fee shown before you send the request.

**Cleaners** who want control. Set your rate, service area, and availability. Incoming jobs already include home details, photos, and a quoted price, so you can accept, decline, or propose a change without starting from scratch.

---

## How it works

1. **Discover** — Browse cleaners near you. See ratings, rates, bios, and who’s actually available in your area.
2. **Request** — Walk through a short intake: home size, rooms, add-ons, timing, and optional photos so the cleaner knows the job.
3. **Confirm & pay** — Your cleaner accepts (or counters if the scope needs a tweak). You see the full price up front and pay securely on the platform.
4. **Clean & review** — After the visit, mark it complete and leave a rating. Only finished jobs unlock reviews, so scores reflect real work.

If the job isn’t quite what was quoted, cleaners can send a counter-offer. You accept or pass—totals update from what was agreed, not a surprise at the door.

---

## Why it feels different

**You pick the cleaner.** Matching is not a random assignment. Profiles, reviews, and availability sit side by side so fit comes first.

**Pricing is honest.** Recommended hours come from the home you describe—bedrooms, bathrooms, clean type, extras. The 15% platform fee is visible before you book. No “we’ll figure it out later.”

**Both sides can negotiate.** Scope and time can be adjusted in-product. The original quote stays on the record so nobody loses track of what was asked for.

**Payments stay on-platform.** Cards go through CleanMatch (Stripe). You’re never asked to Venmo a cleaner for a CleanMatch job.

**Trust is earned, not assumed.** Cleaners complete a profile and platform review before they take jobs. Cancellations more than 24 hours ahead follow a clear refund policy. Issues are reviewed by a person—accounts aren’t auto-shut off.

---

## Built with

A modern full-stack TypeScript product, not a tutorial clone.

| | |
|---|---|
| **App** | Next.js (App Router), React, TypeScript |
| **UI** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase — auth, Postgres, storage |
| **Payments** | Stripe |
| **Email** | Resend |
| **Host** | Vercel |

The interesting parts live in the product: role-based client and cleaner experiences, quote snapshots that survive negotiation, location-aware discovery, and payments that never leak off the platform.

---

*Independent product. Not a starter kit, not a template, not open for reuse.*

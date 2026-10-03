# Krili — Project Documentation

## 1. Overview

**Krili** is a house / studio / room rental marketplace for Morocco (prices in MAD/month). Landlords post listings with photos and details; tenants browse, filter, save, and reveal landlord contacts; an admin moderates publishing.

**Product loop:** Landlord creates listing → status `pending` → admin approves → `published` (visible publicly) → tenant browses/filters → saves (bookmark) → clicks *Contact landlord* → reveals phone + WhatsApp link (logged as a demand signal).

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js **16.3.4** (App Router, Turbopack) |
| React | **19.2.8** |
| Styling | Tailwind CSS **v4** + `tw-animate-css`, shadcn/ui `base-nova` style |
| UI kit | Base UI (`@base-ui/react`), Radix (`@radix-ui/react-label`, `react-slot`), **lucide-react** icons |
| Forms | `react-hook-form` **7.87** + `zod` **3.25** + `@hookform/resolvers/zod` **5.9** |
| Auth | **Clerk** NextJS v7 |
| Storage/DB | **Supabase** (Postgres + RLS, publishable-key client + service-role client) |
| Images | **Cloudinary** (signed upload/destroy API) |

## 3. Architecture

```
Tenant/Landlord browser → Next.js (App Router)
  ├─ Clerk → identity (user id = JWT "sub")
  ├─ Supabase → Postgres tables with RLS (user JWT) + service role for admin/phone
  └─ Cloudinary → listing photos (server-side signed upload)
```

- **Public pages** query Supabase with the **viewer's Clerk JWT** — RLS decides visibility (published only, or the owner's own rows).
- **Server actions** (`"use server"` files) re-validate with zod, re-check ownership, and use the user JWT (or **service role** for admin/landlord-phone reads).
- **Service-role client** is only used in: `/admin` moderation and landlord profile name/phone lookups — never in public query paths.

## 4. Project structure

```
app/
  page.tsx                      Home — featured cards + latest table (published only)
  layout.tsx                    Root layout — ClerkProvider, Navbar (isAdmin), ensureProfile
  listings/page.tsx             Browse + filters (/listings?...)
  listings/new/page.tsx         Create listing
  listings/[id]/page.tsx        Detail — DB-first, gallery, contact reveal, report
  listings/[id]/edit/page.tsx   Edit listing (owner only)
  dashboard/page.tsx            Landlord listings + status + contact-counts
  bookmarks/page.tsx            Saved listings
  admin/page.tsx                Moderation + Reports queues
  sign-in|sign-up/…             Clerk pages
components/
  Navbar.tsx                    Responsive (admin link, mobile overlay menu)
  ListingCard.tsx               Card — cover photo, bookmark toggle
  ListingsList.tsx              Latest table
  ListingForm.tsx               Create form (RHF + zod + photos)
  EditListingForm.tsx           Edit form
  PhotoUploader.tsx             New-photo picker (create flow)
  PhotoManager.tsx              Edit photo manager (keep/replace/cover)
  ListingPhotoGallery.tsx       Portrait cover left + thumbs right (laptop)
  ContactReveal.tsx             Contact button → phone + WhatsApp
  BookmarkButton.tsx            Save/unsave toggle
  DeleteListingButton.tsx       Delete with confirm
  ReportListingButton.tsx       Report a listing (reason + optional details)
  NotFound.tsx / PropertyIcon.tsx
components/admin/
  ListingReviewActions.tsx      Approve/Reject listings
  ReportReviewActions.tsx       Resolve/Dismiss reports (+ unpublish)
lib/
  schema.ts                     Shared zod listingSchema
  listing-mapper.ts             mapListingRow + getLandlordProfiles (service-role)
  supabase.ts                   createSupabaseClient + createServiceRoleClient
  admin.ts                      isAdmin (Clerk metadata OR ADMIN_USER_IDS)
  actions/listing.action.ts     create/update/delete/replace-photos/admin actions + fetchListings + getContactRevealCounts
  actions/bookmarks.action.ts   toggleBookmark + getSavedListingIds
  actions/contact.action.ts     revealContact (service-role phone)
  actions/reports.action.ts     createReport / getOpenReports / resolveReport
  actions/profile.ts            ensureProfile (+ name/avatar sync from Clerk)
  schema.sql                    Full DDL + RLS policies
types/index.ts                  Global types (Listing, ModerationListing, …)
constants/index.ts              propertyTypes, cities, neighborhoods, sample data
```

## 5. Database (Supabase)

**Tables** — `profiles`, `neighborhoods`, `listings`, `listing_photos`, `contact_reveals`, `reports`, `saved_listings`.

**`profiles`** — `id` (Clerk sub), `phone`, `role` (`landlord|tenant|both`), `phone_verified`, `id_verified`, `created_at` **+** `first_name`, `last_name`, `email`, `avatar_url` (synced from Clerk).

**`listings`** — `landlord_id → profiles`, `neighborhood_id → neighborhoods`, `title`, `property_type` (`house|studio|room|apartment`), `price_mad`, `rooms`, **`beds`, `bathrooms`, `furnished`, `pet_friendly`, `available_from`, `description`, `amenities text[]`**, `has_caution`, `caution_amount`, `status` (`pending|published|rejected|rented`), `rejection_reason`, `created_at`.

**`listing_photos`** — `listing_id → listings` (cascade), `url` (Cloudinary), `sort_order`, `is_cover`.
**`contact_reveals`** — `listing_id`, `tenant_id → profiles`, `created_at` (demand signal; idempotent per tenant+listing).
**`saved_listings`** — `profile_id`, `listing_id`, `created_at`, `unique(profile_id, listing_id)`.
**`reports`** — `listing_id`, `reporter_id`, `reason`, `details`, `status` (`open|reviewed|dismissed`) + partial unique index `reports_one_open_per_reporter_listing` on `(reporter_id, listing_id) WHERE status = 'open'` (a tenant can report again once no report is open).

**RLS highlights** (all keyed on `auth.jwt()->>'sub'` = Clerk user id):
- anybody selects **published** listings; owner sees own at any status
- landlords insert/update/delete **own** listings (a **delete policy** was required to make deletion work)
- tenants insert their own `contact_reveals` / `saved_listings`
- landlords can **read** `contact_reveals` on their own listings → reveal counts on `/dashboard`
- reporters insert/view their own `reports`; other tenants can't read reports (admin uses service role)
- profiles: users only read/write **their own** row (→ landlord names/phones via service role)
- neighborhoods: public read + signed-in insert (policy added so `createListing` can self-seed)

> These ALTERs must have been applied (see the SQL in *Setup*): `profiles.first_name/last_name/email/avatar_url`, `listings.description/beds/bathrooms/furnished/pet_friendly/available_from/amenities`, `listings.property_type`, neighborhoods insert policy, **listings delete policy**, `reports.details` + partial open-report unique index.

## 6. Auth & authorization

- Clerk signs users up/in; `auth()` / `currentUser()` in server code; client-side redirects use `useRouter()`.
- **Admin** = Clerk user with public metadata `{"role":"admin"}` **OR** an id in `ADMIN_USER_IDS` — checked via `lib/admin.ts` (`isAdmin`); `/admin` redirects non-admins and every admin action re-checks.
- **Ownership** always enforced by RLS **and** explicit checks (`landlord_id === userId`) in actions like `getManagedListing`.

## 7. Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Home (published listings) |
| `/listings` | public | Browse + filters (`?city&type&minPrice&maxPrice&rooms`) |
| `/listings/new` | signed-in | Create listing |
| `/listings/[id]` | public | Detail + gallery + contact reveal |
| `/listings/[id]/edit` | owner | Edit listing + replace photos |
| `/dashboard` | signed-in | My listings (status badges, edit/delete) |
| `/bookmarks` | signed-in | Saved listings |
| `/admin` | admin | Moderation + Reports queues |
| `/sign-in`, `/sign-up` | — | Clerk |

## 8. Features implemented (task log)

**Foundation / domain**
1. Converted tutoring app → rental platform: `constants` (propertyTypes/cities/neighborhoods), global types, `types/index.ts`.
2. Shared zod `listingSchema` (RHF + resolver), tenant/landlord "both" role model.
3. `lib/listing-mapper.ts` — single row→`Listing` mapper + `getLandlordProfiles` (service role).

**Browsing**
4. Home: featured card grid + latest table (published only, sample-data fallback).
5. Listing cards: cover photo, type badge, price/rooms, bookmark toggle.
6. `ListingPhotoGallery`: portrait cover + thumbnails (laptop: cover left / thumbs right; mobile stacked); fixed thumbnail-index bug.
7. Search & filters on `/listings` with shareable query params (SQL filters + city post-filter).

**Auth / nav / shell**
8. Responsive Navbar: desktop pills, mobile hamburger + **dimmed overlay menu**, Admin link, "My listings"/"Saved"/"Browse", current-page highlight, scroll lock.

**Landlord flow**
9. Create form: title, type, rooms, price, neighborhood, city, **description, beds, bathrooms, furnished, pet-friendly, available-from**, caution + amount, photos; zod validation; Cloudinary upload → `listing_photos`.
10. Dashboard `/dashboard` — my listings with `pending/published/rejected` badges + rejection reason.
11. Manage listings — `/listings/[id]/edit` (pre-filled), **delete** (with Cloudinary cleanup + verified delete), **replace photos** (`PhotoManager` + `replaceManagedPhotos`), edit resets status → `pending`.

**Tenant flow**
12. Bookmarks — `saved_listings` table + `toggleBookmark` + `/bookmarks` page.
13. Contact reveal — `revealContact` (inserts row, idempotent) → phone + **WhatsApp link** (normalized Moroccan numbers); already-revealed users see it instantly; RLS keeps phones private otherwise.

**Admin flow**
14. Moderation queue `/admin` — reject with reason, approve (`status → published`); service-role reads.

**Identity**
15. Landlord profiles — Clerk first/last name + avatar synced to `profiles` (`ensureProfile`); shown on detail page via `getLandlordProfiles`.

**Reporting & trust**
16. Reports — tenant reports a **published** listing (reason dropdown + optional details, `reportSchema`, `reports.action.ts`); admin queue shows only `open` reports with listing context.
17. Report resolution — admin **Resolve** (report-only) or **Resolve & unpublish** (sets listing `rejected` with a reason the landlord sees on `/dashboard`), or **Dismiss**; the row leaves the open queue either way. **Re-reporting** is allowed once a report is no longer open (partial unique index).
18. Reveal counts — `/dashboard` shows per-listing count of distinct tenants who requested contact (`getContactRevealCounts`, owner-scoped by RLS; one row per tenant/listing thanks to `revealContact` idempotency).

## 9. Key gotchas learned (important for future work)

- **RHF resolver mismatch:** never use `z.boolean().default(false)` in a schema passed to `zodResolver` (input `boolean|undefined` vs output `boolean` breaks types) — use `z.boolean()` + form `defaultValues`.
- **Base-UI Select** `onValueChange` gives `string | null` → normalize `v ?? ""` before `useState`.
- **Supabase embeds** (`neighborhoods(...)`) are typed as arrays → normalize `Array.isArray(rows) ? rows[0] : rows`.
- **RLS is silent on DELETE/UPDATE** when no policy matches (0 rows, no error) → always `.select("id").single()` to verify, or add the policy.
- **`.env` is read at server boot** — restart `npm run dev` after editing keys (e.g., `ADMIN_USER_IDS`, service key).
- **Clerk users aren't in `auth.users`** — use `auth.jwt()->>'sub'` (never `auth.uid()`) in policies.
- **`property_type` column is required** — every query selects it; if the column is missing, queries error and pages fall back to sample data.
- **Images** — dynamic Cloudinary/blob URLs use native `<img>` (fine for remote storage); avoid `next/image` remote-pattern config for these.
- **Clerk at build time** — `auth()`/`currentUser()` throw outside a request (Next collects page data at build: "headers was called outside a request scope") → guard shared helpers with try/catch (`getSavedListingIds`, supabase `accessToken`, `isAdmin`).
- **Server action files** — every exported function from a `"use server"` file must be `async`; keep pure helpers private (e.g., `mapReportRow` can't be exported).
- **Global types** — `types/index.ts` is a script (no `export`); avoid DOM-lib name collisions (renamed `Report` → `ListingReport`).

## 10. Environment variables (`.env`)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL / _FALLBACK_REDIRECT_URL / SIGN_UP_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY          # server-only (admin, phones, landlord names)
ADMIN_USER_IDS                     # comma-separated Clerk user ids
CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET
```

## 11. Setup & commands

```bash
npm install
npm run dev        # dev — restart after .env edits
npm run build      # production build (type-checks everything)
npm run lint       # eslint (base-nova react-hooks rules)
```

**SQL to run once in Supabase** (in order): tables from `lib/schema.sql`, then

```sql
alter table public.profiles
  add column first_name text, add column last_name text,
  add column email text, add column avatar_url text;

alter table public.listings
  add column description text,
  add column beds integer not null default 1 check (beds > 0),
  add column bathrooms integer not null default 1 check (bathrooms > 0),
  add column furnished boolean not null default false,
  add column pet_friendly boolean not null default false,
  add column available_from date,
  add column amenities text[] not null default '{}',
  add column property_type text check (property_type in ('house','studio','room','apartment'));

create policy "Signed-in users can add neighborhoods" on public.neighborhoods
  for insert with check (auth.jwt()->>'sub' is not null);

-- Required for landlord delete to work (RLS is silent otherwise):
create policy "Landlords can delete own listings" on public.listings
  for delete using ((select auth.jwt()->>'sub') = landlord_id);

-- Reports feature
alter table public.reports add column details text;
-- (if the old always-unique constraint was applied earlier, drop it first)
alter table public.reports drop constraint if exists reports_reporter_listing_unique;
create unique index if not exists reports_one_open_per_reporter_listing
  on public.reports (reporter_id, listing_id) where status = 'open';
create index if not exists reports_status_created_at_idx
  on public.reports (status, created_at desc);

-- (optional) seed neighborhoods for the shipped cities
```

## 12. Known gaps / next steps

- **Reveal analytics, deeper**: show *who* asked (name + date) and notify landlords on new reveals.
- **Admin "landlord side"**: surface `rejection_reason` clearly and let landlords resubmit edited listings (edits already reset to `pending`).
- **Amenities** chip selector in forms (DB/type/mapper already support it).
- **Pagination** on browse (`limit(24)` today) and **drag-to-reorder** photos (buttons today).
- **Production readiness**: deploy envs, Cloudinary upload-preset hardening, rate limiting on `revealContact`.

---

*Generated for the Krili rental platform — see also `README.md` for bootstrap instructions.*
-- Enable UUID generation (still used for non-user primary keys)
create extension if not exists "pgcrypto";
-- PROFILES
-- id is TEXT, not UUID: Clerk user IDs (e.g. "user_2NNEqL2nrIRdJ194ndJZoAvPk8t")
-- are strings, and with Clerk's native third-party auth integration, Clerk users
-- are never written into Supabase's auth.users table — so there is nothing to
-- foreign-key against. We trust the Clerk-issued JWT directly instead.
create table public.profiles (
	id text primary key,
	-- Clerk user id (the JWT's "sub" claim)
	phone text,
	role text not null default 'both' check (role in ('landlord', 'tenant', 'both')),
	phone_verified boolean not null default false,
	id_verified boolean not null default false,
	created_at timestamptz not null default now()
);
-- NEIGHBORHOODS (lookup table, unchanged)
create table public.neighborhoods (
	id uuid primary key default gen_random_uuid(),
	city text not null,
	name text not null,
	unique (city, name)
);
-- LISTINGS
create table public.listings (
	id uuid primary key default gen_random_uuid(),
	landlord_id text not null references public.profiles(id) on delete cascade,
	neighborhood_id uuid not null references public.neighborhoods(id),
	title text not null,
	price_mad integer not null check (price_mad > 0),
	rooms integer not null check (rooms > 0),
	has_caution boolean not null default false,
	caution_amount integer,
	status text not null default 'pending' check (
		status in ('pending', 'published', 'rejected', 'rented')
	),
	rejection_reason text,
	created_at timestamptz not null default now()
);
-- LISTING PHOTOS
create table public.listing_photos (
	id uuid primary key default gen_random_uuid(),
	listing_id uuid not null references public.listings(id) on delete cascade,
	url text not null,
	sort_order integer not null default 0,
	is_cover boolean not null default false
);
-- CONTACT REVEALS (demand signal log)
create table public.contact_reveals (
	id uuid primary key default gen_random_uuid(),
	listing_id uuid not null references public.listings(id) on delete cascade,
	tenant_id text not null references public.profiles(id) on delete cascade,
	created_at timestamptz not null default now()
);
-- REPORTS
create table public.reports (
	id uuid primary key default gen_random_uuid(),
	listing_id uuid not null references public.listings(id) on delete cascade,
	reporter_id text not null references public.profiles(id) on delete cascade,
	reason text not null,
	status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
	created_at timestamptz not null default now()
);
-- Helpful indexes for search/filtering
create index idx_listings_status on public.listings(status);
create index idx_listings_neighborhood on public.listings(neighborhood_id);
create index idx_listings_price on public.listings(price_mad);
-- Row Level Security
alter table public.profiles enable row level security;
alter table public.neighborhoods enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.contact_reveals enable row level security;
alter table public.reports enable row level security;
-- All policies below use (select auth.jwt()->>'sub') to read the Clerk user id
-- directly out of the JWT, instead of auth.uid() (which expects a uuid matching
-- a row in auth.users — something Clerk users never have with this integration).
-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on public.profiles for
select using (
		(
			select auth.jwt()->>'sub'
		) = id
	);
create policy "Users can update own profile" on public.profiles for
update using (
		(
			select auth.jwt()->>'sub'
		) = id
	);
create policy "Users can insert own profile" on public.profiles for
insert with check (
		(
			select auth.jwt()->>'sub'
		) = id
	);
-- Listings: anyone can view published listings; landlords manage their own
create policy "Anyone can view published listings" on public.listings for
select using (
		status = 'published'
		or (
			select auth.jwt()->>'sub'
		) = landlord_id
	);
create policy "Landlords can insert own listings" on public.listings for
insert with check (
		(
			select auth.jwt()->>'sub'
		) = landlord_id
	);
create policy "Landlords can update own listings" on public.listings for
update using (
		(
			select auth.jwt()->>'sub'
		) = landlord_id
	);
-- Listing photos: follow parent listing visibility
create policy "Anyone can view photos of visible listings" on public.listing_photos for
select using (
		exists (
			select 1
			from public.listings
			where listings.id = listing_photos.listing_id
				and (
					listings.status = 'published'
					or listings.landlord_id = (
						select auth.jwt()->>'sub'
					)
				)
		)
	);
create policy "Landlords can manage own listing photos" on public.listing_photos for all using (
	exists (
		select 1
		from public.listings
		where listings.id = listing_photos.listing_id
			and listings.landlord_id = (
				select auth.jwt()->>'sub'
			)
	)
);
-- Contact reveals: tenant can insert own, landlord can view reveals on their listings
create policy "Tenants can log own reveals" on public.contact_reveals for
insert with check (
		(
			select auth.jwt()->>'sub'
		) = tenant_id
	);
create policy "Tenants and landlords can view relevant reveals" on public.contact_reveals for
select using (
		(
			select auth.jwt()->>'sub'
		) = tenant_id
		or exists (
			select 1
			from public.listings
			where listings.id = listing_id
				and listings.landlord_id = (
					select auth.jwt()->>'sub'
				)
		)
	);
-- Reports: reporter can insert, only visible to reporter (admin uses service role to see all)
create policy "Users can file reports" on public.reports for
insert with check (
		(
			select auth.jwt()->>'sub'
		) = reporter_id
	);
create policy "Reporters can view own reports" on public.reports for
select using (
		(
			select auth.jwt()->>'sub'
		) = reporter_id
	);
-- Neighborhoods: public read
create policy "Anyone can view neighborhoods" on public.neighborhoods for
select using (true);
create policy "Signed-in users can add neighborhoods" on public.neighborhoods for
insert with check (auth.jwt()->>'sub' is not null);
-- Listing photos are stored on Cloudinary (see .env) and referenced from the
-- listing_photos table (url = Cloudinary secure_url, sort_order = index,
-- is_cover = the user-picked cover).
-- Required so the detail page can render DB-created listings:
alter table public.listings
add column property_type text check (
		property_type in ('house', 'studio', 'room', 'apartment')
	);
create table public.saved_listings (
	id uuid primary key default gen_random_uuid(),
	profile_id text not null references public.profiles(id) on delete cascade,
	listing_id uuid not null references public.listings(id) on delete cascade,
	created_at timestamptz not null default now(),
	unique (profile_id, listing_id)
);
alter table public.saved_listings enable row level security;
create policy "Users can view own saved listings" on public.saved_listings for
select using (
		(
			select auth.jwt()->>'sub'
		) = profile_id
	);
create policy "Users can insert own saved listings" on public.saved_listings for
insert with check (
		(
			select auth.jwt()->>'sub'
		) = profile_id
	);
create policy "Users can delete own saved listings" on public.saved_listings for delete using (
	(
		select auth.jwt()->>'sub'
	) = profile_id
);
create index idx_saved_listings_profile on public.saved_listings(profile_id);
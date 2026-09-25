import ListingCard from "@/components/ListingCard";
import ListingFilters from "@/components/ListingFilters";
import { getSavedListingIds } from "@/lib/actions/bookmarks.action";
import { createSupabaseClient } from "@/lib/supabase";
import Link from "next/link";

type EmbeddedNeighborhood = { city?: string; name?: string }

const savedIds = new Set(await getSavedListingIds())

const Page = async ({ searchParams }: SearchParams) => {
	const params = await searchParams

	const str = (key: string) => {
		const value = params[key]
		return typeof value === "string" ? value : ""
	}

	const num = (key: string) => {
		const value = str(key)
		return value ? Number(value) : undefined
	}

	const city = str("city")
	const propertyType = str("type")
	const minPrice = num("minPrice")
	const maxPrice = num("maxPrice")
	const rooms = num("rooms")

	const supabase = createSupabaseClient()

	let query = supabase
		.from("listings")
		.select(`
			id, title, price_mad, rooms, property_type,
			neighborhoods(city, name),
			listing_photos(url, sort_order, is_cover)
		`)
		.eq("status", "published")
		.order("created_at", { ascending: false })
		.limit(24)


	if (propertyType) query = query.eq("property_type", propertyType)
	if (minPrice !== undefined && !Number.isNaN(minPrice)) query = query.gte("price_mad", minPrice)
	if (maxPrice !== undefined && !Number.isNaN(maxPrice)) query = query.lte("price_mad", maxPrice)
	if (rooms !== undefined && !Number.isNaN(rooms)) query = query.gte("rooms", rooms)

	const { data, error } = await query

	if (error) {
		console.error("listings search failed:", error.message)
	}

	const listings = (data ?? [])
		.map((row) => {
			// city lives on the joined neighborhoods row, so filter it post-query.
			const rawNeighborhood = row.neighborhoods as unknown as
				| EmbeddedNeighborhood
				| EmbeddedNeighborhood[]
				| null
			const neighborhood = Array.isArray(rawNeighborhood) ? rawNeighborhood[0] : rawNeighborhood

			return {
				id: row.id,
				title: row.title,
				type: (row.property_type as PropertyType) || "house",
				price: row.price_mad,
				rooms: row.rooms,
				neighborhood: neighborhood?.name ?? "",
				city: neighborhood?.city ?? "",
				description: "",
				landlordName: "Landlord",
				hasCaution: false,
				bookmarked: false,
				photos: (row.listing_photos ?? [])
					.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
					.map((photo) => ({
						url: photo.url,
						sort_order: photo.sort_order ?? 0,
						is_cover: photo.is_cover ?? false,
					})),
			} satisfies Listing
		})
		.filter((listing) => !city || listing.city === city)

	console.log(savedIds)

	return (
		<main>
			<section className="flex flex-col gap-2">
				<h1>Browse listings</h1>
				<p className="text-lg text-muted-foreground">
					Search houses, studios & rooms for rent across Morocco.
				</p>
			</section>

			<ListingFilters
				searchParams={{
					city,
					type: propertyType,
					minPrice: str("minPrice"),
					maxPrice: str("maxPrice"),
					rooms: str("rooms"),
				}}
				resultCount={listings.length} />

			{listings.length === 0 ? (
				<section className="flex flex-col items-center gap-4 rounded-4xl border border-black px-8 py-14 text-center">
					<h2 className="text-2xl font-bold">No listings match your filters</h2>
					<p className="text-muted-foreground">Try widening the price range or clearing a filter.</p>
					<Link href="/listings" className="btn-primary w-fit">
						Clear filters
					</Link>
				</section>
			) : (
				<section className="listings-grid">
					{listings.map((listing) => (
						<ListingCard key={listing.id} listing={listing} initialSaved={savedIds.has(listing.id)} />
					))}
				</section>
			)}
		</main>
	)
}

export default Page
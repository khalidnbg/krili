import ListingCard from "@/components/ListingCard"
import ListingsList from "@/components/ListingsList"
import { createSupabaseClient } from "@/lib/supabase"

type EmbeddedNeighborhood = {
	city?: string
	name?: string
}

const fetchListings = async () => {
	const supabase = createSupabaseClient()

	const { data, error } = await supabase
		.from("listings")
		.select(
			"id, title, price_mad, rooms, has_caution, caution_amount, property_type, neighborhoods(city, name), listing_photos(url, sort_order, is_cover)"
		)
		.eq("status", "published")
		.order("created_at", { ascending: false })
		.limit(12)

	console.log("data:", data)

	if (error) {
		console.error("Failed to fetch listings:", error.message)
		return null
	}

	if (!data?.length) {
		return null
	}

	return data.map((row) => {
		const rawNeighborhood = row.neighborhoods as unknown as
			| EmbeddedNeighborhood
			| EmbeddedNeighborhood[]
			| null

		const neighborhood = Array.isArray(rawNeighborhood)
			? rawNeighborhood[0]
			: rawNeighborhood

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
			hasCaution: row.has_caution,
			cautionAmount: row.caution_amount,
			bookmarked: false,

			photos: (row.listing_photos ?? [])
				.sort(
					(a, b) =>
						(a.sort_order ?? 0) - (b.sort_order ?? 0)
				)
				.map((photo) => ({
					url: photo.url,
					sort_order: photo.sort_order ?? 0,
					is_cover: photo.is_cover ?? false,
				})),
		} satisfies Listing
	})
}


const page = async () => {
	const fromDb = await fetchListings()

	// Use DB listings when available, otherwise use sample data
	const listings = fromDb?.length ? fromDb : []

	console.log("listings:", listings)

	const featured = listings.slice(0, 6)
	const latest = listings.slice(0, 5)

	return (
		<main>
			<section className="flex flex-col gap-2">
				<h1>Find your next home</h1>
				<p className="text-lg text-muted-foreground">
					Houses, studios & rooms for rent across Morocco - posted by verified landlords
				</p>
			</section>

			<section className="listings-grid">
				{featured.map((listing) => (
					<ListingCard key={listing.id} listing={listing} />
				))}
			</section>

			<section className="home-section">
				<ListingsList title="Latest Listings" listings={latest} classNames="w-full max-lg:w-full" />
				{/* <CTA /> */}
			</section>
		</main>
	)
}

export default page
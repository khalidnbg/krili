import ListingCard from "@/components/ListingCard"
import ListingsList from "@/components/ListingsList"
import { fetchListings } from "@/lib/actions/listing.action"

const page = async () => {
	const fromDb = await fetchListings()

	// Use DB listings when available, otherwise use sample data
	const listings = fromDb?.length ? fromDb : []

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
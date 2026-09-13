import ListingCard from "@/components/ListingCard"
import ListingsList from "@/components/ListingsList"
import { featuredListings, recentListings } from "@/constants"

const page = () => {
	return (
		<main>
			<section className="flex flex-col gap-2">
				<h1>Find your next home</h1>
				<p className="text-lg text-muted-foreground">
					Houses, studios & rooms for rent across Morocco - posted by verified landlords
				</p>
			</section>

			<section className="listings-grid">
				{featuredListings.map((listing) => (
					<ListingCard key={listing.id} listing={listing} />
				))}
			</section>

			<section className="home-section">
				<ListingsList title="Latest Listings" listings={recentListings} classNames="w-full max-lg:w-full" />
				{/* <CTA /> */}
			</section>
		</main>
	)
}

export default page
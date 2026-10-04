import ListingCard from "@/components/ListingCard"
import ListingsList from "@/components/ListingsList"
import { getSavedListingIds } from "@/lib/actions/bookmarks.action"
import { fetchListings } from "@/lib/actions/listing.action"

const page = async () => {
	const savedIds = new Set(await getSavedListingIds())

	const result = await fetchListings({ pageSize: 6 })
	const fromDb = result?.listings
	const listings = fromDb?.length ? fromDb : []

	return (
		<main className="flex flex-col gap-16 px-4 py-10 md:px-8 md:py-14">
			<section className="flex flex-col gap-3">
				<h1 className="text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
					Find your next home
				</h1>
				<p className="max-w-xl text-lg text-neutral-500">
					Houses, studios & rooms for rent across Morocco — posted by verified landlords
				</p>
			</section>

			<section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{listings.map((listing) => (
					<ListingCard key={listing.id} listing={listing} initialSaved={savedIds.has(listing.id)} />
				))}
			</section>

			<section className="flex flex-col gap-6">
				<ListingsList title="Latest Listings" listings={listings} classNames="w-full max-lg:w-full" />
				{/* <CTA /> */}
			</section>
		</main>
	)
}

export default page
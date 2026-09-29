import Link from "next/link"
import ListingCard from "@/components/ListingCard"
import ListingFilters from "@/components/ListingFilters"
import Pagination from "@/components/Pagination"
import { fetchListings } from "@/lib/actions/listing.action"

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
	const page = Math.max(1, num("page") ?? 1)
	const pageSize = 9

	const result = await fetchListings({ page, pageSize, city, type: propertyType, minPrice, maxPrice, rooms })

	const listings = result?.listings ?? []
	const total = result?.total ?? 0
	const totalPages = Math.max(1, Math.ceil(total / pageSize))

	return (
		<main>
			<section className="flex flex-col gap-2">
				<h1>Browse listings</h1>
				<p className="text-lg text-muted-foreground">
					Search houses, studios & rooms for rent across Morocco.
				</p>
			</section>

			<ListingFilters
				searchParams={{ city, type: propertyType, minPrice: str("minPrice"), maxPrice: str("maxPrice"), rooms: str("rooms") }}
				resultCount={total}
			/>

			{listings.length === 0 ? (
				<section className="flex flex-col items-center gap-4 rounded-4xl border border-black px-8 py-14 text-center">
					<h2 className="text-2xl font-bold">No listings match your filters</h2>
					<p className="text-muted-foreground">Try widening the price range or clearing a filter.</p>
					<Link href="/listings" className="btn-primary w-fit">Clear filters</Link>
				</section>
			) : (
				<section className="listings-grid">
					{listings.map((listing) => (
						<ListingCard key={listing.id} listing={listing} />
					))}
				</section>
			)}

			<Pagination currentPage={page} totalPages={totalPages} basePath="/listings" searchParams={params} />
		</main>
	)
}

export default Page

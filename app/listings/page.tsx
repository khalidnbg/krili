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
		<main className="flex flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
			<section className="flex flex-col gap-3">
				<h1 className="text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
					Browse listings
				</h1>
				<p className="max-w-xl text-lg text-neutral-500">
					Search houses, studios & rooms for rent across Morocco.
				</p>
			</section>

			<ListingFilters
				searchParams={{ city, type: propertyType, minPrice: str("minPrice"), maxPrice: str("maxPrice"), rooms: str("rooms") }}
				resultCount={total}
			/>

			{listings.length === 0 ? (
				<section className="flex flex-col items-center gap-4 rounded-3xl border border-neutral-200/80 bg-white px-8 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
					<h2 className="text-2xl font-bold text-neutral-900">No listings match your filters</h2>
					<p className="text-neutral-500">Try widening the price range or clearing a filter.</p>
					<Link
						href="/listings"
						className="w-fit rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
					>
						Clear filters
					</Link>
				</section>
			) : (
				<section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
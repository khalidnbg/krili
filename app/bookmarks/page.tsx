import ListingCard from "@/components/ListingCard";
import { getSavedListingIds } from "@/lib/actions/bookmarks.action";
import { createSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type EmbeddedNeighborhood = { city?: string; name?: string }

const Page = async () => {
	const { userId } = await auth()
	if (!userId) redirect("/sign-in")

	const savedIds = new Set(await getSavedListingIds())
	if (!savedIds.size) {
		return (
			<main className="flex flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
				<section className="flex flex-col items-center gap-4 rounded-3xl border border-neutral-200/80 bg-white px-8 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
					<h1 className="text-2xl font-bold text-neutral-900">No saved listings yet</h1>
					<p className="text-neutral-500">Tap the bookmark on any listing to keep it here.</p>
					<Link
						href="/listings"
						className="w-fit rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
					>
						Browse listings
					</Link>
				</section>
			</main>
		)
	}

	const supabase = createSupabaseClient()

	const { data, error } = await supabase
		.from("listings")
		.select("id, title, price_mad, rooms, property_type, neighborhoods(city, name), listing_photos(url, sort_order, is_cover)")
		.in("id", [...savedIds])
		.order("created_at", { ascending: false })

	if (error) console.error("fetch saved listings failed:", error.message)

	const listings = (data ?? []).map((row) => {
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
			bookmarked: true,
			photos: (row.listing_photos ?? [])
				.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
				.map((photo) => ({ url: photo.url, sort_order: photo.sort_order ?? 0, is_cover: photo.is_cover ?? false })),
		} satisfies Listing
	})

	return (
		<main className="flex flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
			<section className="flex flex-col gap-3">
				<h1 className="text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
					Saved listings
				</h1>
				<p className="text-lg text-neutral-500">{listings.length} saved</p>
			</section>

			{listings.length === 0 ? (
				<section className="rounded-3xl border border-neutral-200/80 bg-white px-8 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
					<p className="text-neutral-500">Your saved listings didn&apos;t come back — check back later.</p>
				</section>
			) : (
				<section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{listings.map((listing) => (
						<ListingCard key={listing.id} listing={listing} initialSaved={true} />
					))}
				</section>
			)}
		</main>
	)
}

export default Page
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
			<main>
				<section className="flex flex-col items-center gap-4 rounded-4xl border border-black px-8 py-14 text-center">
					<h1>No saved listings yet</h1>
					<p className="text-muted-foreground">Tap the bookmark on any listing to keep it here.</p>
					<Link href="/listings" className="btn-primary w-fit">Browse listings
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
		<main>
			<section className="flex flex-col gap-2">
				<h1>Saved listings</h1>
				<p className="text-lg text-muted-foreground">{listings.length} saved</p>
			</section>

			{listings.length === 0 ? (
				<section className="rounded-4xl border border-black px-8 py-14 text-center">
					<p className="text-muted-foreground">Your saved listings didn't come back — check back later.</p>
				</section>
			) : (
				<section className="listings-grid">
					{listings.map((listing) => (
						<ListingCard key={listing.id} listing={listing} initialSaved={true} />
					))}
				</section>
			)}
		</main>
	)
}

export default Page
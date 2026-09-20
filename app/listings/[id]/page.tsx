import Link from "next/link"
import NotFound from "@/components/NotFound"
import PropertyIcon from "@/components/PropertyIcon"
import { allListings } from "@/constants"
import { getPropertyColor } from "@/lib/utils"
import { createSupabaseClient } from "@/lib/supabase"
import ListingPhotoGallery from "@/components/ListingPhotoGallery"

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params

	// Try the database first (listings created through the form live there),
	// and fall back to the shipped sample data otherwise.
	const supabase = createSupabaseClient()

	const { data: row } = await supabase
		.from("listings")
		.select(
			"id, title, price_mad, rooms, has_caution, caution_amount, property_type, neighborhoods(city, name), listing_photos(url, sort_order, is_cover)"
		)
		.eq("id", id)
		.maybeSingle()

	// supabase-js types "neighborhoods(...)" as an array, whereas PostgREST
	// returns a single object for the many-to-one FK — normalize both shapes.
	type EmbeddedNeighborhood = { city?: string; name?: string }

	const rawNeighborhood =
		row?.neighborhoods as unknown as EmbeddedNeighborhood | EmbeddedNeighborhood[] | null
	const neighborhood = Array.isArray(rawNeighborhood) ? rawNeighborhood[0] : rawNeighborhood

	const listing: Listing | undefined = row
		? {
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
				.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
				.map((photo) => ({
					url: photo.url,
					sort_order: photo.sort_order ?? 0,
					is_cover: photo.is_cover ?? false,
				})),
		}
		: allListings.find((l) => l.id === id)



	if (!listing) {
		return (
			<main>
				<NotFound />
			</main>
		)
	}

	const initial = listing.landlordName.charAt(0)

	return (
		<main>
			<Link href="/" className="btn-signin w-fit">
				← All listings
			</Link>

			<section className="w-full">
				<article className="rounded-4xl border border-black overflow-hidden">
					{listing.photos && listing.photos.length > 0 ? (
						<ListingPhotoGallery
							photos={listing.photos.map(({ url, is_cover }) => ({ url, is_cover }))}
							title={listing.title}
						/>
					) : (
						<div
							className="h-64 flex items-center justify-center max-md:h-40"
							style={{ backgroundColor: getPropertyColor(listing.type) }}
						>
							<PropertyIcon type={listing.type} className="size-24 max-md:size-16" />
						</div>
					)}

					<div className="flex flex-col gap-5 p-8">
						<div className="flex justify-between items-start gap-4 flex-wrap">
							<div className="flex flex-col gap-2">
								<h1>{listing.title}</h1>
								<p className="text-muted-foreground">
									{listing.neighborhood} · {listing.city}
								</p>
							</div>
							<div className="property-badge h-fit capitalize">{listing.type}</div>
						</div>

						<div className="flex gap-4 flex-wrap items-center text-2xl font-bold">
							<p>
								{listing.price.toLocaleString()}
								<span className="text-sm text-muted-foreground font-normal"> MAD/month</span>
							</p>
							<span className="font-normal text-muted-foreground">·</span>
							<p>
								{listing.rooms} room{listing.rooms > 1 ? "s" : ""}
							</p>
						</div>

						<p className="text-lg max-w-2xl">{listing.description}</p>

						<p className="text-sm text-muted-foreground">
							{listing.hasCaution
								? `A security deposit of ${(listing.cautionAmount ?? 0).toLocaleString()} MAD is required before moving in.`
								: "No security deposit required."}
						</p>

						<div className="rounded-4xl border border-black p-6 flex justify-between items-center gap-4 flex-wrap">
							<div className="flex items-center gap-3">
								<div className="size-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl">
									{initial}
								</div>
								<div className="flex flex-col">
									<p className="font-bold">{listing.landlordName}</p>
									<p className="text-sm text-muted-foreground">Verified landlord</p>
								</div>
							</div>
							<button className="btn-primary">Contact landlord</button>
						</div>
					</div>
				</article>
			</section>
		</main>
	)
}

export default Page

import Link from "next/link"
import NotFound from "@/components/NotFound"
import PropertyIcon from "@/components/PropertyIcon"
import { allListings } from "@/constants"
import { getPropertyColor } from "@/lib/utils"
import { createSupabaseClient } from "@/lib/supabase"
import ListingPhotoGallery from "@/components/ListingPhotoGallery"
import ContactReveal from "@/components/ContactReveal"
import { auth } from "@clerk/nextjs/server"
import { getLandlordProfiles, mapListingRow } from "@/lib/listing-mapper"

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params
	const { userId } = await auth()

	const supabase = createSupabaseClient()

	const { data: row } = await supabase
		.from("listings")
		.select(`
			id, landlord_id, title, price_mad, rooms, beds, bathrooms, furnished, pet_friendly,
			available_from, description, has_caution, caution_amount, property_type,
			neighborhoods(city, name), listing_photos(url, sort_order, is_cover)
		`)
		.eq("id", id)
		.maybeSingle()

	let listing: Listing | undefined

	if (row) {
		const profile = (await getLandlordProfiles([row.landlord_id]))[row.landlord_id]
		listing = mapListingRow(row, profile)
	} else {
		listing = allListings.find((l) => l.id === id)
	}

	if (!listing) {
		return (
			<main>
				<NotFound />
			</main>
		)
	}

	let initialRevealed = false
	if (userId && listing) {
		const { data: reveal } = await supabase
			.from("contact_reveals")
			.select("id")
			.eq("listing_id", listing.id)
			.eq("tenant_id", userId)
			.maybeSingle()
		initialRevealed = !!reveal
	}

	return (
		<main>
			<Link href="/" className="btn-signin w-fit">
				← All listings
			</Link>

			<section className="w-full">
				<article className="overflow-hidden rounded-4xl border border-black">
					{listing.photos && listing.photos.length > 0 ? (
						<ListingPhotoGallery
							photos={listing.photos.map(({ url, is_cover }) => ({ url, is_cover }))}
							title={listing.title}
						/>
					) : (
						<div
							className="flex h-64 items-center justify-center max-md:h-40"
							style={{ backgroundColor: getPropertyColor(listing.type) }}
						>
							<PropertyIcon type={listing.type} className="size-24 max-md:size-16" />
						</div>
					)}

					<div className="flex flex-col gap-5 p-8">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div className="flex flex-col gap-2">
								<h1>{listing.title}</h1>
								<p className="text-muted-foreground">
									{listing.neighborhood} · {listing.city}
								</p>
							</div>
							<div className="property-badge h-fit capitalize">{listing.type}</div>
						</div>

						<div className="flex flex-wrap items-center gap-4 text-2xl font-bold">
							<p>
								{listing.price.toLocaleString()}
								<span className="text-sm font-normal text-muted-foreground"> MAD/month</span>
							</p>
							<span className="font-normal text-muted-foreground">·</span>
							<p>{listing.rooms} room{listing.rooms > 1 ? "s" : ""}</p>
							{listing.furnished && (
								<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
									Furnished
								</span>
							)}
							{listing.petFriendly && (
								<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
									Pet friendly
								</span>
							)}
						</div>

						{listing.description && (
							<p className="max-w-2xl text-lg">{listing.description}</p>
						)}

						{listing.availableFrom && (
							<p className="text-sm text-muted-foreground">
								Available from {new Date(`${listing.availableFrom}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
							</p>
						)}

						<p className="text-sm text-muted-foreground">
							{listing.hasCaution
								? `A security deposit of ${(listing.cautionAmount ?? 0).toLocaleString()} MAD is required before moving in.`
								: "No security deposit required."}
						</p>

						<div className="flex flex-wrap items-center justify-between gap-4 rounded-4xl border border-black p-6">
							<div className="flex items-center gap-3">
								{listing.landlordAvatar ? (
									<>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={listing.landlordAvatar}
											alt={listing.landlordName}
											className="size-12 shrink-0 rounded-full bg-black object-cover"
										/>
									</>
								) : (
									<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-black text-xl font-bold text-white">
										{listing.landlordName.charAt(0)}
									</div>
								)}
								<div className="flex flex-col">
									<p className="font-bold">{listing.landlordName}</p>
									<p className="text-sm text-muted-foreground">Verified landlord</p>
								</div>
							</div>

							<ContactReveal listingId={listing.id} initialRevealed={initialRevealed} />
						</div>
					</div>
				</article>
			</section>
		</main>
	)
}

export default Page

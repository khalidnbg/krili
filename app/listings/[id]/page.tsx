import Link from "next/link"
import NotFound from "@/components/NotFound"
import PropertyIcon from "@/components/PropertyIcon"
import { getPropertyColor } from "@/lib/utils"
import { createSupabaseClient } from "@/lib/supabase"
import ListingPhotoGallery from "@/components/ListingPhotoGallery"
import ContactReveal from "@/components/ContactReveal"
import { auth } from "@clerk/nextjs/server"
import { getLandlordProfiles, mapListingRow } from "@/lib/listing-mapper"
import ReportListingButton from "@/components/ReportListingButton"

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params
	const { userId } = await auth()

	const supabase = createSupabaseClient()

	const { data: row } = await supabase
		.from("listings")
		.select(`
		id, landlord_id, status, title, price_mad, rooms, beds, bathrooms, furnished, pet_friendly,
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
		listing = undefined
	}

	if (!listing) {
		return (
			<main>
				<NotFound />
			</main>
		)
	}

	const isPublished = row?.status === "published"

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

	let initialReported = false
	if (userId && listing) {
		const { data: report } = await supabase
			.from("reports")
			.select("id")
			.eq("listing_id", listing.id)
			.eq("reporter_id", userId)
			.eq("status", "open")
			.maybeSingle()
		initialReported = !!report
	}

	return (
		<main className="flex flex-col gap-6 px-4 py-10 md:px-8 md:py-14">
			<Link
				href="/"
				className="w-fit rounded-full px-4 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
			>
				← All listings
			</Link>

			<section className="w-full">
				<article className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
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
								<h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
									{listing.title}
								</h1>
								<p className="text-neutral-500">
									{listing.neighborhood} · {listing.city}
								</p>
							</div>
							<div className="h-fit w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-700">
								{listing.type}
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-4 text-2xl font-bold text-neutral-900">
							<p>
								{listing.price.toLocaleString()}
								<span className="text-sm font-normal text-neutral-500"> MAD/month</span>
							</p>
							<span className="font-normal text-neutral-300">·</span>
							<p>{listing.rooms} room{listing.rooms > 1 ? "s" : ""}</p>
							{listing.furnished && (
								<span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
									Furnished
								</span>
							)}
							{listing.petFriendly && (
								<span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
									Pet friendly
								</span>
							)}
						</div>

						{listing.description && (
							<p className="max-w-2xl text-lg text-neutral-700">{listing.description}</p>
						)}

						{listing.availableFrom && (
							<p className="text-sm text-neutral-500">
								Available from {new Date(`${listing.availableFrom}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
							</p>
						)}

						<p className="text-sm text-neutral-500">
							{listing.hasCaution
								? `A security deposit of ${(listing.cautionAmount ?? 0).toLocaleString()} MAD is required before moving in.`
								: "No security deposit required."}
						</p>

						<div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-neutral-200/80 p-6">
							<div className="flex items-center gap-3">
								{listing.landlordAvatar ? (
									<>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={listing.landlordAvatar}
											alt={listing.landlordName}
											className="size-12 shrink-0 rounded-full bg-neutral-900 object-cover"
										/>
									</>
								) : (
									<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xl font-bold text-white">
										{listing.landlordName.charAt(0)}
									</div>
								)}
								<div className="flex flex-col">
									<p className="font-bold text-neutral-900">{listing.landlordName}</p>
									<p className="text-sm text-neutral-500">Verified landlord</p>
								</div>
							</div>

							<ContactReveal listingId={listing.id} initialRevealed={initialRevealed} />
						</div>

						{userId && isPublished && (
							<div className="flex justify-end">
								<ReportListingButton listingId={listing.id} initialReported={initialReported} />
							</div>
						)}
					</div>
				</article>
			</section>
		</main>
	)
}

export default Page
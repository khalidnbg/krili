import DeleteListingButton from "@/components/DeleteListingButton";
import PropertyIcon from "@/components/PropertyIcon";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";
import { cn, getCoverPhotoUrl, getPropertyColor } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type EmbeddedNeighborhood = { city?: string; name?: string }

const statusStyles: Record<ListingStatus, string> = {
	pending: "bg-muted text-muted-foreground",
	published: "bg-green-100 text-green-700",
	rejected: "bg-destructive/10 text-destructive",
	rented: "bg-muted text-muted-foreground",
}

const fetchMyListings = async (landlordId: string): Promise<ModerationListing[]> => {
	const supabase = createSupabaseClient()

	const { data, error } = await supabase
		.from("listings")
		.select(`
			id, title, price_mad, rooms, has_caution, caution_amount, property_type,
			status, rejection_reason, created_at,
			neighborhoods(city, name),
			listing_photos(url, sort_order, is_cover)
		`)
		.eq("landlord_id", landlordId)
		.order("created_at", { ascending: false })

	if (error) {
		console.error("fetchMyListings failed:", error.message)
		return []
	}

	return (data ?? []).map((row) => {
		// supabase-js types embeds as arrays; PostgREST returns objects here.
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
			status: row.status as ListingStatus,
			rejectionReason: row.rejection_reason as string | null,
			landlordId,
			createdAt: row.created_at,
			photos: (row.listing_photos ?? [])
				.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
				.map((photo) => ({
					url: photo.url,
					sort_order: photo.sort_order ?? 0,
					is_cover: photo.is_cover ?? false,
				})),
		} satisfies ModerationListing
	})
}

const page = async () => {
	const { userId } = await auth()

	if (!userId) redirect("/sign-in")

	const listings = await fetchMyListings(userId)

	return (
		<main>
			<section className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-col gap-2">
					<h1>My listings</h1>
					<p className="text-lg text-muted-foreground">
						{listings.length} listing{listings.length === 1 ? "" : "s"} — manage what you've posted.
					</p>
				</div>
				<Link href="/listings/new" className="btn-primary">
					+ New listing
				</Link>
			</section>

			{listings.length === 0 ? (
				<section className="flex flex-col items-center gap-4 rounded-4xl border border-black px-8 py-14 text-center">
					<h2 className="text-2xl font-bold">You haven't posted anything yet</h2>
					<p className="text-muted-foreground">
						Create your first listing — it will appear here after a quick review.
					</p>
					<Link href="/listings/new" className="btn-primary w-fit">
						Post your first listing
					</Link>
				</section>
			) : (
				<section className="flex w-full flex-col gap-5">
					{listings.map((listing) => {
						const cover = getCoverPhotoUrl(listing)
						return (
							<article key={listing.id} className="overflow-hidden rounded-4xl border border-black">
								<div className="flex flex-wrap items-center gap-4 p-5 md:flex-nowrap">
									{/* thumbnail */}
									<Link href={`/listings/${listing.id}`} className="shrink-0">
										<div
											className="flex size-28 items-center justify-center overflow-hidden rounded-xl"
											style={{ backgroundColor: getPropertyColor(listing.type) }}
										>
											{cover ? (
												<>
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img src={cover} alt={listing.title} className="h-full w-full object-cover" />
												</>
											) : (
												<PropertyIcon type={listing.type} className="size-10" />
											)}
										</div>
									</Link>

									{/* details */}
									<Link href={`/listings/${listing.id}`} className="flex min-w-0 flex-col gap-1.5">
										<div className="flex flex-wrap items-center gap-2">
											<h2 className="text-xl font-bold">{listing.title}</h2>
											<div className="property-badge">{listing.type}</div>
										</div>
										<p className="text-sm text-muted-foreground">
											{listing.neighborhood} · {listing.city} — {listing.rooms} room{listing.rooms > 1 ? "s" : ""}
										</p>
										<p className="text-lg font-bold">
											{listing.price.toLocaleString()}{" "}
											<span className="text-sm font-normal text-muted-foreground">MAD/month</span>
										</p>
										<p className="text-xs text-muted-foreground">
											Posted {new Date(listing.createdAt).toLocaleDateString("en-GB")}
										</p>
									</Link>

									{/* status + actions */}
									<div className="flex flex-col gap-2 md:ml-auto">
										<span
											className={cn(
												"w-fit rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
												statusStyles[listing.status]
											)}
										>
											{listing.status}
										</span>

										{listing.status === "rejected" && listing.rejectionReason && (
											<p className="max-w-xs text-sm text-destructive">
												Reason: {listing.rejectionReason}
											</p>
										)}

										{/* UI-first: handlers are wired in the next step */}
										<div className="flex flex-wrap gap-2">
											<Link href={`/listings/${listing.id}/edit`}>
												<Button type="button">Edit</Button>
											</Link>
											<Link href={`/listings/${listing.id}/edit`}>
												<Button type="button" variant="outline">Photos</Button>
											</Link>
											<DeleteListingButton listingId={listing.id} />
										</div>

									</div>
								</div>
							</article>
						)
					})}
				</section>
			)}
		</main>
	)
}

export default page
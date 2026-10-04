import DeleteListingButton from "@/components/DeleteListingButton";
import MarkRentedButton from "@/components/MarkRentedButton";
import Pagination from "@/components/Pagination";
import PropertyIcon from "@/components/PropertyIcon";
import { Button } from "@/components/ui/button";
import { getContactRevealCounts } from "@/lib/actions/listing.action";
import { createSupabaseClient } from "@/lib/supabase";
import { cn, getCoverPhotoUrl, getPropertyColor } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type EmbeddedNeighborhood = { city?: string; name?: string }

const statusStyles: Record<ListingStatus, string> = {
	pending: "bg-amber-50 text-amber-700",
	published: "bg-emerald-50 text-emerald-700",
	rejected: "bg-red-50 text-red-600",
	rented: "bg-neutral-100 text-neutral-500",
}

const fetchMyListings = async (
	landlordId: string,
	from: number,
	to: number
): Promise<{ listings: ModerationListing[]; total: number }> => {
	const supabase = createSupabaseClient()

	const { data, error, count } = await supabase
		.from("listings")
		.select(`
			id, title, price_mad, rooms, has_caution, caution_amount, property_type,
			status, rejection_reason, created_at,
			neighborhoods(city, name),
			listing_photos(url, sort_order, is_cover)
		`, { count: "exact" })
		.eq("landlord_id", landlordId)
		.order("created_at", { ascending: false })
		.range(from, to)

	if (error) {
		console.error("fetchMyListings failed:", error.message)
		return { listings: [], total: 0 }
	}

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

	return { listings, total: count ?? data?.length ?? 0 }
}

const Page = async ({ searchParams }: SearchParams) => {
	const params = await searchParams
	const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1)
	const pageSize = 10
	const from = (page - 1) * pageSize
	const to = page * pageSize - 1

	const { userId } = await auth()
	if (!userId) redirect("/sign-in")

	const result = await fetchMyListings(userId, from, to)
	const listings = result.listings
	const totalPages = Math.max(1, Math.ceil(result.total / pageSize))

	const revealCounts = await getContactRevealCounts(listings.map((listing) => listing.id))

	return (
		<main className="flex flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
			<section className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-col gap-2">
					<h1 className="text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
						My listings
					</h1>
					<p className="text-lg text-neutral-500">
						{listings.length} listing{listings.length === 1 ? "" : "s"} — manage what you've posted.
					</p>
				</div>
				<Link
					href="/listings/new"
					className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
				>
					+ New listing
				</Link>
			</section>

			{listings.length === 0 ? (
				<section className="flex flex-col items-center gap-4 rounded-3xl border border-neutral-200/80 bg-white px-8 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
					<h2 className="text-2xl font-bold text-neutral-900">You haven't posted anything yet</h2>
					<p className="text-neutral-500">
						Create your first listing — it will appear here after a quick review.
					</p>
					<Link
						href="/listings/new"
						className="w-fit rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
					>
						Post your first listing
					</Link>
				</section>
			) : (
				<section className="flex w-full flex-col gap-5">
					{listings.map((listing) => {
						const cover = getCoverPhotoUrl(listing)
						return (
							<article
								key={listing.id}
								className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]"
							>
								<div className="flex flex-wrap items-center gap-4 p-5 md:flex-nowrap">
									{/* thumbnail */}
									<Link href={`/listings/${listing.id}`} className="shrink-0">
										<div
											className="flex size-28 items-center justify-center overflow-hidden rounded-2xl"
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
											<h2 className="text-xl font-bold text-neutral-900">{listing.title}</h2>
											<div className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-700">
												{listing.type}
											</div>
										</div>
										<p className="text-sm text-neutral-500">
											{listing.neighborhood} · {listing.city} — {listing.rooms} room{listing.rooms > 1 ? "s" : ""}
										</p>
										<p className="text-lg font-bold text-neutral-900">
											{listing.price.toLocaleString()}{" "}
											<span className="text-sm font-normal text-neutral-500">MAD/month</span>
										</p>
										<p className="text-xs text-neutral-400">
											Posted {new Date(listing.createdAt).toLocaleDateString("en-GB")}
										</p>
									</Link>

									{/* status + actions */}
									<div className="flex flex-col gap-2 md:ml-auto">
										<span
											className={cn(
												"w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize",
												statusStyles[listing.status]
											)}
										>
											{listing.status}
										</span>

										{(() => {
											const count = revealCounts[listing.id] ?? 0
											return count > 0 ? (
												<p className="text-xs text-neutral-500">
													{count} tenant{count === 1 ? "" : "s"} asked for your contact
												</p>
											) : (
												<p className="text-xs text-neutral-400">No contact requests yet</p>
											)
										})()}

										{listing.status === "rejected" && listing.rejectionReason && (
											<p className="max-w-xs text-sm text-red-600">
												Reason: {listing.rejectionReason}
											</p>
										)}

										<div className="flex flex-wrap gap-2">
											{(listing.status === "published" || listing.status === "rented") && (
												<MarkRentedButton listingId={listing.id} status={listing.status} />
											)}

											<Link href={`/listings/${listing.id}/edit`}>
												<Button type="button" className="rounded-full bg-neutral-900 hover:bg-neutral-800">
													Edit
												</Button>
											</Link>
											<Link href={`/listings/${listing.id}/edit`}>
												<Button type="button" variant="outline" className="rounded-full border-neutral-200">
													Photos
												</Button>
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

			<Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard" searchParams={params} />
		</main>
	)
}

export default Page
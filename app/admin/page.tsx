import Link from "next/link"
import { redirect } from "next/navigation"
import PropertyIcon from "@/components/PropertyIcon"
import ListingReviewActions from "@/components/admin/ListingReviewActions"
import { getCoverPhotoUrl, getPropertyColor } from "@/lib/utils"
import { getModerationQueue, isAdmin } from "@/lib/actions/listing.action"

const Page = async () => {
	if (!(await isAdmin())) {
		redirect("/")
	}

	const queue = (await getModerationQueue()) ?? []

	return (
		<main>
			<section className="flex flex-col gap-2">
				<h1>Moderation queue</h1>
				<p className="text-lg text-muted-foreground">
					{queue.length} listing{queue.length === 1 ? "" : "s"} waiting for review.
				</p>
			</section>

			{queue.length === 0 ? (
				<section className="flex flex-col items-center gap-4 rounded-4xl border border-black px-8 py-12 text-center">
					<h2 className="text-2xl font-bold">All caught up</h2>
					<p className="text-muted-foreground">No listings are waiting for review.</p>
					<Link href="/" className="btn-primary w-fit">Back to site</Link>
				</section>
			) : (
				<section className="flex w-full flex-col gap-6">
					{queue.map((listing) => {
						const cover = getCoverPhotoUrl(listing)
						return (
							<article key={listing.id} className="overflow-hidden rounded-4xl border border-black">
								<div className="flex flex-wrap items-start gap-4 p-6 md:flex-nowrap">
									<div
										className="size-28 shrink-0 overflow-hidden rounded-xl"
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

									<div className="flex min-w-0 flex-col gap-1.5">
										<div className="flex flex-wrap items-center gap-2">
											<h2 className="text-xl font-bold">{listing.title}</h2>
											<div className="property-badge">{listing.type}</div>
											{listing.status === "rejected" ? (
												<span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">Rejected</span>
											) : (
												<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Pending</span>
											)}
										</div>
										<p className="text-sm text-muted-foreground">
											{listing.neighborhood} · {listing.city} — {listing.rooms} room{listing.rooms > 1 ? "s" : ""}
										</p>
										<p className="text-lg font-bold">
											{listing.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">MAD/month</span>
										</p>
										<p className="text-xs text-muted-foreground">
											Landlord {listing.landlordId} · created {new Date(listing.createdAt).toLocaleString("en-GB")}
										</p>
										{listing.status === "rejected" && listing.rejectionReason && (
											<p className="text-sm text-destructive">Reason: {listing.rejectionReason}</p>
										)}
									</div>

									<div className="md:ml-auto md:w-48">
										<ListingReviewActions listingId={listing.id} status={listing.status} />
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

export default Page

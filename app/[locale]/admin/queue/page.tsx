import Link from "next/link"
import PropertyIcon from "@/components/PropertyIcon"
import ListingReviewActions from "@/components/admin/ListingReviewActions"
import Pagination from "@/components/Pagination"
import { getCoverPhotoUrl, getPropertyColor } from "@/lib/utils"
import { getModerationQueue } from "@/lib/actions/listing.action"
import { getTranslations } from "next-intl/server"

const pageSize = 10

const Page = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
	const t = await getTranslations("admin")
	const { page } = await searchParams
	const currentPage = Math.max(1, Number(page) || 1)

	const queueResult = await getModerationQueue(currentPage, pageSize)
	const queue = queueResult?.items ?? []
	const totalPages = Math.max(1, Math.ceil((queueResult?.total ?? 0) / pageSize))

	return (
		<>
			<section className="flex flex-col gap-2">
				<h1>{t("moderationQueue")}</h1>
				<p className="text-lg text-muted-foreground">
					{t("moderationSubtitle", { count: queue.length })}
				</p>
			</section>

			{queue.length === 0 ? (
				<section className="flex flex-col items-center gap-4 rounded-4xl border border-black px-8 py-12 text-center">
					<h2 className="text-2xl font-bold">{t("allCaughtUp")}</h2>
					<p className="text-muted-foreground">{t("noListingsToReview")}</p>
					<Link href="/" className="btn-primary w-fit">{t("backToSite")}</Link>
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
												<span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">{t("rejected")}</span>
											) : (
												<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{t("pending")}</span>
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
											<p className="text-sm text-destructive">{t("reason")}: {listing.rejectionReason}</p>
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

			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				basePath="/admin/queue"
				pageParam="page"
				searchParams={{}}
			/>
		</>
	)
}

export default Page
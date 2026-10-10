import Link from "next/link"
import PropertyIcon from "@/components/PropertyIcon"
import ListingReviewActions from "@/components/admin/ListingReviewActions"
import { getCoverPhotoUrl, getPropertyColor } from "@/lib/utils"
import { getModerationQueue } from "@/lib/actions/listing.action"
import { getOpenReports } from "@/lib/actions/reports.action"
import { reportReasons } from "@/constants"
import ReportReviewActions from "@/components/admin/ReportReviewActions"
import Pagination from "@/components/Pagination"
import { getUsers } from "@/lib/actions/admin-users.action"
import UsersFilter from "@/components/admin/UsersFilter"
import SuspendUserButton from "@/components/admin/SuspendUserButton"
import { getTranslations } from "next-intl/server"

const Page = async ({ searchParams, params }: { searchParams: SearchParams; params: Promise<{ locale: string }> }) => {
	const t = await getTranslations("admin")
	await params // Ensure params is awaited for Next.js 15
	const searchParamsResolved = await searchParams
	const str = (key: string) => {
		const value = searchParamsResolved[key as keyof typeof searchParamsResolved]
		return typeof value === "string" ? value : ""
	}
	const num = (key: string) => {
		const value = str(key)
		return value ? Number(value) : undefined
	}

	const pageSize = 10

	const usersPage = Math.max(1, num("usersPage") ?? 1)
	const listingsPage = Math.max(1, num("listingsPage") ?? 1)
	const reportsPage = Math.max(1, num("reportsPage") ?? 1)

	const usersSearch = str("usersSearch")
	const usersRole = str("usersRole")

	const queueResult = await getModerationQueue(listingsPage, pageSize)
	const reportsResult = await getOpenReports(reportsPage, pageSize)
	const usersResult = await getUsers({ page: usersPage, pageSize: 10, search: usersSearch, role: usersRole })

	const users = usersResult?.rows ?? []
	const queue = queueResult?.items ?? []
	const reports = reportsResult?.items ?? []

	const usersTotalPages = Math.max(1, Math.ceil((usersResult?.total ?? 0) / 10))
	const queueTotalPages = Math.max(1, Math.ceil((queueResult?.total ?? 0) / pageSize))
	const reportsTotalPages = Math.max(1, Math.ceil((reportsResult?.total ?? 0) / pageSize))

	// Params preserved for the Users paginator (filters included, page keys excluded):
	const usersParams: Record<string, string> = {}
	for (const [key, value] of Object.entries(searchParamsResolved)) {
		if (key === "usersPage" || key === "listingsPage" || key === "reportsPage") continue
		if (typeof value === "string") usersParams[key] = value
	}
	// Params shared by both paginators, minus the two page keys:
	const relistParams: Record<string, string> = {}
	for (const [key, value] of Object.entries(searchParamsResolved)) {
		if (key === "listingsPage" || key === "reportsPage") continue
		if (typeof value === "string") relistParams[key] = value
	}

	const reasonLabel = (reason: ReportReason) => {
		const labelKey = reportReasons.find((item) => item.value === reason)?.labelKey
		return labelKey ? t(labelKey) : reason
	}

	return (
		<main>
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
				currentPage={listingsPage}
				totalPages={queueTotalPages}
				basePath="/admin"
				pageParam="listingsPage"
				searchParams={relistParams}
			/>

			<section className="flex flex-col gap-2">
				<h2 className="text-2xl font-bold">
					{t("reports")}
					<span className="ml-2 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
						{reports.length}
					</span>
				</h2>
			</section>

			{reports.length === 0 ? (
				<section className="rounded-4xl border border-black px-8 py-10 text-center">
					<p className="text-muted-foreground">{t("noReports")}</p>
				</section>
			) : (
				<section className="flex w-full flex-col gap-4">
					{reports.map((report) => (
						<article key={report.id} className="overflow-hidden rounded-4xl border border-black">
							<div className="flex flex-wrap items-start gap-4 p-5 md:flex-nowrap">
								<div className="flex min-w-0 flex-1 flex-col gap-1.5">
									<div className="flex flex-wrap items-center gap-2">
										<Link href={`/listings/${report.listingId}`} className="text-xl font-bold underline-offset-2 hover:underline">
											{report.listingTitle || report.listingId}
										</Link>
										<span className="property-badge">{report.listingStatus}</span>
										<span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive normal-case">
											{reasonLabel(report.reason)}
										</span>
									</div>
									{report.details && (
										<p className="text-sm text-muted-foreground">“{report.details}”</p>
									)}
									<p className="text-xs text-muted-foreground">
										Reporter {report.reporterId} · {new Date(report.createdAt).toLocaleString("en-GB")}
									</p>
								</div>
								<div className="md:ml-auto">
									<ReportReviewActions reportId={report.id} />
								</div>
							</div>
						</article>
					))}
				</section>
			)}

			<Pagination
				currentPage={reportsPage}
				totalPages={reportsTotalPages}
				basePath="/admin"
				pageParam="reportsPage"
				searchParams={relistParams}
			/>

			<section className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-2xl font-bold">{t("users")}</h2>
					<UsersFilter search={usersSearch} role={usersRole} />
				</div>

				{users.length === 0 ? (
					<p className="text-muted-foreground">{t("noUsers")}</p>
				) : (
					<div className="overflow-x-auto rounded-4xl border border-black">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-black text-left">
									<th className="p-3">{t("name")}</th>
									<th className="p-3">{t("email")}</th>
									<th className="p-3">{t("phone")}</th>
									<th className="p-3">{t("role")}</th>
									<th className="p-3">{t("verified")}</th>
									<th className="p-3">{t("listingsCount")}</th>
									<th className="p-3">{t("joined")}</th>
									<th className="p-3">{t("actions")}</th>
								</tr>
							</thead>

							<tbody>
								{users.map((user) => (
									<tr key={user.id} className="border-b border-border last:border-0">
										<td className="p-3 font-semibold">
											{user.firstName || user.lastName
												? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
												: user.id.slice(0, 8)}
											{user.suspended && (
												<span className="ml-2 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
													{t("suspended")}
												</span>
											)}
										</td>
										<td className="p-3">{user.email ?? "—"}</td>
										<td className="p-3">{user.phone ?? "—"}</td>
										<td className="p-3 capitalize">{user.role}</td>
										<td className="p-3">
											<span className={user.phoneVerified ? "text-green-700" : "opacity-40"}>P</span>
											{" / "}
											<span className={user.idVerified ? "text-green-700" : "opacity-40"}>ID</span>
										</td>
										<td className="p-3">{user.listingCount}</td>
										<td className="p-3">{new Date(user.createdAt).toLocaleDateString("en-GB")}</td>
										<td className="p-3">
											<SuspendUserButton userId={user.id} suspended={user.suspended} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<Pagination
					currentPage={usersPage}
					totalPages={usersTotalPages}
					basePath="/admin"
					pageParam="usersPage"
					searchParams={usersParams}
				/>
			</section>
		</main>
	)
}

export default Page

import Link from "next/link"
import Pagination from "@/components/Pagination"
import ReportReviewActions from "@/components/admin/ReportReviewActions"
import { getOpenReports } from "@/lib/actions/reports.action"
import { reportReasons } from "@/constants"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import ReportsLoading from "./loading"

const pageSize = 10

async function ReportsContent({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
	const t = await getTranslations("admin")
	const { page } = await searchParams
	const currentPage = Math.max(1, Number(page) || 1)

	const reportsResult = await getOpenReports(currentPage, pageSize)
	const reports = reportsResult?.items ?? []
	const totalPages = Math.max(1, Math.ceil((reportsResult?.total ?? 0) / pageSize))

	const reasonLabel = (reason: ReportReason) => {
		const labelKey = reportReasons.find((item) => item.value === reason)?.labelKey
		return labelKey ? t(labelKey) : reason
	}

	return (
		<>
			<section className="flex flex-col gap-2">
				<h1>
					{t("reports")}
					<span className="ml-2 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
						{reportsResult?.total ?? reports.length}
					</span>
				</h1>
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
										<p className="text-sm text-muted-foreground">&ldquo;{report.details}&rdquo;</p>
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
				currentPage={currentPage}
				totalPages={totalPages}
				basePath="/admin/reports"
				pageParam="page"
				searchParams={{}}
			/>
		</>
	)
}

const Page = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
	return (
		<Suspense fallback={<ReportsLoading />}>
			<ReportsContent searchParams={searchParams} />
		</Suspense>
	)
}

export default Page
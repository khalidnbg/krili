"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface PaginationProps {
	currentPage: number
	totalPages: number
	basePath: string
	/** Existing query params to preserve. */
	searchParams?: Record<string, string | string[] | undefined>
	/** Which query key this instance controls (default "page"). */
	pageParam?: string
}

const Pagination = ({ currentPage, totalPages, basePath, searchParams = {}, pageParam = "page" }: PaginationProps) => {
	const t = useTranslations("pagination")
	if (totalPages <= 1) return null

	const buildHref = (page: number) => {
		const params = new URLSearchParams()
		for (const [key, value] of Object.entries(searchParams)) {
			if (!value || key === pageParam) continue
			params.set(key, Array.isArray(value) ? value.join(",") : value)
		}
		if (page > 1) params.set(pageParam, String(page))
		const qs = params.toString()
		return qs ? `${basePath}?${qs}` : basePath
	}

	const pages: number[] = []
	for (let p = Math.max(1, currentPage - 2); p <= Math.min(totalPages, currentPage + 2); p++) pages.push(p)

	return (
		<nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
			<Link
				href={buildHref(currentPage - 1)}
				className={cn("btn-signin px-3 py-1.5", currentPage <= 1 && "pointer-events-none opacity-40")}
			>
				<ChevronLeft className="size-4" /> {t("previous")}
			</Link>

			{pages.map((page) => (
				<Link
					key={page}
					href={buildHref(page)}
					aria-current={page === currentPage ? "page" : undefined}
					className={cn(
						"flex size-9 items-center justify-center rounded-4xl border border-black text-sm font-semibold",
						page === currentPage && "bg-black text-white"
					)}
				>
					{page}
				</Link>
			))}

			<Link
				href={buildHref(currentPage + 1)}
				className={cn("btn-signin px-3 py-1.5", currentPage >= totalPages && "pointer-events-none opacity-40")}
			>
				{t("next")} <ChevronRight className="size-4" />
			</Link>
		</nav>
	)
}

export default Pagination
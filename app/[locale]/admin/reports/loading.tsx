"use client"

import { useTranslations } from "next-intl"

export default function ReportsLoading() {
	const t = useTranslations("common")
	return (
		<main className="flex flex-col gap-6 w-full">
			<div className="h-8 w-full animate-pulse rounded-full bg-neutral-200" />
			<div className="flex flex-col gap-4 w-full">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="h-24 animate-pulse rounded-4xl bg-neutral-200" />
				))}
			</div>
			<p className="text-2xl font-medium text-neutral-400">{t("loading")}</p>
		</main>
	)
}

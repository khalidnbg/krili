"use client"

import { useTranslations } from "next-intl"

export default function UsersLoading() {
	const t = useTranslations("common")
	return (
		<main className="flex flex-col gap-6 w-full">
			<div className="h-8 w-full animate-pulse rounded-full bg-neutral-200" />
			<div className="h-64 animate-pulse rounded-4xl bg-neutral-200" />
			<p className="text-2xl font-medium text-neutral-400">{t("loading")}</p>
		</main>
	)
}

// app/[locale]/not-found.tsx
import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function NotFound() {
	const t = await getTranslations("common")

	return (
		<main className="flex min-h-[50vh] items-center justify-center px-4">
			<div className="text-center">
				<h1 className="text-4xl font-bold text-neutral-900">404</h1>
				<p className="mt-2 text-lg text-neutral-500">Page not found</p>
				<Link
					href="/"
					className="mt-6 inline-block rounded-full bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800"
				>
					{t("loading")} {/* Or add a "goHome" translation */}
				</Link>
			</div>
		</main>
	)
}
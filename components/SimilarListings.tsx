import SimilarListingCard from "./SimilarListingCard"
import { getTranslations } from "next-intl/server"

interface SimilarListingsProps {
	current: {
		id: string
		city: string
		propertyType: PropertyType
		priceMad: number
	}
	savedIds: Set<string>
	locale: string
}

export default async function SimilarListings({ current, savedIds, locale }: SimilarListingsProps) {
	const { getSimilarListings } = await import("@/lib/similar-listings")
	const similar = await getSimilarListings(current)

	if (similar.length === 0) {
		return null
	}

	const t = await getTranslations("listing")

	return (
		<section aria-labelledby="similar-heading" className="flex flex-col gap-6">
			<h2 id="similar-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
				{t("similarTitle")}
			</h2>
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{similar.map((listing) => (
					<SimilarListingCard
						key={listing.id}
						listing={listing}
						initialSaved={savedIds.has(listing.id)}
						locale={locale}
					/>
				))}
			</div>
		</section>
	)
}
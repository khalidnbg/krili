import ListingCard from "./ListingCard"
import Link from "next/link"

interface SimilarListingCardProps {
	listing: Listing
	initialSaved: boolean
	locale: string
}

export default function SimilarListingCard({ listing, initialSaved, locale }: SimilarListingCardProps) {
	return (
		<Link href={`/${locale}/listings/${listing.id}`} className="block">
			<ListingCard listing={listing} initialSaved={initialSaved} />
		</Link>
	)
}
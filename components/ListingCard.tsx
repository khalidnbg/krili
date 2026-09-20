import Link from "next/link"
import Image from "next/image"
import { MapPin } from "lucide-react"
import PropertyIcon from "@/components/PropertyIcon"
import { getPropertyColor, getCoverPhotoUrl } from "@/lib/utils"

interface ListingCardProps {
	listing: Listing
}

const ListingCard = ({ listing }: ListingCardProps) => {
	const { id, title, type, price, rooms, neighborhood, city, bookmarked } = listing
	const cover = getCoverPhotoUrl(listing)

	return (
		<article className="listing-card" style={{ backgroundColor: getPropertyColor(type) }}>
			<div className="flex justify-between items-center">
				<div className="property-badge">{type}</div>
				<button className="listing-bookmark" aria-label="Save listing">
					<Image
						src={bookmarked ? "/icons/bookmark-filled.svg" : "/icons/bookmark.svg"}
						alt="bookmark"
						width={12.5}
						height={15}
					/>
				</button>
			</div>

			{cover && (
				<div className="relative h-[200px] sm:h-[230px] md:h-[250px] w-full overflow-hidden rounded-2xl">
					<img
						src={cover}
						alt={title}
						className="h-full w-full object-cover"
					/>
				</div>
			)}


			<h2 className="text-2xl font-bold">{title}</h2>

			<p className="text-sm flex items-center gap-1.5">
				<MapPin className="size-4" />
				{neighborhood}, {city}
			</p>

			<div className="flex items-center gap-1.5">
				<PropertyIcon type={type} className="size-5" />
				<p className="text-sm">
					{rooms} room{rooms > 1 ? "s" : ""}
				</p>
			</div>

			<p className="text-xl font-bold">
				{price.toLocaleString()}
				<span className="text-sm font-normal"> MAD/month</span>
			</p>

			<Link href={`/listings/${id}`} className="w-full">
				<button className="btn-primary w-full justify-center">
					View Details
				</button>
			</Link>
		</article>
	);
}

export default ListingCard
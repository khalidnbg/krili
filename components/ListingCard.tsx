import Link from "next/link"
import { MapPin } from "lucide-react"
import PropertyIcon from "@/components/PropertyIcon"
import { getPropertyColor, getCoverPhotoUrl } from "@/lib/utils"
import BookmarkButton from "./BookmarkButton"
import { useTranslations } from "next-intl"

interface ListingCardProps {
  listing: Listing
  initialSaved?: boolean
}

const ListingCard = ({ listing, initialSaved }: ListingCardProps) => {
  const { id, title, type, price, rooms, neighborhood, city, bookmarked } = listing
  const t = useTranslations("listingCard")

  const cover = getCoverPhotoUrl(listing)

  return (
    <article className="group flex flex-col gap-4 rounded-3xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-12px_rgba(0,0,0,0.14)]">
      <div className="relative overflow-hidden rounded-2xl">
        {cover ? (
          <div className="relative h-[200px] w-full sm:h-[230px] md:h-[250px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div
            className="flex h-[200px] w-full items-center justify-center sm:h-[230px] md:h-[250px]"
            style={{ backgroundColor: getPropertyColor(type) }}
          >
            <PropertyIcon type={type} className="size-16" />
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium capitalize text-neutral-900 backdrop-blur-sm">
          {type}
        </div>

        <div className="absolute right-3 top-3">
          <BookmarkButton listingId={id} initialSaved={initialSaved ?? bookmarked} />
        </div>
      </div>

      <div className="flex flex-col gap-2 px-1">
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>

        <p className="flex items-center gap-1.5 text-sm text-neutral-500">
          <MapPin className="size-4" />
          {neighborhood}, {city}
        </p>

        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
          <PropertyIcon type={type} className="size-4" />
          {t("rooms", { count: rooms })}
        </div>

        <p className="pt-1 text-lg font-bold text-neutral-900">
          {price.toLocaleString()}
          <span className="text-sm font-normal text-neutral-500"> MAD/month</span>
        </p>
      </div>

      <Link href={`/listings/${id}`} className="w-full px-1 pb-1">
        <button className="w-full rounded-full bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
          {t("viewDetails")}
        </button>
      </Link>
    </article>
  )
}

export default ListingCard
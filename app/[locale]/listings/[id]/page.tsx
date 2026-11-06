// app/[locale]/listings/[id]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import PropertyIcon from "@/components/PropertyIcon"
import { getPropertyColor } from "@/lib/utils"
import { createSupabaseClient } from "@/lib/supabase"
import ListingPhotoGallery from "@/components/ListingPhotoGallery"
import ContactReveal from "@/components/ContactReveal"
import { auth } from "@clerk/nextjs/server"
import { getLandlordProfiles, mapListingRow } from "@/lib/listing-mapper"
import ReportListingButton from "@/components/ReportListingButton"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import ListingDetailLoading from "./loading"
import { Check } from "lucide-react"
import Image from "next/image"
import { getPublicListing, ogImageUrl, truncateDescription, siteUrl } from "@/lib/seo"
import type { Metadata } from "next"
import ShareListingButton from "@/components/ShareListingButton"

// Generate metadata for published listings
export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params
  const tType = await getTranslations("propertyType")

  const listing = await getPublicListing(id)

  // If not found or not published, let notFound() handle it in the page component
  if (!listing) {
    return {
      title: "Not Found",
      robots: { index: false, follow: false },
    }
  }

  const propertyTypeLabel = tType(listing.type)
  const title = `${listing.title} | ${propertyTypeLabel} à ${listing.neighborhood}, ${listing.city}`

  const description = listing.description
    ? truncateDescription(listing.description)
    : `${propertyTypeLabel} de ${listing.rooms} pièces à ${listing.neighborhood}, ${listing.city}: ${listing.price.toLocaleString()} MAD/mois. ${listing.beds} ch., ${listing.bathrooms} sdb.`

  const coverPhoto = listing.photos?.find(p => p.is_cover)?.url || listing.photos?.[0]?.url
  const ogImage = coverPhoto ? ogImageUrl(coverPhoto) : `${siteUrl()}/opengraph-image?locale=${locale}`

  const canonical = `/${locale}/listings/${id}`

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/listings/${id}`,
      languages: {
        fr: `/fr/listings/${id}`,
        ar: `/ar/listings/${id}`,
        "x-default": `/fr/listings/${id}`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${siteUrl()}${canonical}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}

const Page = async ({ params }: { params: Promise<{ id: string; locale: string }> }) => {
  return (
    <Suspense fallback={<ListingDetailLoading />}>
      <ListingDetailContent params={params} />
    </Suspense>
  )
}

async function ListingDetailContent({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params
  const { userId } = await auth()
  const t = await getTranslations("listings.detail")
  const tAmenity = await getTranslations("amenity")
  const tType = await getTranslations("propertyType")

  // Try public listing first (anon client, published only)
  let listing = await getPublicListing(id)
  const propertyTypeLabel = listing ? tType(listing.type) : ""
  let isPublished = true

  // If not published, check if user is the owner (for preview)
  if (!listing && userId) {
    const supabase = createSupabaseClient()
    const { data: row } = await supabase
      .from("listings")
      .select(`
				id, landlord_id, status, title, price_mad, rooms, beds, bathrooms, furnished, pet_friendly, amenities,
				available_from, description, has_caution, caution_amount, property_type,
				neighborhoods(city, name), listing_photos(url, sort_order, is_cover)
			`)
      .eq("id", id)
      .eq("landlord_id", userId)
      .maybeSingle()

    if (row) {
      const profile = (await getLandlordProfiles([row.landlord_id]))[row.landlord_id]
      listing = mapListingRow(row, profile)
      isPublished = row.status === "published"
    }
  }

  // Real 404 for non-existent or inaccessible listings
  if (!listing) {
    notFound()
  }

  const canonicalUrl = `${siteUrl()}/${locale}/listings/${listing.id}`

  let initialRevealed = false
  if (userId && listing) {
    const supabase = createSupabaseClient()
    const { data: reveal } = await supabase
      .from("contact_reveals")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("tenant_id", userId)
      .maybeSingle()
    initialRevealed = !!reveal
  }

  let initialReported = false
  if (userId && listing) {
    const supabase = createSupabaseClient()
    const { data: report } = await supabase
      .from("reports")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("reporter_id", userId)
      .eq("status", "open")
      .maybeSingle()
    initialReported = !!report
  }

  // Build JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description || undefined,
    url: `${siteUrl()}/${locale}/listings/${listing.id}`,
    image: listing.photos?.slice(0, 5).map(p => p.url) || undefined,
    datePosted: listing.photos?.[0]?.url ? undefined : new Date().toISOString(), // Fallback if no created_at in mapped type
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "MAD",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "PriceSpecification",
        price: listing.price,
        priceCurrency: "MAD",
        unitText: "MONTH",
      },
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city,
      addressRegion: listing.neighborhood,
      addressCountry: "MA",
    },
    numberOfRooms: listing.rooms,
    numberOfBedrooms: listing.beds,
    petsAllowed: listing.petFriendly || undefined,
    amenityFeature: listing.amenities?.map(a => ({
      "@type": "LocationFeatureSpecification",
      name: a,
    })) || undefined,
  }

  return (
    <main className="flex flex-col gap-6 px-4 py-10 md:px-8 md:py-14">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <Link
        href={`/${locale}/listings`}
        className="w-fit rounded-full px-4 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        {t("backToListings")}
      </Link>

      <section className="w-full">
        <article className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
          {listing.photos && listing.photos.length > 0 ? (
            <ListingPhotoGallery
              photos={listing.photos.map(({ url, is_cover }) => ({ url, is_cover }))}
              title={listing.title}
            />
          ) : (
            <div
              className="flex h-64 items-center justify-center max-md:h-40"
              style={{ backgroundColor: getPropertyColor(listing.type) }}
            >
              <PropertyIcon type={listing.type} className="size-24 max-md:size-16" />
            </div>
          )}

          <div className="flex flex-col gap-5 p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
                  {listing.title}
                </h1>
                <p className="text-neutral-500">
                  {listing.neighborhood} · {listing.city}
                </p>
              </div>
              <div className="h-fit w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-700">
                {listing.type}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-2xl font-bold text-neutral-900">
              <p>
                {listing.price.toLocaleString()}
                <span className="text-sm font-normal text-neutral-500"> MAD/month</span>
              </p>
              <span className="font-normal text-neutral-300">·</span>
              <p>{t("room", { count: listing.rooms })}</p>
              {listing.furnished && (
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {t("furnished")}
                </span>
              )}
              {listing.petFriendly && (
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {t("petFriendly")}
                </span>
              )}
            </div>

            {listing.description && (
              <p className="max-w-2xl text-lg text-neutral-700">{listing.description}</p>
            )}

            {listing.amenities && listing.amenities.length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-neutral-900">{t("amenities")}</h3>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
                  {listing.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/60 px-4 py-3 text-sm font-medium text-neutral-800 transition-colors hover:border-[#FE5933]/40 hover:bg-[#FE5933]/5"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FE5933]/10 text-[#FE5933]">
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                      <span className="leading-tight">{tAmenity(amenity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {listing.availableFrom && (
              <p className="text-sm text-neutral-500">
                {t("availableFrom", { date: new Date(`${listing.availableFrom}T00:00:00`).toLocaleDateString(locale === "fr" ? "fr-FR" : "ar-MA", { day: "numeric", month: "long", year: "numeric" }) })}
              </p>
            )}

            <p className="text-sm text-neutral-500">
              {listing.hasCaution
                ? t("securityDeposit", { amount: (listing.cautionAmount ?? 0).toLocaleString() })
                : t("noSecurityDeposit")}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-neutral-200/80 p-6">
              <div className="flex items-center gap-3">
                {listing.landlordAvatar ? (
                  <Image
                    src={listing.landlordAvatar}
                    alt={listing.landlordName}
                    width={48}
                    height={48}
                    className="size-12 shrink-0 rounded-full bg-neutral-900 object-cover"
                  />
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xl font-bold text-white">
                    {listing.landlordName.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col">
                  <p className="font-bold text-neutral-900">{listing.landlordName}</p>
                  <p className="text-sm text-neutral-500">{t("verifiedLandlord")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isPublished && (
                  <ShareListingButton
                    title={listing.title}
                    priceMad={listing.price}
                    city={listing.city}
                    neighborhood={listing.neighborhood}
                    propertyTypeLabel={propertyTypeLabel}
                  />
                )}
                <ContactReveal listingId={listing.id} initialRevealed={initialRevealed} />
              </div>
            </div>
          </div>

          {userId && isPublished && (
            <div className="flex justify-end">
              <ReportListingButton listingId={listing.id} initialReported={initialReported} />
            </div>
          )}
        </article>
      </section>
    </main>
  )
}

export default Page
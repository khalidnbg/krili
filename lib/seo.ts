import { cities, propertyTypes } from "@/constants"
import { mapListingRow } from "./listing-mapper"
import { createAnonSupabaseClient } from "./supabase"

/**
 * Get the site URL from environment variable.
 * Throws in production if missing, falls back to localhost in dev.
 */
export function siteUrl(): string {
	const url = process.env.NEXT_PUBLIC_APP_URL
	if (!url) {
		if (process.env.NODE_ENV === "production") {
			throw new Error("NEXT_PUBLIC_APP_URL is required in production")
		}
		return "http://localhost:3000"
	}
	return url.replace(/\/$/, "") // Remove trailing slash
}

/**
 * Transform a Cloudinary URL to OG image size (1200x630).
 * If not a Cloudinary URL, returns it unchanged.
 */
export function ogImageUrl(url: string): string {
	if (!url) return url
	// Cloudinary URLs contain /upload/ - insert transform after it
	const match = url.match(/(\/upload\/)(.*)/)
	if (match) {
		return url.replace(/\/upload\//, "/upload/c_fill,w_1200,h_630,f_auto,q_auto/")
	}
	return url
}

/**
 * Truncate description to ~155 chars, collapsing whitespace.
 */
export function truncateDescription(description: string | null | undefined, maxLength: number = 155): string {
	if (!description) return ""
	const collapsed = description.replace(/\s+/g, " ").trim()
	if (collapsed.length <= maxLength) return collapsed
	return collapsed.slice(0, maxLength - 3) + "..."
}

/**
 * Fetch a single published listing for SEO metadata.
 * Returns null if not found or not published.
 * Uses anon client (no auth) - RLS ensures only published listings are visible.
 */
export async function getPublicListing(id: string) {
	const supabase = createAnonSupabaseClient()

	const { data: row } = await supabase
		.from("listings")
		.select(`
            id, landlord_id, status, title, price_mad, rooms, beds, bathrooms, furnished, pet_friendly, amenities,
            available_from, description, has_caution, caution_amount, property_type, created_at, updated_at,
            neighborhoods(city, name), listing_photos(url, sort_order, is_cover)
        `)
		.eq("id", id)
		.eq("status", "published")
		.maybeSingle()

	if (!row) return null

	// Don't fetch landlord profile for SEO (no contact data in metadata)
	return mapListingRow(row, undefined)
}

/**
 * Get all distinct city/type combinations that have published listings.
 * Used for sitemap generation.
 */
export async function getPublishedCityTypeCombos() {
	const supabase = createAnonSupabaseClient()

	const { data } = await supabase
		.from("listings")
		.select("neighborhoods(city), property_type")
		.eq("status", "published")

	const combos = new Set<string>()
	for (const row of data ?? []) {
		const neighborhood = row.neighborhoods as { city?: string } | { city?: string }[] | null
		const city = Array.isArray(neighborhood) ? neighborhood[0]?.city : neighborhood?.city
		const type = row.property_type
		if (city && type) {
			combos.add(`${city}:${type}`)
			combos.add(city) // Also track city alone
		}
	}
	return Array.from(combos)
}

/**
 * Get all published listing IDs and timestamps for sitemap.
 */
export async function getPublishedListingsForSitemap() {
	const supabase = createAnonSupabaseClient()

	const { data } = await supabase
		.from("listings")
		.select("id, updated_at")
		.eq("status", "published")
		.limit(45000) // Stay under 50k URL limit

	return data ?? []
}

/**
 * Validate if a city/type value is in our constants.
 */
export function isValidCity(value: string): value is typeof cities[number] {
	return cities.includes(value as typeof cities[number])
}

export function isValidPropertyType(value: string): value is typeof propertyTypes[number] {
	return propertyTypes.includes(value as typeof propertyTypes[number])
}
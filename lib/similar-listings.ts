import { createSupabaseClient } from "./supabase"
import { getLandlordProfiles, mapListingRow } from "./listing-mapper"

export const SIMILAR_LIMIT = 4
const PRICE_BAND = 0.25 // ±25%
const POOL_SIZE = 24 // candidates fetched per tier before ranking

type SimilarInput = {
	id: string
	city: string
	propertyType: PropertyType
	priceMad: number
}

export async function getSimilarListings(current: SimilarInput): Promise<Listing[]> {
	try {
		const results: Listing[] = []
		const collectedIds = new Set<string>([current.id])

		// Calculate price band if valid
		let minPrice: number | null = null
		let maxPrice: number | null = null
		if (current.priceMad && current.priceMad > 0) {
			minPrice = Math.round(current.priceMad * (1 - PRICE_BAND))
			maxPrice = Math.round(current.priceMad * (1 + PRICE_BAND))
		}

		const select = "id, landlord_id, title, price_mad, rooms, beds, bathrooms, furnished, pet_friendly, available_from, description, has_caution, caution_amount, property_type, amenities, neighborhoods!inner(city, name), listing_photos(url, sort_order, is_cover)"

		// Tier 1: same city AND same property type AND price within band
		if (results.length < SIMILAR_LIMIT) {
			const tier1 = await fetchTier({
				city: current.city,
				propertyType: current.propertyType,
				minPrice,
				maxPrice,
				excludeIds: collectedIds,
				select,
			})
			addRankedResults(tier1, current.priceMad, results, collectedIds)
		}

		// Tier 2: same city, ANY type, price within band
		if (results.length < SIMILAR_LIMIT) {
			const tier2 = await fetchTier({
				city: current.city,
				propertyType: null,
				minPrice,
				maxPrice,
				excludeIds: collectedIds,
				select,
			})
			addRankedResults(tier2, current.priceMad, results, collectedIds)
		}

		// Tier 3: same property type, ANY city, price within band
		if (results.length < SIMILAR_LIMIT) {
			const tier3 = await fetchTier({
				city: null,
				propertyType: current.propertyType,
				minPrice,
				maxPrice,
				excludeIds: collectedIds,
				select,
			})
			addRankedResults(tier3, current.priceMad, results, collectedIds)
		}

		return results.slice(0, SIMILAR_LIMIT)
	} catch (error) {
		console.error("getSimilarListings failed:", error)
		return []
	}
}

type TierParams = {
	city: string | null
	propertyType: PropertyType | null
	minPrice: number | null
	maxPrice: number | null
	excludeIds: Set<string>
	select: string
}

async function fetchTier(params: TierParams): Promise<Listing[]> {
	const { city, propertyType, minPrice, maxPrice, excludeIds } = params

	let query = createSupabaseClient()
		.from("listings")
		.select(`
            id,
            landlord_id,
            title,
            price_mad,
            rooms,
            beds,
            bathrooms,
            furnished,
            pet_friendly,
            available_from,
            description,
            has_caution,
            caution_amount,
            property_type,
            amenities,
            neighborhoods!inner(city, name),
            listing_photos(url, sort_order, is_cover)
        `)
		.eq("status", "published")
		.order("created_at", { ascending: false })
		.limit(POOL_SIZE)

	if (city) {
		query = query.ilike("neighborhoods.city", city)
	}

	if (propertyType) {
		query = query.eq("property_type", propertyType)
	}

	if (minPrice !== null) {
		query = query.gte("price_mad", minPrice)
	}

	if (maxPrice !== null) {
		query = query.lte("price_mad", maxPrice)
	}

	const { data, error } = await query

	if (error) {
		console.error("fetchTier failed:", error)
		return []
	}

	if (!data?.length) return []

	const filtered = data.filter(row => !excludeIds.has(row.id))

	const landlordIds = filtered
		.map(row => row.landlord_id)
		.filter(Boolean)

	const landlords = await getLandlordProfiles(landlordIds)

	return filtered.map(row => mapListingRow(row, landlords[row.landlord_id]))
}

function addRankedResults(
	candidates: Listing[],
	currentPrice: number,
	results: Listing[],
	collectedIds: Set<string>
) {
	// Rank by price closeness (ascending)
	const ranked = [...candidates].sort((a, b) => {
		const priceDiffA = Math.abs(a.price - currentPrice)
		const priceDiffB = Math.abs(b.price - currentPrice)
		return priceDiffA - priceDiffB
	})

	for (const listing of ranked) {
		if (results.length >= SIMILAR_LIMIT) break
		if (!collectedIds.has(listing.id)) {
			results.push(listing)
			collectedIds.add(listing.id)
		}
	}
}
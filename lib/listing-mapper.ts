import { createServiceRoleClient } from "./supabase"

export type LandlordProfile = {
	id: string
	firstName: string
	lastName: string
	avatarUrl: string | null
}

// Profiles RLS lets users read only their own row — the public pages fetch
// landlord names/avatars via the service role (read-only, non-sensitive).
export async function getLandlordProfiles(
	ids: string[]
): Promise<Record<string, LandlordProfile>> {
	const unique = [...new Set(ids)].filter(Boolean)
	if (!unique.length) return {}

	const { data } = await createServiceRoleClient()
		.from("profiles")
		.select("id, first_name, last_name, avatar_url")
		.in("id", unique)

	const result: Record<string, LandlordProfile> = {}
	for (const row of data ?? []) {
		result[row.id] = {
			id: row.id,
			firstName: row.first_name ?? "",
			lastName: row.last_name ?? "",
			avatarUrl: row.avatar_url ?? null,
		}
	}
	return result
}

export const landlordDisplayName = (profile?: LandlordProfile) => {
	const name = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
	return name || "Landlord"
}

type ListingRow = {
	id: string
	landlord_id?: string
	title: string
	price_mad: number
	rooms: number
	beds?: number | null
	bathrooms?: number | null
	furnished?: boolean | null
	pet_friendly?: boolean | null
	available_from?: string | null
	amenities?: string[] | null
	description?: string | null
	has_caution?: boolean | null
	caution_amount?: number | null
	property_type?: string | null
	neighborhoods?: { city?: string; name?: string } | { city?: string; name?: string }[] | null
	listing_photos?: { url: string; sort_order?: number | null; is_cover?: boolean | null }[] | null
}

export const mapListingRow = (row: ListingRow, landlord?: LandlordProfile): Listing => {
	const rawNeighborhood = row.neighborhoods as unknown as
		| { city?: string; name?: string }
		| { city?: string; name?: string }[]
		| null
	const neighborhood = Array.isArray(rawNeighborhood) ? rawNeighborhood[0] : rawNeighborhood

	return {
		id: row.id,
		title: row.title,
		type: (row.property_type as PropertyType) || "house",
		price: row.price_mad,
		rooms: row.rooms,
		beds: row.beds ?? row.rooms,
		bathrooms: row.bathrooms ?? 1,
		furnished: row.furnished ?? false,
		petFriendly: row.pet_friendly ?? false,
		availableFrom: row.available_from ?? undefined,
		amenities: row.amenities ?? [],
		neighborhood: neighborhood?.name ?? "",
		city: neighborhood?.city ?? "",
		description: row.description ?? "",
		landlordName: landlordDisplayName(landlord),
		landlordAvatar: landlord?.avatarUrl ?? undefined,
		hasCaution: row.has_caution ?? false,
		cautionAmount: row.caution_amount ?? undefined,
		bookmarked: false,
		photos: (row.listing_photos ?? [])
			.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
			.map((photo) => ({
				url: photo.url,
				sort_order: photo.sort_order ?? 0,
				is_cover: photo.is_cover ?? false,
			})),
	}
}

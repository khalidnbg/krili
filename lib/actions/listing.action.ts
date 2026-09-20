"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceRoleClient, createSupabaseClient } from "../supabase";
import { } from "@/components/ListingForm";
import { ListingFormValues, listingSchema } from "../schema";
import { createHash } from "node:crypto";

type EmbeddedNeighborhood = {
	city?: string
	name?: string
}

const adminSupabase = () => {
	if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
	return createServiceRoleClient()
}

async function uploadPhotoToCloudinary(file: File, publicId: string) {
	const cloudName = process.env.CLOUDINARY_CLOUD_NAME
	const apiKey = process.env.CLOUDINARY_API_KEY
	const apiSecret = process.env.CLOUDINARY_API_SECRET

	if (!cloudName || !apiKey || !apiSecret) {
		throw new Error("Cloudinary environment variables are missing")
	}

	const timestamp = Math.floor(Date.now() / 1000).toString()

	// Signed upload: alphabetically-sorted params, joined with "&", + API secret, SHA1.
	const signature = createHash("sha1")
		.update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
		.digest("hex")

	const form = new FormData()
	form.append("file", file)
	form.append("public_id", publicId)
	form.append("timestamp", timestamp)
	form.append("api_key", apiKey)
	form.append("signature", signature)

	const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
		method: "POST",
		body: form,
	})

	const payload = (await response.json()) as { secure_url?: string; error?: { message?: string } }

	if (!response.ok || !payload.secure_url) {
		throw new Error(payload.error?.message ?? `Cloudinary upload failed (HTTP ${response.status})`)
	}

	// Serve auto-optimized images straight from Cloudinary's CDN.
	return payload.secure_url.replace("/image/upload/", "/image/upload/q_auto,f_auto/")

}

export async function createListing(
	input: ListingFormValues,
	photos: File[] = [],
	coverIndex = 0,
) {
	// Never trust the client — re-validate on the server.
	const parsed = listingSchema.safeParse(input);
	if (!parsed.success) {
		console.error("createListing: Validation failed", parsed.error);
		return null;
	}

	const { userId } = await auth();
	if (!userId) return null;

	const supabase = createSupabaseClient();

	// 1) Resolve the neighborhood lookup row (city + name → id).
	const { data: existing } = await supabase
		.from("neighborhoods")
		.select("id")
		.eq("name", parsed.data.neighborhood)
		.eq("city", parsed.data.city)
		.maybeSingle();

	let neighborhoodId = existing?.id;

	if (!neighborhoodId) {
		const { data: created, error: createError } = await supabase
			.from("neighborhoods")
			.insert({ name: parsed.data.neighborhood, city: parsed.data.city })
			.select("id")
			.maybeSingle();

		if (createError) {
			console.error(
				"createListing could not create neighborhood:",
				createError.message,
			);
			return null;
		}

		neighborhoodId = created?.id;
	}

	if (!neighborhoodId) {
		console.error("createListing could not resolve a neighborhood_id");
		return null;
	}

	// 2) Insert the listing. RLS ties it to the Clerk user via the JWT sub claim;
	//    status defaults to "pending". property_type persists the selected type.
	const { data, error } = await supabase
		.from("listings")
		.insert({
			landlord_id: userId,
			neighborhood_id: neighborhoodId,
			title: parsed.data.title,
			property_type: parsed.data.type,
			price_mad: parsed.data.price,
			rooms: parsed.data.rooms,
			has_caution: parsed.data.hasCaution,
			caution_amount: parsed.data.cautionAmount
				? parsed.data.cautionAmount
				: null,
		})
		.select()
		.single();

	if (error || !data) {
		console.error("createListing failed:", error?.message);
		return null;
	}

	// 3) Upload photos to Cloudinary and persist them in listing_photos.
	//    Per-photo failures are logged and don't roll back the listing.
	const uploaded: ListingPhoto[] = []

	if (photos.length > 0) {
		const results = await Promise.allSettled(
			photos.map((file, index) =>
				uploadPhotoToCloudinary(file, `${userId}/${data.id}-${index}`).then((url) => ({
					url,
					sort_order: index,
					is_cover: index === coverIndex,
				}))
			)
		)

		for (const result of results) {
			if (result.status === "fulfilled") {
				uploaded.push(result.value)
			} else {
				console.error("Photo upload failed:", result.reason)
			}
		}

		if (uploaded.length > 0) {
			const { error: photosError } = await supabase
				.from("listing_photos")
				.insert(
					uploaded.map((photo) => ({
						listing_id: data.id,
						url: photo.url,
						sort_order: photo.sort_order,
						is_cover: photo.is_cover,
					}))
				)

			if (photosError) {
				console.error("listing_photos insert failed:", photosError.message)
			}
		}

	}

	return {
		id: data.id,
		title: data.title,
		type: parsed.data.type,
		price: data.price_mad,
		rooms: data.rooms,
		neighborhood: parsed.data.neighborhood,
		city: parsed.data.city,
		description: "",
		landlordName: "Landlord",
		hasCaution: data.has_caution,
		cautionAmount: data.caution_amount,
		bookmarked: false,
		photos: uploaded,
	} satisfies Listing;
}

export const fetchListings = async () => {
	const supabase = createSupabaseClient()

	const { data, error } = await supabase
		.from("listings")
		.select(
			"id, title, price_mad, rooms, has_caution, caution_amount, property_type, neighborhoods(city, name), listing_photos(url, sort_order, is_cover)"
		)
		.eq("status", "published")
		.order("created_at", { ascending: false })
		.limit(12)

	if (error) {
		console.error("Failed to fetch listings:", error.message)
		return null
	}

	if (!data?.length) {
		return null
	}

	return data.map((row) => {
		const rawNeighborhood = row.neighborhoods as unknown as
			| EmbeddedNeighborhood
			| EmbeddedNeighborhood[]
			| null

		const neighborhood = Array.isArray(rawNeighborhood)
			? rawNeighborhood[0]
			: rawNeighborhood

		return {
			id: row.id,
			title: row.title,
			type: (row.property_type as PropertyType) || "house",
			price: row.price_mad,
			rooms: row.rooms,
			neighborhood: neighborhood?.name ?? "",
			city: neighborhood?.city ?? "",
			description: "",
			landlordName: "Landlord",
			hasCaution: row.has_caution,
			cautionAmount: row.caution_amount,
			bookmarked: false,

			photos: (row.listing_photos ?? [])
				.sort(
					(a, b) =>
						(a.sort_order ?? 0) - (b.sort_order ?? 0)
				)
				.map((photo) => ({
					url: photo.url,
					sort_order: photo.sort_order ?? 0,
					is_cover: photo.is_cover ?? false,
				})),
		} satisfies Listing
	})
}

export const isAdmin = async () => {
	const user = await currentUser()
	if (!user) return false

	// Clerk dashboard → public metadata {"role": "admin"}
	if (user.publicMetadata?.role === "admin") return true

	// ...or an explicit allow-list in .env
	const admins = (process.env.ADMIN_USER_IDS ?? "")
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean)
	return admins.includes(user.id)
}

export async function getModerationQueue(): Promise<ModerationListing[] | null> {
	if (!(await isAdmin())) return null
	const supabase = adminSupabase()
	if (!supabase) {
		console.error("getModerationQueue: SUPABASE_SERVICE_ROLE_KEY is not set")
		return null
	}

	const { data, error } = await supabase
		.from("listings")
		.select(`
			id, title, price_mad, rooms, has_caution, caution_amount, property_type,
			status, rejection_reason, landlord_id, created_at,
			neighborhoods(city, name),
			listing_photos(url, sort_order, is_cover)
		`)
		.in("status", ["pending", "rejected"])
		.order("created_at", { ascending: false })

	console.log("data : ", data)

	if (error) {
		console.error("getModerationQueue failed:", error.message)
		return null
	}

	return (data ?? []).map((row: any) => {
		// supabase-js types embeds as arrays; PostgREST returns objects here.
		const rawNeighborhood = row.neighborhoods as unknown as
			| EmbeddedNeighborhood
			| EmbeddedNeighborhood[]
			| null
		const neighborhood = Array.isArray(rawNeighborhood) ? rawNeighborhood[0] : rawNeighborhood

		return {
			id: row.id,
			title: row.title,
			type: (row.property_type as PropertyType) || "house",
			price: row.price_mad,
			rooms: row.rooms,
			neighborhood: neighborhood?.name ?? "",
			city: neighborhood?.city ?? "",
			status: row.status as ListingStatus,
			rejectionReason: row.rejection_reason as string | null,
			landlordId: row.landlord_id,
			createdAt: row.created_at,
			photos: (row.listing_photos ?? [])
				.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
				.map((photo: any) => ({
					url: photo.url,
					sort_order: photo.sort_order ?? 0,
					is_cover: photo.is_cover ?? false,
				})),
		} satisfies ModerationListing
	})
}

export type AdminActionResult = { ok: boolean; error?: string }

export async function approveListing(id: string): Promise<AdminActionResult> {
	if (!(await isAdmin())) return { ok: false, error: "Forbidden" }
	const supabase = adminSupabase()
	if (!supabase) return { ok: false, error: "Service role key not configured" }

	const { error } = await supabase
		.from("listings")
		.update({ status: "published", rejection_reason: null })
		.eq("id", id)

	return error ? { ok: false, error: error.message } : { ok: true }
}

export async function rejectListing(id: string, reason: string): Promise<AdminActionResult> {
	if (!(await isAdmin())) return { ok: false, error: "Forbidden" }
	const trimmed = reason.trim()
	if (!trimmed) return { ok: false, error: "A rejection reason is required." }
	const supabase = adminSupabase()
	if (!supabase) return { ok: false, error: "Service role key not configured" }

	const { error } = await supabase
		.from("listings")
		.update({ status: "rejected", rejection_reason: trimmed })
		.eq("id", id)

	return error ? { ok: false, error: error.message } : { ok: true }
}
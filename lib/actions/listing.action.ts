"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceRoleClient, createSupabaseClient } from "../supabase";
import { } from "@/components/ListingForm";
import { ListingFormValues, listingSchema } from "../schema";
import { createHash } from "node:crypto";
import { getLandlordProfiles, mapListingRow } from "../listing-mapper";

type EmbeddedNeighborhood = {
	city?: string
	name?: string
}

export type AdminActionResult = { ok: boolean; error?: string }

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
			beds: parsed.data.beds ?? parsed.data.rooms,
			bathrooms: parsed.data.bathrooms ?? 1,
			furnished: parsed.data.furnished,
			pet_friendly: parsed.data.petFriendly,
			available_from: parsed.data.availableFrom || null,
			description: parsed.data.description ?? "",
			has_caution: parsed.data.hasCaution,
			caution_amount: parsed.data.hasCaution ? parsed.data.cautionAmount : null,
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
	const { data, error } = await createSupabaseClient()
		.from("listings")
		.select(
			"id, landlord_id, title, price_mad, rooms, beds, bathrooms, furnished, pet_friendly, available_from, description, has_caution, caution_amount, property_type, neighborhoods(city, name), listing_photos(url, sort_order, is_cover)"
		)
		.eq("status", "published")
		.order("created_at", { ascending: false })
		.limit(12)

	if (error || !data?.length) return null

	const landlords = await getLandlordProfiles(data.map((row) => row.landlord_id))
	return data.map((row) => mapListingRow(row, landlords[row.landlord_id]))
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


/* ---------- helpers ---------- */

async function resolveNeighborhoodId(
	supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
	city: string,
	name: string
) {
	const { data: existing } = await supabase
		.from("neighborhoods")
		.select("id")
		.eq("city", city)
		.eq("name", name)
		.maybeSingle()
	if (existing?.id) return existing.id

	const { data: created } = await supabase
		.from("neighborhoods")
		.insert({ city, name })
		.select("id")
		.maybeSingle()
	return created?.id ?? null
}

const publicIdFromUrl = (url: string) => {
	const after = url.split("/image/upload/")[1] ?? ""
	// strip transform segments (q_auto,f_auto) and the /v123… version
	return after
		.split("/")
		.filter((seg) => !seg.includes(",") && !/^v\d+$/.test(seg))
		.join("/")
}

async function destroyCloudinaryUrl(url: string) {
	if (!url) return
	const cloudName = process.env.CLOUDINARY_CLOUD_NAME
	const apiKey = process.env.CLOUDINARY_API_KEY
	const apiSecret = process.env.CLOUDINARY_API_SECRET
	if (!cloudName || !apiKey || !apiSecret) return

	const publicId = publicIdFromUrl(url)
	const timestamp = Math.floor(Date.now() / 1000).toString()
	const signature = createHash("sha1")
		.update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
		.digest("hex")

	const form = new FormData()
	form.append("public_id", publicId)
	form.append("timestamp", timestamp)
	form.append("api_key", apiKey)
	form.append("signature", signature)

	try {
		await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
			method: "POST",
			body: form,
		})
	} catch (error) {
		console.error("Cloudinary destroy failed:", error)
	}
}

/* ---------- management actions ---------- */

export async function getManagedListing(id: string) {
	const { userId } = await auth();
	if (!userId) return null;

	const supabase = createSupabaseClient();

	const { data } = await supabase
		.from("listings")
		.select(`
			id, landlord_id, title, price_mad, rooms, beds, bathrooms, furnished, pet_friendly,
			available_from, description, has_caution, caution_amount, property_type,
			neighborhoods(city, name), listing_photos(url, sort_order, is_cover)
		`)
		.eq("id", id)
		.maybeSingle();

	// RLS already blocks other people; this double-check guards a published
	// listing being edited by a non-owner.
	if (!data || data.landlord_id !== userId) return null;

	const rawNeighborhood = data.neighborhoods as unknown as
		| { city?: string; name?: string }
		| { city?: string; name?: string }[]
		| null;

	const profile = (await getLandlordProfiles([data.landlord_id]))[data.landlord_id]
	return mapListingRow(data, profile)

}

export async function updateManagedListing(id: string, input: ListingFormValues) {
	const parsed = listingSchema.safeParse(input);
	if (!parsed.success) return null;

	const { userId } = await auth();
	if (!userId) return null;

	const supabase = createSupabaseClient();

	const neighborhoodId = await resolveNeighborhoodId(
		supabase,
		parsed.data.city,
		parsed.data.neighborhood
	);
	if (!neighborhoodId) return null;

	// Editing sends the listing back to review (RLS makes update owner-only).
	const { data, error } = await supabase
		.from("listings")
		.update({
			neighborhood_id: neighborhoodId,
			title: parsed.data.title,
			property_type: parsed.data.type,
			price_mad: parsed.data.price,
			rooms: parsed.data.rooms,
			beds: parsed.data.beds ?? parsed.data.rooms,
			bathrooms: parsed.data.bathrooms ?? 1,
			furnished: parsed.data.furnished,
			pet_friendly: parsed.data.petFriendly,
			available_from: parsed.data.availableFrom || null,
			description: parsed.data.description ?? "",
			has_caution: parsed.data.hasCaution,
			caution_amount: parsed.data.hasCaution ? parsed.data.cautionAmount : null,
			status: "pending",
			rejection_reason: null,
		})
		.eq("id", id)
		.select("id")
		.single();

	if (error || !data) {
		console.error("updateManagedListing failed:", error?.message)
		return null
	}
	return { id: data.id };
}

export async function deleteManagedListing(id: string) {
	const { userId } = await auth();
	if (!userId) return { ok: false, error: "auth" };

	const supabase = createSupabaseClient();

	// Best-effort Cloudinary cleanup of assets tied to this listing.
	const { data: photos } = await supabase
		.from("listing_photos")
		.select("url")
		.eq("listing_id", id);

	await Promise.all((photos ?? []).map((photo) => destroyCloudinaryUrl(photo.url)));

	// RLS (now including the delete policy) governs ownership. `.select("id")`
	// returns the deleted row — if RLS filtered it, we get an error/empty here.
	const { data: deleted, error } = await supabase
		.from("listings")
		.delete()
		.eq("id", id)
		.select("id")
		.single();

	if (error || !deleted) {
		console.error(
			"deleteManagedListing failed:",
			error?.message ?? "listing not found or not owned"
		)
		return { ok: false, error: error?.message ?? "Listing could not be deleted." }
	}

	return { ok: true };
}


export async function replaceManagedPhotos(
	id: string,
	keep: { url: string }[],
	newFiles: File[],
	coverIndex = 0
) {
	const { userId } = await auth();
	if (!userId) return { ok: false, error: "auth" };

	const supabase = createSupabaseClient();

	// What currently exists → anything not in `keep` gets destroyed.
	const { data: current } = await supabase
		.from("listing_photos")
		.select("url")
		.eq("listing_id", id);

	const currentUrls = (current ?? []).map((row) => row.url);
	const keepUrls = keep.map((item) => item.url);
	const removed = currentUrls.filter((url) => !keepUrls.includes(url));

	await Promise.all(removed.map(destroyCloudinaryUrl));

	// Upload the new files (appended after the kept ones).
	const uploaded: { url: string }[] = []
	if (newFiles.length > 0) {
		const results = await Promise.allSettled(
			newFiles.map((file, index) =>
				uploadPhotoToCloudinary(file, `${userId}/${id}-${Date.now()}-${index}`).then((url) => ({ url }))
			)
		)
		for (const result of results) {
			if (result.status === "fulfilled") uploaded.push(result.value)
			else console.error("replaceManagedPhotos upload failed:", result.reason)
		}
	}

	// Rebuild the photo set from scratch (kept + new) with the client's ordering/cover.
	const finalList = [...keep, ...uploaded];

	const { error: deleteError } = await supabase.from("listing_photos").delete().eq("listing_id", id);
	if (deleteError) return { ok: false, error: deleteError.message };

	if (finalList.length > 0) {
		const { error: insertError } = await supabase.from("listing_photos").insert(
			finalList.map((photo, index) => ({
				listing_id: id,
				url: photo.url,
				sort_order: index,
				is_cover: index === coverIndex,
			}))
		);
		if (insertError) return { ok: false, error: insertError.message };
	}

	return { ok: true };
}
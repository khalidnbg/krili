"use server"

import { auth } from "@clerk/nextjs/server"
import { createSupabaseClient } from "../supabase"
import { assertNotSuspended } from "../auth-guards"

/** Server helper for pages: all listing ids the signed-in user saved. */
export async function getSavedListingIds(): Promise<string[]> {
	let userId: string | null = null
	try {
		userId = (await auth()).userId
	} catch {
		// Next is collecting page data during build (no request scope) — no user.
		return []
	}
	if (!userId) return []

	const { data } = await createSupabaseClient()
		.from("saved_listings")
		.select("listing_id")
		.eq("profile_id", userId)

	return (data ?? []).map((row) => row.listing_id)
}

export type BookmarkResult = { ok: boolean; saved: boolean; error?: string }

export async function toggleBookmark(listingId: string): Promise<BookmarkResult> {
	const { userId } = await auth()
	if (!userId) return { ok: false, saved: false, error: "auth" }

	const suspendedError = await assertNotSuspended(userId)
	if (suspendedError) return { ok: false, saved: false, error: suspendedError }

	const supabase = createSupabaseClient()

	const { data: existing } = await supabase
		.from("saved_listings")
		.select("id")
		.eq("profile_id", userId)
		.eq("listing_id", listingId)
		.maybeSingle()

	if (existing) {
		const { error } = await supabase
			.from("saved_listings")
			.delete()
			.eq("profile_id", userId)
			.eq("listing_id", listingId)

		return { ok: !error, saved: false, error: error?.message }
	}

	const { error } = await supabase
		.from("saved_listings")
		.insert({ profile_id: userId, listing_id: listingId })

	return { ok: !error, saved: true, error: error?.message }

}

"use server"

import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient, createSupabaseClient } from "../supabase";
import { normalizeWhatsAppPhone } from "../utils";

export type RevealContactResult =
	| { ok: true; phone: string | null }
	| { ok: false; reason: "auth" | "not-found" | "error"; message?: string }

export async function revealContact(listingId: string): Promise<RevealContactResult> {

	const { userId } = await auth()
	if (!userId) {
		return { ok: false, reason: "auth", message: "Sign in to reveal the landlord's contact." }
	}

	if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
		console.error("revealContact: SUPABASE_SERVICE_ROLE_KEY is not set")
		return { ok: false, reason: "error", message: "Contact is temporarily unavailable." }
	}

	const supabase = createSupabaseClient()

	// 1) Listing must be visible (RLS enforces published/owned).
	const { data: listing, error: listingError } = await supabase
		.from("listings")
		.select("id, landlord_id")
		.eq("id", listingId)
		.eq("status", "published")
		.maybeSingle()

	if (listingError || !listing) {
		return { ok: false, reason: "not-found", message: "This listing is not available." }
	}

	// 2) Log the reveal (idempotent — one row per tenant per listing).
	const { data: existing } = await supabase
		.from("contact_reveals")
		.select("id")
		.eq("listing_id", listingId)
		.eq("tenant_id", userId)
		.maybeSingle()

	if (!existing) {
		const { error: insertError } = await supabase.from("contact_reveals").insert({
			listing_id: listingId,
			tenant_id: userId,
		})
		if (insertError) {
			console.error("revealContact insert failed:", insertError.message)
			return { ok: false, reason: "error", message: insertError.message }
		}
	}

	// 3) Read the landlord's phone with the service role (profiles RLS only
	//    lets a user read their own row — the phone stays private).
	const service = createServiceRoleClient()
	const { data: profile, error: profileError } = await service
		.from("profiles")
		.select("phone")
		.eq("id", listing.landlord_id)
		.maybeSingle()

	if (profileError) {
		console.error("revealContact phone lookup failed:", profileError.message)
		return { ok: false, reason: "error", message: profileError.message }
	}

	return { ok: true, phone: normalizeWhatsAppPhone(profile?.phone) }
}
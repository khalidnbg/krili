"use server"

import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient, createSupabaseClient } from "../supabase";
import { normalizeWhatsAppPhone } from "../utils";
import { assertNotSuspended } from "../auth-guards";
import { checkRateLimit } from "../rate-limit";
import { isAdmin } from "../admin";

export type RevealContactResult =
	| { ok: true; phone: string | null }
	| { ok: false; reason: "auth" | "not-found" | "error" | "rate_limited"; message?: string; retryAfterSeconds?: number }

export async function revealContact(listingId: string): Promise<RevealContactResult> {

	const { userId } = await auth()
	if (!userId) {
		return { ok: false, reason: "auth", message: "Sign in to reveal the landlord's contact." }
	}

	const suspendedError = await assertNotSuspended(userId)
	if (suspendedError) return { ok: false, reason: "error", message: suspendedError }

	if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
		console.error("revealContact: SUPABASE_SERVICE_ROLE_KEY is not set")
		return { ok: false, reason: "error", message: "Contact is temporarily unavailable." }
	}

	// Admin exemption
	if (await isAdmin()) {
		// Skip rate limit check for admins
	} else {
		const supabase = createSupabaseClient()

		// 1) Check if already revealed (idempotent — one row per tenant per listing).
		const { data: existing } = await supabase
			.from("contact_reveals")
			.select("id")
			.eq("listing_id", listingId)
			.eq("tenant_id", userId)
			.maybeSingle()

		if (existing) {
			// Already revealed, skip rate limit check and proceed to return contact
		} else {
			// New reveal: check rate limit before inserting
			const rateLimit = await checkRateLimit("revealContact", userId)
			if (!rateLimit.ok) {
				return {
					ok: false,
					reason: "rate_limited",
					message: "You've requested a lot of contacts. Please try again later.",
					retryAfterSeconds: rateLimit.retryAfterSeconds,
				}
			}
		}
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
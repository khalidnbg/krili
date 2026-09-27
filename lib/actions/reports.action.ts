"use server"

import { auth } from "@clerk/nextjs/server";
import { ReportFormValues, reportSchema } from "../schema";
import { createServiceRoleClient, createSupabaseClient } from "../supabase";
import { isAdmin } from "../admin";

/* ---------------- tenant: create report ---------------- */
export type ReportActionResult =
	| { ok: true; alreadyReported?: boolean }
	| { ok: false; reason: "auth" | "not-found" | "error"; message?: string }

export async function createReport(input: ReportFormValues): Promise<ReportActionResult> {
	const parsed = reportSchema.safeParse(input)
	if (!parsed.success) {
		return { ok: false, reason: "error", message: "Invalid report." }
	}

	const { userId } = await auth()
	if (!userId) {
		return { ok: false, reason: "auth", message: "Sign in to report a listing." }
	}

	const supabase = createSupabaseClient()

	// Only published listings can be reported (RLS + explicit check).
	const { data: listing, error: listingError } = await supabase
		.from("listings")
		.select("id")
		.eq("id", parsed.data.listingId)
		.eq("status", "published")
		.maybeSingle()

	if (listingError || !listing) {
		return { ok: false, reason: "not-found", message: "This listing is not available." }
	}

	// Idempotency — one report per (reporter, listing).
	const { data: existing } = await supabase
		.from("reports")
		.select("id")
		.eq("listing_id", parsed.data.listingId)
		.eq("reporter_id", userId)
		.maybeSingle()

	if (existing) return { ok: true, alreadyReported: true }

	const details = parsed.data.details?.trim() || null

	const { error: insertError } = await supabase.from("reports").insert({
		listing_id: parsed.data.listingId,
		reporter_id: userId,
		reason: parsed.data.reason,
		details,
	})

	// unique(reporter_id, listing_id) raced — treat as already reported, not an error.
	if (insertError) {
		if (insertError.code === "23505") return { ok: true, alreadyReported: true }
		console.error("createReport insert failed:", insertError.message)
		return { ok: false, reason: "error", message: insertError.message }
	}

	return { ok: true, alreadyReported: false }
}

/* ---------------- admin: queue + resolve ---------------- */
export type AdminReportActionResult = { ok: boolean; error?: string }

type ReportRow = {
	id: string
	listing_id: string
	reporter_id: string
	reason: ReportReason
	details?: string | null
	status: ReportStatus
	created_at: string
	listings?:
	| { title?: string; status?: string }
	| { title?: string; status?: string }[]
	| null
}

/** Pure row → ModerationReport mapper (same convention as mapListingRow). */
const mapReportRow = (row: ReportRow): ModerationReport => {
	const listing = Array.isArray(row.listings) ? row.listings[0] : row.listings
	return {
		id: row.id,
		listingId: row.listing_id,
		reporterId: row.reporter_id,
		reason: row.reason,
		details: row.details,
		status: row.status,
		createdAt: row.created_at,
		listingTitle: listing?.title ?? "",
		listingStatus: (listing?.status as ListingStatus) ?? "pending",
	}
}

export async function getOpenReports(): Promise<ModerationReport[] | null> {
	if (!(await isAdmin())) return null
	if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
		console.error("getOpenReports: SUPABASE_SERVICE_ROLE_KEY is not set")
		return null
	}

	const { data, error } = await createServiceRoleClient()
		.from("reports")
		.select("id, listing_id, reporter_id, reason, details, status, created_at, listings(title, status)")
		.eq("status", "open")
		.order("created_at", { ascending: false })

	if (error) {
		console.error("getOpenReports failed:", error.message)
		return null
	}

	return (data ?? []).map((row) => mapReportRow(row))
}

export async function resolveReport(
	reportId: string,
	resolution: "reviewed" | "dismissed"
): Promise<AdminReportActionResult> {
	if (!(await isAdmin())) return { ok: false, error: "Forbidden" }
	if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
		return { ok: false, error: "Service role key not configured" }
	}

	const { data: updated, error } = await createServiceRoleClient()
		.from("reports")
		.update({ status: resolution })
		.eq("id", reportId)
		.select("id")
		.single()

	// No-match failures surface as an empty result — don't report success.
	if (error || !updated) {
		console.error("resolveReport failed:", error?.message ?? "report not found")
		return { ok: false, error: error?.message ?? "Report could not be updated." }
	}

	return { ok: true }
}
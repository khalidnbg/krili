"use server"

import { auth } from "@clerk/nextjs/server";
import { ReportFormValues, reportSchema } from "../schema";
import { createServiceRoleClient, createSupabaseClient } from "../supabase";
import { isAdmin } from "../admin";
import { assertNotSuspended } from "../auth-guards";
import { listingUnpublishedFromReportEmail } from "../email/templates";
import { sendLandlordStatusEmail } from "../email/send";

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

	const suspendedError = await assertNotSuspended(userId)
	if (suspendedError) return { ok: false, reason: "error", message: suspendedError }


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
		.eq("status", "open")
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

export async function getOpenReports(
	page = 1,
	pageSize = 10
): Promise<{ items: ModerationReport[]; total: number } | null> {
	if (!(await isAdmin())) return null
	if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
		console.error("getOpenReports: SUPABASE_SERVICE_ROLE_KEY is not set")
		return null
	}

	const { data, error, count } = await createServiceRoleClient()
		.from("reports")
		.select("id, listing_id, reporter_id, reason, details, status, created_at, listings(title, status)", {
			count: "exact",
		})
		.eq("status", "open")
		.order("created_at", { ascending: false })
		.range((page - 1) * pageSize, page * pageSize - 1)

	if (error) {
		console.error("getOpenReports failed:", error.message)
		return null
	}

	return {
		items: (data ?? []).map((row) => mapReportRow(row)),
		total: count ?? 0,
	}
}

export async function resolveReport(
	reportId: string,
	resolution: "reviewed" | "dismissed",
	listingAction?: { newStatus: "rejected" | "rented"; reason?: string }
): Promise<AdminReportActionResult> {
	if (!(await isAdmin())) return { ok: false, error: "Forbidden" }
	if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
		return { ok: false, error: "Service role key not configured" }
	}

	const service = createServiceRoleClient()

	// Resolve the report first (single source of truth for the queue).
	const { data: updatedReport, error: reportError } = await service
		.from("reports")
		.update({ status: resolution })
		.eq("id", reportId)
		.select("id")
		.single()

	// No-match/RLS-style failures surface as empty here — don't report success.
	if (reportError || !updatedReport) {
		console.error("resolveReport failed:", reportError?.message ?? "report not found")
		return { ok: false, error: reportError?.message ?? "Report could not be updated." }
	}

	// Listing action only applies when the report is being reviewed.
	if (listingAction && resolution === "reviewed") {
		const { data: report } = await service
			.from("reports")
			.select("listing_id")
			.eq("id", reportId)
			.maybeSingle()

		if (!report?.listing_id) {
			// Report already updated — say so explicitly.
			return { ok: false, error: "Report resolved, but its listing could not be found to update." }
		}

		// Same update pattern as the moderation reject action.
		const listingUpdate =
			listingAction.newStatus === "rejected"
				? {
					status: "rejected",
					rejection_reason: listingAction.reason?.trim() || "Unpublished after a report",
				}
				: { status: "rented", rejection_reason: null }

		const { data: updatedListing, error: listingError } = await service
			.from("listings")
			.update(listingUpdate)
			.eq("id", report.listing_id)
			.select("id")
			.single()

		// Email the landlord only on the "unpublish" branch.
		if (listingAction.newStatus === "rejected") {
			const { data: target } = await service
				.from("listings")
				.select("title, landlord_id")
				.eq("id", report.listing_id)
				.maybeSingle()

			if (target?.landlord_id) {
				const reason = listingAction.reason?.trim() || "Unpublished after a report"
				const { subject, html } = listingUnpublishedFromReportEmail(
					{ title: target.title },
					reason
				)
				await sendLandlordStatusEmail(service, target.landlord_id, subject, html)
			}
		}

		if (listingError || !updatedListing) {
			console.error("resolveReport listing update failed:", listingError?.message ?? "listing not found")
			return {
				ok: false,
				error: `Report resolved, but the listing could not be updated: ${listingError?.message ?? "listing not found"}`,
			}
		}
	}
	return { ok: true }
}
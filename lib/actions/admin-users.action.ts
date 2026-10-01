"use server"

import { isAdmin } from "../admin"
import { createServiceRoleClient } from "../supabase"
import { currentUser } from "@clerk/nextjs/server"

export type AdminUsersParams = {
	page?: number
	pageSize?: number
	search?: string
	role?: string
}

export type AdminUsersResult = { rows: AdminUserRow[]; total: number }

export async function getUsers({
	page = 1,
	pageSize = 10,
	search,
	role,
}: AdminUsersParams = {}): Promise<AdminUsersResult | null> {
	if (!(await isAdmin())) return null
	if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
	const service = createServiceRoleClient()

	let query = service
		.from("profiles")
		.select(
			"id, first_name, last_name, email, phone, role, phone_verified, id_verified, suspended, created_at",
			{ count: "exact" }
		)
		.order("created_at", { ascending: false })
		.range((page - 1) * pageSize, page * pageSize - 1)

	// Don't show the admin's own account.
	const me = await currentUser()
	if (me?.id) query = query.neq("id", me.id)


	if (search?.trim()) {
		const term = `%${search.trim()}%`
		query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
	}

	if (role) query = query.eq("role", role)

	const { data, error, count } = await query
	if (error) {
		console.error("getUsers failed:", error.message)
		return null
	}

	// Listing counts per landlord — grouped aggregate from PostgREST.
	const { data: aggregates } = await service.from("listings").select("landlord_id, count")

	const counts = new Map<string, number>()
	for (const row of aggregates ?? []) {
		counts.set(row.landlord_id, Number((row.count as number | string | undefined) ?? 0))
	}

	const rows: AdminUserRow[] = (data ?? []).map((profile) => ({
		id: profile.id,
		firstName: profile.first_name,
		lastName: profile.last_name,
		email: profile.email,
		phone: profile.phone,
		role: profile.role ?? "both",
		phoneVerified: profile.phone_verified ?? false,
		idVerified: profile.id_verified ?? false,
		suspended: profile.suspended ?? false,
		listingCount: counts.get(profile.id) ?? 0,
		createdAt: profile.created_at,
	}))

	return { rows, total: count ?? 0 }
}

export type AdminUserActionResult = { ok: boolean; error?: string }

export async function setUserSuspended(
	userId: string,
	suspended: boolean
): Promise<AdminUserActionResult> {

	if (!(await isAdmin())) return { ok: false, error: "Forbidden" }
	if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
		return { ok: false, error: "Service role key not configured" }
	}

	const { data: updated, error } = await createServiceRoleClient()
		.from("profiles")
		.update({ suspended })
		.eq("id", userId)
		.select("id")
		.single()

	// Silent no-match gotcha — verify the row actually updated.
	if (error || !updated) {
		console.error("setUserSuspended failed:", error?.message ?? "profile not found")
		return { ok: false, error: error?.message ?? "User could not be updated." }
	}

	return { ok: true }
}
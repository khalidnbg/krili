"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * Ensures a `profiles` row exists for the currently signed-in Clerk user.
 * Safe to call on every authenticated page load — uses upsert with
 * ignoreDuplicates so it never overwrites an existing profile's data
 * (e.g. phone_verified, role) once it's been set.
 *
 * No service_role key needed: this runs with the user's own Clerk-issued
 * JWT, so it relies on the RLS policy that already lets a user insert
 * their own profile row (auth.jwt()->>'sub' = id).
 */
export async function ensureProfile() {
	const { userId } = await auth();
	if (!userId) return;

	const supabase = createSupabaseClient();

	const { error } = await supabase
		.from("profiles")
		.upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

	if (error) {
		console.error("ensureProfile failed:", error.message);
	}
}
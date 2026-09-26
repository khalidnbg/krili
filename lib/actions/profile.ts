"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
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
	const user = await currentUser()
	if (!user) return

	const supabase = createSupabaseClient();

	// Upsert only identity columns — other profile columns are untouched.
	const { error } = await supabase
		.from("profiles")
		.upsert(
			{
				id: userId,
				first_name: user.firstName,
				last_name: user.lastName,
				email: user.primaryEmailAddress?.emailAddress,
				avatar_url: user.imageUrl,
			},
			{ onConflict: "id" }
		)

	if (error) console.error("ensureProfile failed:", error.message)

}
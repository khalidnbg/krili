import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js"

export const createSupabaseClient = () => {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
		{
			async accessToken() {
				try {
					return (await auth()).getToken()
				} catch {
					// No request scope (e.g., Next collecting page data at build time).
					return null
				}
			},
		}
	)
}

// Anonymous client for SEO paths (no auth, RLS ensures only published listings are exposed)
export const createAnonSupabaseClient = () => {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
	)
}

export const createServiceRoleClient = () => {
	// Bypasses RLS — never expose this key publicly.
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
	}
	)
}

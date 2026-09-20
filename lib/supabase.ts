import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js"

export const createSupabaseClient = () => {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
		async accessToken() {
			return ((await auth()).getToken());
		}
	}
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

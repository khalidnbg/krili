import { createServiceRoleClient } from "./supabase"

export const isUserSuspended = async (userId: string) => {
	const { data } = await createServiceRoleClient()
		.from("profiles")
		.select("suspended")
		.eq("id", userId)
		.maybeSingle()
	return data?.suspended === true
}

export const assertNotSuspended = async (userId: string): Promise<string | null> => {
	if (await isUserSuspended(userId)) return "Your account is currently suspended."
	return null
}
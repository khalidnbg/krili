import { currentUser } from "@clerk/nextjs/server"

export const isAdmin = async () => {
	const user = await currentUser()
	if (!user) return false

	// Clerk dashboard → public metadata {"role": "admin"}
	if (user.publicMetadata?.role === "admin") return true

	// ...or the allow-list in .env
	const admins = (process.env.ADMIN_USER_IDS ?? "")
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean)
	return admins.includes(user.id)
}
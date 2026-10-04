import type { SupabaseClient } from "@supabase/supabase-js"

/** Fire-and-forget email send via Brevo's transactional API (v3). */
export async function sendStatusEmail(to: string, subject: string, html: string) {
	const apiKey = process.env.BREVO_API_KEY
	const fromEmail = process.env.EMAIL_FROM_EMAIL
	if (!apiKey || !fromEmail) {
		console.error("sendStatusEmail: BREVO_API_KEY / EMAIL_FROM_EMAIL not configured")
		return
	}

	try {
		const response = await fetch("https://api.brevo.com/v3/smtp/email", {
			method: "POST",
			headers: {
				"accept": "application/json",
				"api-key": apiKey,
				"content-type": "application/json",
			},
			body: JSON.stringify({
				sender: {
					email: fromEmail,
					name: process.env.EMAIL_FROM_NAME || "Krili",
				},
				to: [{ email: to }],
				subject,
				htmlContent: html,
			}),
		})

		if (!response.ok) {
			const body = await response.text().catch(() => "")
			console.error("Brevo send failed:", response.status, body)
			return
		} else {
			console.log(`Brevo send succeeded: ${subject} -> ${to}`)
		}
	} catch (err) {
		// A failed notification must never affect the status change it accompanies.
		console.error("Failed to send status email:", err)
	}
}

/**
 * Sends a transactional status email to a listing's landlord.
 * Skips (logged) when the landlord has no email on file — never throws.
 */
export async function sendLandlordStatusEmail(
	supabase: SupabaseClient,
	landlordId: string,
	subject: string,
	html: string
) {
	const { data: profile } = await supabase
		.from("profiles")
		.select("email")
		.eq("id", landlordId)
		.maybeSingle()

	if (!profile?.email) {
		console.error(`sendLandlordStatusEmail: no email on file for ${landlordId} — skipping`)
		return
	}

	await sendStatusEmail(profile.email, subject, html)
}

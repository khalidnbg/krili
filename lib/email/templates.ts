const escapeHtml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;")

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export function listingApprovedEmail(listing: { title: string; id: string }) {
	const title = escapeHtml(listing.title)
	return {
		subject: `Your listing "${title}" is now live`,
		html: `<p>Good news — your listing <strong>${title}</strong> has been approved and is now visible to tenants.</p>
			<p><a href="${appUrl()}/listings/${listing.id}">View your listing</a></p>`,
	}
}

export function listingRejectedEmail(listing: { title: string }, reason: string) {
	const title = escapeHtml(listing.title)
	const escapedReason = escapeHtml(reason)
	return {
		subject: `Your listing "${title}" needs changes`,
		html: `<p>Your listing <strong>${title}</strong> was not approved for the following reason:</p>
			<p><em>${escapedReason}</em></p>
			<p>You can edit and resubmit it from your dashboard.</p>`,
	}
}

export function listingUnpublishedFromReportEmail(listing: { title: string }, reason: string) {
	const title = escapeHtml(listing.title)
	const escapedReason = escapeHtml(reason)
	return {
		subject: `Your listing "${title}" has been unpublished`,
		html: `<p>Your listing <strong>${title}</strong> was unpublished after a review of a tenant report, for the following reason:</p>
			<p><em>${escapedReason}</em></p>
			<p>Contact support if you believe this was a mistake.</p>`,
	}
}

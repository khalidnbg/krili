"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { approveListing, rejectListing } from "@/lib/actions/listing.action"

interface ListingReviewActionsProps {
	listingId: string
	status: ListingStatus
}

const ListingReviewActions = ({ listingId, status }: ListingReviewActionsProps) => {
	const [rejecting, setRejecting] = useState(false)
	const [reason, setReason] = useState("")
	const [busy, setBusy] = useState(false)

	const reload = () => window.location.reload()

	const handleApprove = async () => {
		setBusy(true)
		const { ok, error } = await approveListing(listingId)
		setBusy(false)
		if (ok) reload()
		else alert(error ?? "Failed to approve")
	}

	const handleReject = async () => {
		setBusy(true)
		const { ok, error } = await rejectListing(listingId, reason)
		setBusy(false)
		if (ok) reload()
		else alert(error ?? "Failed to reject")
	}

	return (
		<div className="flex flex-col gap-2">
			{status !== "published" && (
				<Button onClick={handleApprove} disabled={busy} className="w-full">
					Approve
				</Button>
			)}

			{!rejecting ? (
				status !== "rejected" && (
					<Button variant="ghost" onClick={() => setRejecting(true)} disabled={busy} className="w-full">
						Reject
					</Button>
				)
			) : (
				<div className="flex flex-col gap-2">
					<Input
						placeholder="Rejection reason (shown to the landlord)"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						aria-invalid={reason.trim().length === 0}
					/>
					<div className="flex gap-2">
						<Button onClick={handleReject} disabled={busy || !reason.trim()} className="flex-1">
							Reject
						</Button>
						<Button variant="ghost" onClick={() => { setRejecting(false); setReason("") }} disabled={busy}>
							Cancel
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}

export default ListingReviewActions

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteManagedListing } from "@/lib/actions/listing.action"
import { Button } from "@/components/ui/button"

const DeleteListingButton = ({ listingId }: { listingId: string }) => {
	const router = useRouter()
	const [busy, setBusy] = useState(false)

	const handleDelete = async () => {
		if (!window.confirm("Delete this listing permanently? Its photos will also be removed.")) return
		setBusy(true)
		const result = await deleteManagedListing(listingId)
		setBusy(false)
		if (result.ok) {
			router.refresh()
		} else {
			alert(result.error ?? "Failed to delete")
		}
	}

	return (
		<Button type="button" variant="ghost" disabled={busy} onClick={handleDelete}>
			{busy ? "Deleting…" : "Delete"}
		</Button>
	)
}

export default DeleteListingButton

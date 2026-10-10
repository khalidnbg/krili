"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteManagedListing } from "@/lib/actions/listing.action"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

const DeleteListingButton = ({ listingId }: { listingId: string }) => {
	const router = useRouter()
	const t = useTranslations("actions")
	const [busy, setBusy] = useState(false)

	const handleDelete = async () => {
		if (!window.confirm(t("deleteConfirm"))) return
		setBusy(true)
		const result = await deleteManagedListing(listingId)
		setBusy(false)
		if (result.ok) {
			router.refresh()
		} else {
			alert(result.error ?? t("deleteFailed"))
		}
	}

	return (
		<Button type="button" variant="ghost" disabled={busy} onClick={handleDelete}>
			{busy ? t("deleting") : t("delete")}
		</Button>
	)
}

export default DeleteListingButton

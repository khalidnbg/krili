"use client"

import { toggleRentedStatus } from "@/lib/actions/listing.action";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl";

const MarkRentedButton = ({ listingId, status }: { listingId: string; status: ListingStatus }) => {
	const router = useRouter()
	const t = useTranslations("actions")
	const [busy, setBusy] = useState(false)

	const handleToggle = async () => {
		setBusy(true)
		const result = await toggleRentedStatus(listingId)
		setBusy(false)
		if (result.ok) router.refresh()
		else alert(result.error ?? "Failed to update the listing")
	}

	const isRented = status === "rented"

	return (
		<Button
			type="button"
			variant={isRented ? "outline" : "secondary"}
			disabled={busy}
			onClick={handleToggle}
		>
			{busy ? t("updating") : isRented ? t("markAsAvailable") : t("markAsRented")}
		</Button>
	)
}

export default MarkRentedButton
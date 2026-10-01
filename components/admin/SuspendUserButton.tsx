"use client"

import { setUserSuspended } from "@/lib/actions/admin-users.action";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button"

const SuspendUserButton = ({ userId, suspended }: { userId: string; suspended: boolean }) => {
	const router = useRouter()
	const [busy, setBusy] = useState(false)

	const handle = async () => {
		if (!window.confirm(`${suspended ? "Unsuspend" : "Suspend"} this user?`)) return
		setBusy(true)
		const { ok, error } = await setUserSuspended(userId, !suspended)
		setBusy(false)
		if (ok) router.refresh()
		else alert(error ?? "Failed to update user")
	}

	return (
		<Button type="button" variant={suspended ? "outline" : "destructive"} disabled={busy} onClick={handle}>
			{busy ? "…" : suspended ? "Unsuspend" : "Suspend"}
		</Button>
	)
}

export default SuspendUserButton
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { resolveReport } from "@/lib/actions/reports.action"

const ReportReviewActions = ({ reportId }: { reportId: string }) => {
	const [busy, setBusy] = useState(false)

	const handle = async (resolution: "reviewed" | "dismissed") => {
		setBusy(true)
		const { ok, error } = await resolveReport(reportId, resolution)
		setBusy(false)
		if (ok) window.location.reload()
		else alert(error ?? "Failed to update report")
	}

	return (
		<div className="flex gap-2">
			<Button type="button" disabled={busy} onClick={() => handle("reviewed")}>
				Resolve
			</Button>
			<Button type="button" variant="ghost" disabled={busy} onClick={() => handle("dismissed")}>
				Dismiss
			</Button>
		</div>
	)
}

export default ReportReviewActions
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { resolveReport } from "@/lib/actions/reports.action"

const ReportReviewActions = ({ reportId }: { reportId: string }) => {
	const [resolving, setResolving] = useState(false)
	const [reason, setReason] = useState("")
	const [busy, setBusy] = useState(false)

	const reload = () => window.location.reload()

	const run = async (
		resolution: "reviewed" | "dismissed",
		listingAction?: { newStatus: "rejected"; reason?: string }
	) => {
		setBusy(true)
		const { ok, error } = await resolveReport(reportId, resolution, listingAction)
		setBusy(false)
		if (ok) reload()
		else alert(error ?? "Failed to update report")
	}

	return (
		<div className="flex flex-col gap-2">
			{!resolving ? (
				<div className="flex gap-2">
					<Button type="button" variant="outline" disabled={busy} onClick={() => setResolving(true)}>
						Resolve
					</Button>
					<Button type="button" variant="ghost" disabled={busy} onClick={() => run("dismissed")}>
						Dismiss
					</Button>
				</div>
			) : (
				<div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3">
					<p className="text-xs font-semibold text-muted-foreground">
						How do you want to resolve this report?
					</p>

					{/* Option A — no listing change */}
					<Button
						type="button"
						variant="outline"
						disabled={busy}
						onClick={() => run("reviewed")}
						className="w-full"
					>
						Resolve only — no listing change
					</Button>

					{/* Option B — unpublish, requires a reason */}
					<Input
						placeholder="Reason for unpublishing (shown to the landlord)"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						aria-invalid={reason.trim().length === 0}
					/>
					<Button
						type="button"
						disabled={busy || !reason.trim()}
						onClick={() => run("reviewed", { newStatus: "rejected", reason: reason.trim() })}
						className="w-full"
					>
						Resolve &amp; unpublish listing
					</Button>

					<Button
						type="button"
						variant="ghost"
						disabled={busy}
						onClick={() => {
							setResolving(false)
							setReason("")
						}}
					>
						Cancel
					</Button>
				</div>
			)}
		</div>
	)
}

export default ReportReviewActions

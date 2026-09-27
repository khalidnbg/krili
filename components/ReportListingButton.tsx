"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { reportReasons } from "@/constants"
import { createReport } from "@/lib/actions/reports.action"

interface ReportListingButtonProps {
	listingId: string
	initialReported?: boolean
}

const ReportListingButton = ({ listingId, initialReported = false }: ReportListingButtonProps) => {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [reported, setReported] = useState(initialReported)
	const [reason, setReason] = useState("")
	const [details, setDetails] = useState("")
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async () => {
		if (!reason) return
		setBusy(true)
		setError(null)

		const result = await createReport({
			listingId,
			reason: reason as ReportReason,
			details: details.trim() || undefined,
		})

		if (result.ok) {
			setReported(true)
			setOpen(false)
		} else {
			if (result.reason === "auth") {
				router.push("/sign-in")
			} else {
				setError(result.message ?? "Could not submit the report.")
			}
		}
		setBusy(false)
	}

	if (reported) {
		return (
			<button type="button" disabled className="btn-signin">
				<Flag className="size-3.5" /> Reported
			</button>
		)
	}

	return (
		<div className="flex flex-col gap-2">
			{!open ? (
				<Button type="button" variant="ghost" onClick={() => setOpen(true)}>
					<Flag className="size-3.5" /> Report listing
				</Button>
			) : (
				<div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3">
					<p className="text-xs font-semibold text-muted-foreground">Report this listing</p>
					<Select value={reason} onValueChange={(value) => setReason(value ?? "")}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Reason" />
						</SelectTrigger>
						<SelectContent>
							{reportReasons.map((option) => (
								<SelectItem value={option.value} key={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Textarea
						rows={2}
						placeholder="Details (optional)"
						value={details}
						onChange={(e) => setDetails(e.target.value)}
					/>
					<div className="flex gap-2">
						<Button type="button" disabled={busy || !reason} onClick={handleSubmit} className="flex-1">
							{busy ? "Submitting…" : "Submit report"}
						</Button>
						<Button
							type="button"
							variant="ghost"
							disabled={busy}
							onClick={() => {
								setOpen(false)
								setReason("")
								setDetails("")
							}}
						>
							Cancel
						</Button>
					</div>
				</div>
			)}
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	)
}

export default ReportListingButton

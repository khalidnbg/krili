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
			<span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
				<Flag className="size-3.5" /> Reported
			</span>
		)
	}

	return (
		<div className="flex flex-col gap-2">
			{!open ? (
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="inline-flex items-center gap-1.5 self-end rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<Flag className="size-3.5" /> Report listing
				</button>
			) : (
				<div className="flex w-72 flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-lg">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Report this listing
					</p>
					<Select value={reason} onValueChange={(value) => setReason(value ?? "")}>
						<SelectTrigger className="w-full rounded-full">
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
						className="rounded-xl"
					/>
					<div className="flex gap-2">
						<Button
							type="button"
							disabled={busy || !reason}
							onClick={handleSubmit}
							className="flex-1 rounded-full shadow-sm transition-transform active:scale-[0.98]"
						>
							{busy ? "Submitting…" : "Submit report"}
						</Button>
						<button
							type="button"
							disabled={busy}
							onClick={() => {
								setOpen(false)
								setReason("")
								setDetails("")
							}}
							className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
						>
							Cancel
						</button>
					</div>
				</div>
			)}
			{error && (
				<p className="self-end rounded-md bg-destructive/10 px-3 py-1 text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}

export default ReportListingButton
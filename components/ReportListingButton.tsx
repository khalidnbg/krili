"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { reportReasons } from "@/constants"
import { createReport } from "@/lib/actions/reports.action"
import { useTranslations } from "next-intl"

interface ReportListingButtonProps {
  listingId: string
  initialReported?: boolean
}

const ReportListingButton = ({ listingId, initialReported = false }: ReportListingButtonProps) => {
  const router = useRouter()
  const t = useTranslations("reports")
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-500">
        <Flag className="size-3.5" /> {t("reported")}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 self-end rounded-full px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <Flag className="size-3.5" /> {t("reportListing")}
        </button>
      ) : (
        <div className="flex w-72 flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-12px_rgba(0,0,0,0.14)]">
          <p className="text-xs font-semibold text-neutral-500">
            {t("reportThisListing")}
          </p>
          <Select value={reason} onValueChange={(value) => setReason(value ?? "")}>
            <SelectTrigger className="w-full rounded-full border-neutral-200">
              <SelectValue placeholder={t("reason")} />
            </SelectTrigger>
            <SelectContent>
              {reportReasons.map((option) => (
                <SelectItem value={option.value} key={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            rows={2}
            placeholder={t("detailsOptional")}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="rounded-xl border-neutral-200"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={busy || !reason}
              onClick={handleSubmit}
              className="flex-1 rounded-full bg-neutral-900 shadow-sm transition-transform hover:bg-neutral-800 active:scale-[0.98]"
            >
              {busy ? t("submitting") : t("submitReport")}
            </Button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false)
                setReason("")
                setDetails("")
              }}
              className="rounded-full px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="self-end rounded-full bg-red-50 px-3 py-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default ReportListingButton

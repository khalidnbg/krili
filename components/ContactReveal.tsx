"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MessageCircle, Phone } from "lucide-react"
import { revealContact } from "@/lib/actions/contact.action"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface ContactRevealProps {
	listingId: string
	initialRevealed?: boolean
}

const ContactReveal = ({ listingId, initialRevealed = false }: ContactRevealProps) => {
	const router = useRouter()
	const t = useTranslations("contact")

	const [revealed, setRevealed] = useState(false)
	const [phone, setPhone] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchContact = async () => {
		setBusy(true)
		setError(null)

		const result = await revealContact(listingId)

		if (!result.ok) {
			setBusy(false)
			if (result.reason === "auth") {
				router.push("/sign-in")
				return
			}
			setError(result.message ?? t("error"))
			return
		}

		setPhone(result.phone)
		setRevealed(true)
		setBusy(false)
	}

	// An already-revealed visitor sees the phone immediately (no second click).
	useEffect(() => {
		if (!initialRevealed) return
		let cancelled = false

			; (async () => {
				const result = await revealContact(listingId)
				if (cancelled) return
				if (!result.ok) {
					if (result.reason === "auth") router.push("/sign-in")
					else setError(result.message ?? t("error"))
					return
				}
				setPhone(result.phone)
				setRevealed(true)
			})()

		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const waLink = phone
		? `https://wa.me/${phone}?text=${encodeURIComponent(t("whatsappMessage"))}`
		: null

	return (
		<div className="flex w-full flex-col gap-2 md:w-64 justify-between">
			{revealed ? (
				phone ? (
					// ContactReveal — revealed state
					<div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
						<p className="flex items-center gap-2 text-base font-semibold tracking-tight">
							<Phone className="size-4 text-primary" />
							+{phone}
						</p>
						<Link
							href={waLink!}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#1ebe5b] hover:shadow-md active:scale-[0.98]"
						>
							<MessageCircle className="size-4" />
							{t("messageOnWhatsApp")}
						</Link>
						<p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
							{t("contactSaved")}
						</p>
					</div>
				) : (
					<div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
						<p className="text-sm text-muted-foreground">
							{t("noPhoneSet")}
						</p>
					</div>
				)
			) : (
				<Button
					onClick={fetchContact}
					disabled={busy}
					className="w-full rounded-lg shadow-sm transition-transform active:scale-[0.98]"
				>
					{busy ? t("loading") : t("contactLandlord")}
				</Button>
			)}

			{error && (
				<p className="rounded-md bg-destructive/10 px-3 py-1.5 text-sm text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}

export default ContactReveal
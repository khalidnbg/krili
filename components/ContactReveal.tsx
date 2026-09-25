"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MessageCircle, Phone } from "lucide-react"
import { revealContact } from "@/lib/actions/contact.action"
import { Button } from "@/components/ui/button"

interface ContactRevealProps {
	listingId: string
	initialRevealed?: boolean
}

const ContactReveal = ({ listingId, initialRevealed = false }: ContactRevealProps) => {
	const router = useRouter()

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
			setError(result.message ?? "Something went wrong. Please try again.")
			return
		}

		setPhone(result.phone)
		setRevealed(true)
		setBusy(false)
	}

	// An already-revealed visitor sees the phone immediately (no second click).
	useEffect(() => {
		if (initialRevealed) void fetchContact()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const waLink = phone
		? `https://wa.me/${phone}?text=${encodeURIComponent("Hello, I'm interested in your listing on Krili.")}`
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
							Message on WhatsApp
						</Link>
						<p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
							Contact saved — the landlord can see you reached out.
						</p>
					</div>
				) : (
					<div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
						<p className="text-sm text-muted-foreground">
							The landlord hasn&apos;t set a phone number yet.
						</p>
					</div>
				)
			) : (
				<Button
					onClick={fetchContact}
					disabled={busy}
					className="w-full rounded-lg shadow-sm transition-transform active:scale-[0.98]"
				>
					{busy ? "Loading…" : "Contact landlord"}
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
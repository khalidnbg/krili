"use client"

import { useEffect, useState, useRef } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useTranslations } from "next-intl"
import { Share2, Check, MessageCircle, Mail, Copy } from "lucide-react"

interface ShareListingButtonProps {
	url?: string // Optional fallback for SSR
	title: string
	priceMad: number
	city: string
	neighborhood?: string | null
	propertyTypeLabel: string
}

const ShareListingButton = ({
	url: fallbackUrl,
	title,
	priceMad,
	city,
	neighborhood,
	propertyTypeLabel,
}: ShareListingButtonProps) => {

	const t = useTranslations("share")
	const [menuOpen, setMenuOpen] = useState(false)
	const [copySuccess, setCopySuccess] = useState(false)
	const [copyError, setCopyError] = useState<string | null>(null)
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)
	const [currentUrl, setCurrentUrl] = useState(fallbackUrl || "")

	// Use actual browser URL on client side
	useEffect(() => {
		if (typeof window !== "undefined") {
			setCurrentUrl(window.location.href)
		}
	}, [])

	const supportsNativeSharing = (url: string) => {
		if (typeof navigator === "undefined") return false

		return (
			typeof navigator.share === "function" &&
			window.matchMedia("(pointer: coarse)").matches &&
			(navigator.canShare?.({ url }) ?? false)
		)
	}

	const [supportsNativeShare] = useState(() =>
		supportsNativeSharing(currentUrl)
	)

	// Build share text once
	const shareText = (() => {
		const price = priceMad.toLocaleString()
		return t("text", {
			propertyType: propertyTypeLabel,
			neighborhood: neighborhood || "",
			city,
			price,
			title,
		}).trim()
	})()

	// Detect native share support on client only
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	const handleNativeShare = async () => {
		try {
			await navigator.share({
				title,
				text: shareText,
				url: currentUrl,
			})
		} catch (error) {
			// AbortError = user cancelled, treat as no-op
			if ((error as Error).name === "AbortError") {
				return
			}
			// For other errors, fall back to menu
			setMenuOpen(true)
		}
	}

	const handleCopyLink = async () => {
		setCopyError(null)
		let success = false

		try {
			// Try modern Clipboard API first
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(currentUrl)
				success = true
			} else {
				throw new Error("Clipboard API unavailable")
			}
		} catch {
			// Fallback: hidden textarea + execCommand
			try {
				const textarea = document.createElement("textarea")
				textarea.value = currentUrl
				textarea.style.position = "fixed"
				textarea.style.opacity = "0"
				textarea.style.left = "-9999px"
				document.body.appendChild(textarea)
				textarea.select()
				const result = document.execCommand("copy")
				document.body.removeChild(textarea)
				if (result) {
					success = true
				} else {
					throw new Error("execCommand failed")
				}
			} catch {
				success = false
			}
		}

		if (success) {
			setCopySuccess(true)
			if (timeoutRef.current) clearTimeout(timeoutRef.current)
			timeoutRef.current = setTimeout(() => setCopySuccess(false), 2000)
		} else {
			setCopyError(t("copyFailed"))
		}
	}

	const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + currentUrl)}`
	const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`
	const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`
	const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText + "\n\n" + currentUrl)}`


	return (
		<>
			{!supportsNativeShare ? (
				<DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
					<DropdownMenu.Trigger asChild>
						<button
							type="button"
							aria-label={t("label")}
							aria-haspopup="menu"
							aria-expanded={menuOpen}
							className="listing-bookmark"
						>
							<Share2 className="size-4" style={{ color: "white" }} />
						</button>
					</DropdownMenu.Trigger>

					<DropdownMenu.Portal>
						<DropdownMenu.Content
							side="bottom"
							sideOffset={4}
							align="end"
							className="z-50 min-w-48 rounded-lg border border-border bg-popover p-1 shadow-md"
						>
							<DropdownMenu.Item
								asChild
								className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
							>
								<a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
									<MessageCircle className="size-4 text-[#25D366]" />
									{t("whatsapp")}
								</a>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								asChild
								className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
							>
								<a href={facebookUrl} target="_blank" rel="noopener noreferrer">
									<span className="size-4 rounded-full bg-[#1877F2] text-white text-xs flex items-center justify-center font-bold">
										f
									</span>
									{t("facebook")}
								</a>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								asChild
								className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
							>
								<a href={telegramUrl} target="_blank" rel="noopener noreferrer">
									<span className="size-4 rounded-full bg-[#0088cc] text-white text-xs flex items-center justify-center font-bold">
										tg
									</span>
									{t("telegram")}
								</a>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								asChild
								className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
							>
								<a href={emailUrl}>
									<Mail className="size-4" />
									{t("email")}
								</a>
							</DropdownMenu.Item>

							<DropdownMenu.Separator className="my-1 h-px bg-border" />

							<DropdownMenu.Item
								onSelect={(e) => {
									e.preventDefault()
									handleCopyLink()
								}}
								className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
							>
								{copySuccess ? (
									<>
										<Check className="size-4 text-green-600" />
										<span className="text-green-600">
											{t("linkCopied")}
										</span>
									</>
								) : (
									<>
										<Copy className="size-4" />
										{t("copyLink")}
									</>
								)}
							</DropdownMenu.Item>

							{copyError && (
								<div className="px-3 py-2 text-xs text-destructive">
									{copyError}
									<input
										type="text"
										readOnly
										value={currentUrl}
										className="mt-1 w-full rounded border border-border bg-muted px-2 py-1 text-xs"
										onClick={(e) => e.currentTarget.select()}
									/>
								</div>
							)}
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			) : (
				<button
					type="button"
					onClick={handleNativeShare}
					aria-label={t("label")}
					className="listing-bookmark"
				>
					<Share2 className="size-4" />
				</button>
			)}

			<div aria-live="polite" aria-atomic="true" className="sr-only">
				{copySuccess ? t("linkCopied") : ""}
			</div>
		</>
	)
}

export default ShareListingButton
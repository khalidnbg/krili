"use client"

import { toggleBookmark } from "@/lib/actions/bookmarks.action"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface BookmarkButtonProps {
	listingId: string
	initialSaved?: boolean
}

const BookmarkButton = ({ listingId, initialSaved = false }: BookmarkButtonProps) => {
	const router = useRouter()
	const [saved, setSaved] = useState(initialSaved)
	const [busy, setBusy] = useState(false)

	const handleToggle = async () => {
		if (busy) return
		setBusy(true)

		const previous = saved
		setSaved(!saved) // optimistic

		const result = await toggleBookmark(listingId)

		if (!result.ok) {
			setSaved(previous)
			if (result.error === "auth") router.push("/sign-in")
		} else {
			setSaved(result.saved)
		}

		setBusy(false)
	}


	return (
		<button
			type="button"
			className="listing-bookmark"
			aria-label={saved ? "Remove from saved listings" : "Save listing"}
			aria-pressed={saved}
			onClick={handleToggle}
		>
			<Image
				src={saved ? "/icons/bookmark-filled.svg" : "/icons/bookmark.svg"}
				alt={saved ? "saved" : "not saved"}
				width={12.5}
				height={15}
			/>
		</button>
	)
}

export default BookmarkButton
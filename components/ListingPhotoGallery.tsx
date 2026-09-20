"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

interface ListingPhotosGalleryProps {
	photos: { url: string, is_cover: boolean }[]
	title?: string
}

const ListingPhotoGallery = ({ photos, title }: ListingPhotosGalleryProps) => {
	if (!photos.length) return null

	const initialActive = Math.max(0, photos.findIndex((photo) => photo.is_cover))
	const [active, setActive] = useState(initialActive)

	return (
		<div className="flex flex-col gap-3">
			<div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-black bg-muted">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={photos[active].url}
					alt={title ? `${title} — photo ${active + 1}` : `Photo ${active + 1}`}
					className="h-full w-full object-cover"
				/>
			</div>

			{photos.length > 1 && (
				<div className="flex gap-2 overflow-x-auto">
					{photos.map((photo, index) => (
						<button
							type="button"
							key={photo.url}
							onClick={() => setActive(index)}
							className={cn(
								"relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg border",
								index === active
									? "border-2 border-primary"
									: "border-border opacity-75 hover:opacity-100"
							)}
							aria-label={`Show photo ${index + 1}`}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={photo.url} alt="" className="h-full w-full object-cover" />
						</button>
					))}
				</div>
			)}
		</div>
	)
}

export default ListingPhotoGallery
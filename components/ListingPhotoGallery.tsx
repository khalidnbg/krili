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
		<div className="flex flex-col gap-3 lg:grid lg:grid-cols-[5fr_4fr] lg:items-start lg:gap-6">
			{/* cover (main) image — LEFT column on laptop, top on mobile */}
			<div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl border border-black bg-muted lg:ml-0 lg:mr-0">

				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={photos[active].url}
					alt={title ? `${title} — photo ${active + 1}` : `Photo ${active + 1}`}
					className="h-full w-full object-cover"
				/>
			</div>

			{/* thumbnails — RIGHT column (2-up grid) on laptop, scroll row on mobile */}
			{photos.length > 1 && (
				<div className="mx-auto flex w-full max-w-md gap-2 overflow-x-auto lg:grid lg:grid-cols-2 lg:gap-3 lg:content-start lg:max-w-full">
					{photos.filter((_, index) => index !== active).map((photo, index) => (
						<button
							type="button"
							key={photo.url}
							onClick={() => setActive(index)}
							className={cn(
								"relative w-24 shrink-0 aspect-square overflow-hidden rounded-lg border lg:w-full",
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

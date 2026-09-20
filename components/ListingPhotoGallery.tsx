"use client"

import { cn } from "@/lib/utils"
import { X, ChevronLeft, ChevronRight, Grid2x2 } from "lucide-react"
import { useEffect, useState } from "react"

interface ListingPhotosGalleryProps {
	photos: { url: string, is_cover: boolean }[]
	title?: string
}

const ListingPhotoGallery = ({ photos, title }: ListingPhotosGalleryProps) => {
	if (!photos.length) return null

	const initialActive = Math.max(0, photos.findIndex((photo) => photo.is_cover))
	const [active, setActive] = useState(initialActive)
	const [lightboxOpen, setLightboxOpen] = useState(false)

	const openLightbox = (index: number) => {
		setActive(index)
		setLightboxOpen(true)
	}

	const goPrev = () => setActive((i) => (i === 0 ? photos.length - 1 : i - 1))
	const goNext = () => setActive((i) => (i === photos.length - 1 ? 0 : i + 1))

	useEffect(() => {
		if (!lightboxOpen) return

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setLightboxOpen(false)
			if (e.key === "ArrowLeft") goPrev()
			if (e.key === "ArrowRight") goNext()
		}

		window.addEventListener("keydown", onKeyDown)
		document.body.style.overflow = "hidden"

		return () => {
			window.removeEventListener("keydown", onKeyDown)
			document.body.style.overflow = ""
		}
	}, [lightboxOpen])

	// grid shows cover + up to 4 more; extras beyond that are only reachable via lightbox
	const gridPhotos = photos.slice(1, 5)
	const remainingCount = photos.length - 5

	return (
		<>
			<div className="relative grid grid-cols-1 gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2 sm:aspect-[16/9]">
				{/* cover photo — large, left side */}
				<button
					type="button"
					onClick={() => openLightbox(0)}
					className="relative col-span-1 row-span-1 aspect-[4/3] w-full overflow-hidden sm:col-span-2 sm:row-span-2 sm:aspect-auto"
					aria-label="Open photo gallery"
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={photos[0].url}
						alt={title ? `${title} — photo 1` : "Photo 1"}
						className="h-full w-full object-cover transition-opacity hover:opacity-90"
					/>
				</button>

				{/* small grid photos — right side, 2x2 */}
				{gridPhotos.map((photo, i) => {
					const index = i + 1
					const isLastVisible = i === gridPhotos.length - 1 && remainingCount > 0

					return (
						<button
							type="button"
							key={photo.url}
							onClick={() => openLightbox(index)}
							className="relative col-span-1 row-span-1 hidden aspect-square w-full overflow-hidden sm:block sm:aspect-auto"
							aria-label={`Open photo ${index + 1}`}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={photo.url}
								alt=""
								className="h-full w-full object-cover transition-opacity hover:opacity-90"
							/>
							{isLastVisible && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-medium text-white">
									+{remainingCount}
								</div>
							)}
						</button>
					)
				})}

				{/* show all photos button */}
				{photos.length > 1 && (
					<button
						type="button"
						onClick={() => openLightbox(active)}
						className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-lg border border-black bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted"
					>
						<Grid2x2 className="h-4 w-4" />
						Show all photos
					</button>
				)}
			</div>

			{/* fullscreen lightbox */}
			{lightboxOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
					onClick={() => setLightboxOpen(false)}
				>
					<button
						type="button"
						onClick={() => setLightboxOpen(false)}
						className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10"
						aria-label="Close gallery"
					>
						<X className="h-6 w-6" />
					</button>

					{photos.length > 1 && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								goPrev()
							}}
							className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white hover:bg-white/10"
							aria-label="Previous photo"
						>
							<ChevronLeft className="h-8 w-8" />
						</button>
					)}

					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={photos[active].url}
						alt={title ? `${title} — photo ${active + 1}` : `Photo ${active + 1}`}
						className="max-h-[90vh] max-w-[90vw] object-contain"
						onClick={(e) => e.stopPropagation()}
					/>

					{photos.length > 1 && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								goNext()
							}}
							className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white hover:bg-white/10"
							aria-label="Next photo"
						>
							<ChevronRight className="h-8 w-8" />
						</button>
					)}

					{photos.length > 1 && (
						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
							{active + 1} / {photos.length}
						</div>
					)}
				</div>
			)}
		</>
	)
}

export default ListingPhotoGallery
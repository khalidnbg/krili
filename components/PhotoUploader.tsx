"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PhotoUploaderState {
	files: File[]
	coverIndex: number
}

interface PhotoItem {
	file: File
	url: string
}

interface PhotoUploaderProps {
	onChange?: (state: PhotoUploaderState) => void
	max?: number
	maxSizeMB?: number
}

const PhotoUploader = ({ onChange, max = 5, maxSizeMB = 5 }: PhotoUploaderProps) => {
	const [items, setItems] = useState<PhotoItem[]>([])
	const [coverIndex, setCoverIndex] = useState(0)
	const [error, setError] = useState<string | null>(null)
	const [dragging, setDragging] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const itemsRef = useRef<PhotoItem[]>([])
	itemsRef.current = items

	// Revoke all object URLs on unmount to avoid memory leaks.
	useEffect(() => {
		return () => {
			itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url))
		}
	}, [])

	const notify = (next: PhotoItem[], nextCover: number) => {
		onChange?.({
			files: next.map((item) => item.file),
			coverIndex: nextCover,
		})
	}

	const addFiles = (incoming: FileList | File[]) => {
		const newFiles = Array.from(incoming)
		if (!newFiles.length) return

		const accepted: PhotoItem[] = []
		const remaining = max - items.length

		for (const file of newFiles) {
			if (accepted.length >= remaining) {
				setError(`You can add up to ${max} photos.`)
				break
			}
			if (!file.type.startsWith("image/")) {
				setError(`"${file.name}" is not an image file.`)
				continue
			}
			if (file.size > maxSizeMB * 1024 * 1024) {
				setError(`"${file.name}" exceeds the ${maxSizeMB}MB limit.`)
				continue
			}
			accepted.push({ file, url: URL.createObjectURL(file) })
		}

		if (!accepted.length) return
		setError(null)

		const next = [...items, ...accepted]
		const nextCover = Math.min(coverIndex, next.length - 1)
		setItems(next)
		setCoverIndex(nextCover)
		notify(next, nextCover)
	}

	const removePhoto = (index: number) => {
		const item = items[index]
		const next = items.filter((_, i) => i !== index)
		URL.revokeObjectURL(item.url)

		let nextCover = coverIndex
		if (next.length === 0) {
			nextCover = 0
		} else if (index === coverIndex) {
			nextCover = Math.min(index, next.length - 1)
		} else if (index < coverIndex) {
			nextCover = coverIndex - 1
		}

		setItems(next)
		setCoverIndex(nextCover)
		notify(next, nextCover)
	}

	const move = (index: number, dir: -1 | 1) => {
		const target = index + dir
		if (target < 0 || target >= items.length) return

		const next = [...items]
		const temp = next[index]
		next[index] = next[target]
		next[target] = temp

		let nextCover = coverIndex
		if (coverIndex === index) nextCover = target
		else if (coverIndex === target) nextCover = index

		setItems(next)
		setCoverIndex(nextCover)
		notify(next, nextCover)
	}

	const setCover = (index: number) => {
		setCoverIndex(index)
		notify(items, index)
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) addFiles(e.target.files)
		e.target.value = "" // allow re-selecting the same file
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		setDragging(false)
		addFiles(e.dataTransfer.files)
	}

	return (
		<div className="flex flex-col gap-3">
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				multiple
				className="hidden"
				onChange={handleInputChange}
			/>

			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				onDragOver={(e) => {
					e.preventDefault()
					setDragging(true)
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={handleDrop}
				className={cn(
					"flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-8 text-center text-sm text-muted-foreground transition-colors",
					dragging && "border-primary bg-muted"
				)}
			>
				<ImagePlus className="size-6" />
				<span className="font-medium">Click to upload or drag &amp; drop</span>
				<span className="text-xs">PNG, JPG or WEBP · up to {max} photos · {maxSizeMB}MB max</span>
			</button>

			{error && <p className="text-sm text-destructive">{error}</p>}

			{items.length > 0 && (
				<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
					{items.map((item, index) => (
						<div
							key={item.url}
							className={cn(
								"group relative aspect-square overflow-hidden rounded-xl border",
								index === coverIndex ? "border-2 border-primary" : "border-border"
							)}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={item.url}
								alt={`Listing photo ${index + 1}`}
								className="h-full w-full object-cover"
							/>

							{index === coverIndex ? (
								<span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
									<Check className="size-3" /> Cover
								</span>
							) : (
								<button
									type="button"
									onClick={() => setCover(index)}
									className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-1 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
								>
									Set cover
								</button>
							)}

							<div className="absolute bottom-1.5 left-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
								<button
									type="button"
									onClick={() => move(index, -1)}
									disabled={index === 0}
									aria-label="Move photo left"
									className="rounded-md bg-black/60 p-1 text-white disabled:opacity-40"
								>
									<ChevronLeft className="size-3" />
								</button>
								<button
									type="button"
									onClick={() => move(index, 1)}
									disabled={index === items.length - 1}
									aria-label="Move photo right"
									className="rounded-md bg-black/60 p-1 text-white disabled:opacity-40"
								>
									<ChevronRight className="size-3" />
								</button>
							</div>

							<button
								type="button"
								onClick={() => removePhoto(index)}
								aria-label={`Remove photo ${index + 1}`}
								className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1 text-white"
							>
								<X className="size-3" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default PhotoUploader

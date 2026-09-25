"use client";

import { cn } from "@/lib/utils";
import { Check, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ManagedPhotosState {
	existing: { url: string }[]; // kept existing photos, in order
	newFiles: File[]; // new uploads, appended after existing
	coverIndex: number; // index into the combined [existing, ...new] list
}

interface PhotoItem {
	id: string;
	url: string; // existing url OR object URL for a new file
	file?: File;
}

interface PhotoManagerProps {
	initialPhotos?: ListingPhoto[];
	onChange?: (state: ManagedPhotosState) => void;
	max?: number;
	maxSizeMB?: number;
}

const PhotoManager = ({
	initialPhotos = [],
	onChange,
	max = 5,
	maxSizeMB = 5,
}: PhotoManagerProps) => {
	const [items, setItems] = useState<PhotoItem[]>(() =>
		initialPhotos.map((photo, index) => ({ id: `existing-${index}`, url: photo.url }))
	)

	const [coverIndex, setCoverIndex] = useState(() =>
		Math.max(0, initialPhotos.findIndex((photo) => photo.is_cover))
	)

	const [error, setError] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const itemsRef = useRef<PhotoItem[]>([])
	itemsRef.current = items

	useEffect(() => {
		return () => {
			itemsRef.current.forEach((item) => {
				if (item.file) URL.revokeObjectURL(item.url)
			})
		}
	}, [])

	const notify = (next: PhotoItem[], nextCover: number) => {
		onChange?.({
			existing: next.filter((item) => !item.file).map((item) => ({ url: item.url })),
			newFiles: next.filter((item) => item.file).map((item) => item.file!),
			coverIndex: nextCover,
		})
	}

	const removePhoto = (index: number) => {
		const item = items[index]
		const next = items.filter((_, i) => i !== index)
		if (item.file) URL.revokeObjectURL(item.url)
		setItems(next)
		setCoverIndex((prev) => {
			let nextCover = prev
			if (next.length === 0) nextCover = 0
			else if (index === prev) nextCover = Math.min(index, next.length - 1)
			else if (index < prev) nextCover = prev - 1
			notify(next, nextCover)
			return nextCover
		})
	}

	const setCover = (index: number) => {
		setCoverIndex(index)
		notify(items, index)
	}

	const addFiles = (incoming: FileList | File[]) => {
		const incomingFiles = Array.from(incoming)
		if (!incomingFiles.length) return

		const accepted: PhotoItem[] = []
		const remaining = max - items.length

		for (const file of incomingFiles) {
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
			accepted.push({ id: `new-${Date.now()}-${Math.random()}`, url: URL.createObjectURL(file), file })
		}

		if (!accepted.length) return
		setError(null)

		const next = [...items, ...accepted]
		setItems(next)
		notify(next, Math.min(coverIndex, next.length - 1))
	}

	return <div className="flex flex-col gap-3">
		<input
			ref={inputRef}
			type="file"
			accept="image/*"
			multiple
			className="hidden"
			onChange={(e) => {
				if (e.target.files) addFiles(e.target.files)
				e.target.value = ""
			}}
		/>

		<button
			type="button"
			onClick={() => inputRef.current?.click()}
			className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-6 text-center text-sm text-muted-foreground"
		>
			<ImagePlus className="size-6" />
			<span className="font-medium">Add or replace photos — click to upload</span>
			<span className="text-xs">Click a photo to make it the cover. Click ✕ to remove.</span>
		</button>

		{error && <p className="text-sm text-destructive">{error}</p>}

		{items.length > 0 && (
			<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
				{items.map((item, index) => (
					<div
						key={item.id}
						className={cn(
							"group relative aspect-square overflow-hidden rounded-xl border",
							index === coverIndex ? "border-2 border-primary" : "border-border"
						)}
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={item.url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
						<button
							type="button"
							onClick={() => setCover(index)}
							className={cn(
								"absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
								index === coverIndex ? "bg-primary text-primary-foreground" : "bg-black/60 text-white"
							)}
						>
							<Check className="mr-1 inline size-3" />Cover
						</button>

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
};

export default PhotoManager;

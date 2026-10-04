"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { cities, propertyTypes } from "@/constants"
import { createListing } from "@/lib/actions/listing.action"
import { listingSchema } from "@/lib/schema"
import PhotoUploader, { PhotoUploaderState } from "./PhotoUploader"
import { useState } from "react"
import { Textarea } from "./ui/textarea"

const inputClass = "rounded-xl border-neutral-200"

const ListingForm = () => {
	const router = useRouter()
	const [photos, setPhotos] = useState<PhotoUploaderState>({ files: [], coverIndex: 0 })

	const form = useForm<z.infer<typeof listingSchema>>({
		resolver: zodResolver(listingSchema),
		defaultValues: {
			title: "",
			type: "" as PropertyType,
			rooms: 1,
			price: 1500,
			neighborhood: "",
			city: "",
			hasCaution: false,
			cautionAmount: undefined,
			description: "",
			beds: 1,
			bathrooms: 1,
			furnished: false,
			petFriendly: false,
			availableFrom: ""
		},
	})

	const onSubmit = async (values: z.infer<typeof listingSchema>) => {
		const listing = await createListing(values, photos.files, photos.coverIndex)

		if (listing) {
			router.push(`/listings/${listing.id}`)
		} else {
			console.error("Failed to create listing")
			router.push("/")
		}
	}

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] md:p-8">
			<FieldGroup>
				<Field data-invalid={!!form.formState.errors.title}>
					<FieldLabel htmlFor="title" className="text-neutral-700">Listing title</FieldLabel>
					<Input
						id="title"
						placeholder="Ex. Bright studio in Maârif"
						aria-invalid={!!form.formState.errors.title}
						className={inputClass}
						{...form.register("title")}
					/>
					{form.formState.errors.title && (
						<FieldError>{form.formState.errors.title.message}</FieldError>
					)}
				</Field>

				<Controller
					control={form.control}
					name="type"
					render={({ field }) => (
						<Field data-invalid={!!form.formState.errors.type}>
							<FieldLabel htmlFor="type" className="text-neutral-700">Property type</FieldLabel>
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger
									id="type"
									className={`w-full capitalize ${inputClass}`}
									aria-invalid={!!form.formState.errors.type}
								>
									<SelectValue placeholder="Select the type" />
								</SelectTrigger>
								<SelectContent>
									{propertyTypes.map((type) => (
										<SelectItem value={type} key={type} className="capitalize">
											{type}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{form.formState.errors.type && (
								<FieldError>{form.formState.errors.type.message}</FieldError>
							)}
						</Field>
					)}
				/>

				<Field data-invalid={!!form.formState.errors.rooms}>
					<FieldLabel htmlFor="rooms" className="text-neutral-700">Rooms</FieldLabel>
					<Input
						id="rooms"
						type="number"
						min={1}
						placeholder="2"
						aria-invalid={!!form.formState.errors.rooms}
						className={inputClass}
						{...form.register("rooms")}
					/>
					{form.formState.errors.rooms && (
						<FieldError>{form.formState.errors.rooms.message}</FieldError>
					)}
				</Field>

				<Field data-invalid={!!form.formState.errors.price}>
					<FieldLabel htmlFor="price" className="text-neutral-700">Rent per month (MAD)</FieldLabel>
					<Input
						id="price"
						type="number"
						min={1}
						placeholder="2500"
						aria-invalid={!!form.formState.errors.price}
						className={inputClass}
						{...form.register("price")}
					/>
					<FieldDescription className="text-neutral-400">Monthly rent in Moroccan Dirham.</FieldDescription>
					{form.formState.errors.price && (
						<FieldError>{form.formState.errors.price.message}</FieldError>
					)}
				</Field>

				<Field data-invalid={!!form.formState.errors.neighborhood}>
					<FieldLabel htmlFor="neighborhood" className="text-neutral-700">Neighborhood</FieldLabel>
					<Input
						id="neighborhood"
						placeholder="Ex. Maârif"
						aria-invalid={!!form.formState.errors.neighborhood}
						className={inputClass}
						{...form.register("neighborhood")}
					/>
					{form.formState.errors.neighborhood && (
						<FieldError>{form.formState.errors.neighborhood.message}</FieldError>
					)}
				</Field>

				<Controller
					control={form.control}
					name="city"
					render={({ field }) => (
						<Field data-invalid={!!form.formState.errors.city}>
							<FieldLabel htmlFor="city" className="text-neutral-700">City</FieldLabel>
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger
									id="city"
									className={`w-full capitalize ${inputClass}`}
									aria-invalid={!!form.formState.errors.city}
								>
									<SelectValue placeholder="Select the city" />
								</SelectTrigger>
								<SelectContent>
									{cities.map((city) => (
										<SelectItem value={city} key={city} className="capitalize">
											{city}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{form.formState.errors.city && (
								<FieldError>{form.formState.errors.city.message}</FieldError>
							)}
						</Field>
					)}
				/>

				<Controller
					control={form.control}
					name="hasCaution"
					render={({ field }) => (
						<Field>
							<FieldLabel className="flex cursor-pointer items-center gap-2 text-neutral-700">
								<input
									type="checkbox"
									checked={field.value}
									onChange={(e) => field.onChange(e.target.checked)}
									className="size-4 accent-[#FE5933]"
								/>
								Security deposit (caution)
							</FieldLabel>
						</Field>
					)}
				/>

				{form.watch("hasCaution") && (
					<Field data-invalid={!!form.formState.errors.cautionAmount}>
						<FieldLabel htmlFor="cautionAmount" className="text-neutral-700">Caution amount (MAD)</FieldLabel>
						<Input
							id="cautionAmount"
							type="number"
							min={0}
							placeholder="3000"
							aria-invalid={!!form.formState.errors.cautionAmount}
							className={inputClass}
							{...form.register("cautionAmount")}
						/>
						{form.formState.errors.cautionAmount && (
							<FieldError>{form.formState.errors.cautionAmount.message}</FieldError>
						)}
					</Field>
				)}

				<Field data-invalid={!!form.formState.errors.description}>
					<FieldLabel htmlFor="description" className="text-neutral-700">Description</FieldLabel>
					<Textarea
						id="description"
						rows={4}
						placeholder="Describe the property, features, and who it's ideal for…"
						aria-invalid={!!form.formState.errors.description}
						className={inputClass}
						{...form.register("description")}
					/>
					{form.formState.errors.description && (
						<FieldError>{form.formState.errors.description.message}</FieldError>
					)}
				</Field>

				<div className="grid grid-cols-2 gap-4">
					<Field data-invalid={!!form.formState.errors.beds}>
						<FieldLabel htmlFor="beds" className="text-neutral-700">Beds</FieldLabel>
						<Input id="beds" type="number" min={1} aria-invalid={!!form.formState.errors.beds}
							className={inputClass} {...form.register("beds")} />
					</Field>
					<Field data-invalid={!!form.formState.errors.bathrooms}>
						<FieldLabel htmlFor="bathrooms" className="text-neutral-700">Bathrooms</FieldLabel>
						<Input id="bathrooms" type="number" min={1} aria-invalid={!!form.formState.errors.bathrooms}
							className={inputClass} {...form.register("bathrooms")} />
					</Field>
				</div>

				<Field>
					<FieldLabel className="flex cursor-pointer items-center gap-2 text-neutral-700">
						<input type="checkbox" {...form.register("furnished")} className="size-4 accent-[#FE5933]" />
						Furnished
					</FieldLabel>
					<FieldLabel className="flex cursor-pointer items-center gap-2 text-neutral-700">
						<input type="checkbox" {...form.register("petFriendly")} className="size-4 accent-[#FE5933]" />
						Pet friendly
					</FieldLabel>
				</Field>

				<Field>
					<FieldLabel htmlFor="availableFrom" className="text-neutral-700">Available from</FieldLabel>
					<Input id="availableFrom" type="date" className={inputClass} {...form.register("availableFrom")} />
				</Field>

				<Field>
					<FieldLabel className="text-neutral-700">Photos</FieldLabel>
					<PhotoUploader onChange={setPhotos} max={5} maxSizeMB={5} />
					<FieldDescription className="text-neutral-400">
						Add up to 5 photos — the first one is used as the cover on cards.
					</FieldDescription>
				</Field>

				<Button type="submit" className="w-full cursor-pointer rounded-full bg-neutral-900 hover:bg-neutral-800">
					Publish listing
				</Button>
			</FieldGroup>
		</form>
	)
}

export default ListingForm
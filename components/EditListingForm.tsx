"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import PhotoManager, { type ManagedPhotosState } from "@/components/PhotoManager"
import { listingSchema } from "@/lib/schema"
import { getManagedListing, replaceManagedPhotos, updateManagedListing } from "@/lib/actions/listing.action"
import { Button } from "@/components/ui/button"
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { cities, propertyTypes } from "@/constants"

const inputClass = "rounded-xl border-neutral-200"

interface EditListingFormProps {
	managed: Awaited<ReturnType<typeof getManagedListing>>
}

const EditListingForm = ({ managed }: EditListingFormProps) => {
	const router = useRouter()
	const [photoState, setPhotoState] = useState<ManagedPhotosState>({
		existing: (managed?.photos ?? []).map((photo) => ({ url: photo.url })),
		newFiles: [],
		coverIndex: Math.max(0, (managed?.photos ?? []).findIndex((photo) => photo.is_cover)),
	})

	const form = useForm<z.infer<typeof listingSchema>>({
		resolver: zodResolver(listingSchema),
		values: managed
			? {
				title: managed.title,
				type: managed.type,
				rooms: managed.rooms,
				price: managed.price,
				neighborhood: managed.neighborhood,
				city: managed.city,
				hasCaution: managed.hasCaution,
				cautionAmount: managed.cautionAmount,
				description: managed.description,
				beds: managed.beds ?? managed.rooms,
				bathrooms: managed.bathrooms ?? 1,
				furnished: managed.furnished ?? false,
				petFriendly: managed.petFriendly ?? false,
				availableFrom: managed.availableFrom ?? "",
			}
			: undefined,
	})

	const onSubmit = async (values: z.infer<typeof listingSchema>) => {
		const updated = await updateManagedListing(managed!.id, values)
		if (!updated) return

		await replaceManagedPhotos(
			managed!.id,
			photoState.existing,
			photoState.newFiles,
			photoState.coverIndex
		)

		router.push(`/listings/${managed!.id}`)
		router.refresh()
	}

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] md:p-8">
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="title" className="text-neutral-700">Listing title</FieldLabel>
					<Input id="title" placeholder="Ex. Bright studio in Maârif" className={inputClass} {...form.register("title")} />
					{form.formState.errors.title && (
						<FieldError>{form.formState.errors.title.message}</FieldError>
					)}
				</Field>

				<Controller
					control={form.control}
					name="type"
					render={({ field }) => (
						<Field>
							<FieldLabel htmlFor="type" className="text-neutral-700">Property type</FieldLabel>
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger id="type" className={`w-full capitalize ${inputClass}`}>
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

				<Field>
					<FieldLabel htmlFor="rooms" className="text-neutral-700">Rooms</FieldLabel>
					<Input id="rooms" type="number" min={1} className={inputClass} {...form.register("rooms")} />
					{form.formState.errors.rooms && (
						<FieldError>{form.formState.errors.rooms.message}</FieldError>
					)}
				</Field>

				<Field>
					<FieldLabel htmlFor="price" className="text-neutral-700">Rent per month (MAD)</FieldLabel>
					<Input id="price" type="number" min={1} className={inputClass} {...form.register("price")} />
					{form.formState.errors.price && (
						<FieldError>{form.formState.errors.price.message}</FieldError>
					)}
				</Field>

				<Field>
					<FieldLabel htmlFor="neighborhood" className="text-neutral-700">Neighborhood</FieldLabel>
					<Input id="neighborhood" placeholder="Ex. Maârif" className={inputClass} {...form.register("neighborhood")} />
					{form.formState.errors.neighborhood && (
						<FieldError>{form.formState.errors.neighborhood.message}</FieldError>
					)}
				</Field>

				<Controller
					control={form.control}
					name="city"
					render={({ field }) => (
						<Field>
							<FieldLabel htmlFor="city" className="text-neutral-700">City</FieldLabel>
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger id="city" className={`w-full capitalize ${inputClass}`}>
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

				<Field>
					<FieldLabel htmlFor="hasCaution" className="flex cursor-pointer items-center gap-2 text-neutral-700">
						<input
							id="hasCaution"
							type="checkbox"
							{...form.register("hasCaution")}
							className="size-4 accent-[#FE5933]"
						/>
						Security deposit (caution)
					</FieldLabel>
				</Field>

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
						<Input
							id="beds"
							type="number"
							min={1}
							aria-invalid={!!form.formState.errors.beds}
							className={inputClass}
							{...form.register("beds")}
						/>
					</Field>
					<Field data-invalid={!!form.formState.errors.bathrooms}>
						<FieldLabel htmlFor="bathrooms" className="text-neutral-700">Bathrooms</FieldLabel>
						<Input
							id="bathrooms"
							type="number"
							min={1}
							aria-invalid={!!form.formState.errors.bathrooms}
							className={inputClass}
							{...form.register("bathrooms")}
						/>
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
					<PhotoManager
						initialPhotos={managed?.photos ?? []}
						onChange={setPhotoState}
						max={5}
						maxSizeMB={5}
					/>
				</Field>

				<div className="flex gap-2">
					<Button type="submit" className="w-full cursor-pointer rounded-full bg-neutral-900 hover:bg-neutral-800">
						Save changes
					</Button>
					<Button
						type="button"
						variant="ghost"
						onClick={() => router.push(`/listings/${managed!.id}`)}
						className="rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
					>
						Cancel
					</Button>
				</div>
			</FieldGroup>
		</form>
	)
}

export default EditListingForm
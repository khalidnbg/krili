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
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { cities, propertyTypes } from "@/constants"

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
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="title">Listing title</FieldLabel>
					<Input id="title" placeholder="Ex. Bright studio in Maârif" {...form.register("title")} />
					{form.formState.errors.title && (
						<FieldError>{form.formState.errors.title.message}</FieldError>
					)}
				</Field>

				<Controller
					control={form.control}
					name="type"
					render={({ field }) => (
						<Field>
							<FieldLabel htmlFor="type">Property type</FieldLabel>
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger id="type" className="w-full capitalize">
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
					<FieldLabel htmlFor="rooms">Rooms</FieldLabel>
					<Input id="rooms" type="number" min={1} {...form.register("rooms")} />
					{form.formState.errors.rooms && (
						<FieldError>{form.formState.errors.rooms.message}</FieldError>
					)}
				</Field>

				<Field>
					<FieldLabel htmlFor="price">Rent per month (MAD)</FieldLabel>
					<Input id="price" type="number" min={1} {...form.register("price")} />
					{form.formState.errors.price && (
						<FieldError>{form.formState.errors.price.message}</FieldError>
					)}
				</Field>


				<Field>
					<FieldLabel htmlFor="neighborhood">Neighborhood</FieldLabel>
					<Input id="neighborhood" placeholder="Ex. Maârif" {...form.register("neighborhood")} />
					{form.formState.errors.neighborhood && (
						<FieldError>{form.formState.errors.neighborhood.message}</FieldError>
					)}
				</Field>

				<Controller
					control={form.control}
					name="city"
					render={({ field }) => (
						<Field>
							<FieldLabel htmlFor="city">City</FieldLabel>
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger id="city" className="w-full capitalize">
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
					<FieldLabel htmlFor="hasCaution" className="flex items-center gap-2 cursor-pointer">
						<input
							id="hasCaution"
							type="checkbox"
							{...form.register("hasCaution")}
							className="size-4 accent-black"
						/>
						Security deposit (caution)
					</FieldLabel>
				</Field>

				<Field>
					<FieldLabel>Photos</FieldLabel>
					<PhotoManager
						initialPhotos={managed?.photos ?? []}
						onChange={setPhotoState}
						max={5}
						maxSizeMB={5}
					/>
				</Field>

				<div className="flex gap-2">
					<Button type="submit" className="w-full cursor-pointer">Save changes</Button>
					<Button type="button" variant="ghost" onClick={() => router.push(`/listings/${managed!.id}`)}>
						Cancel
					</Button>
				</div>
			</FieldGroup>
		</form>
	)
}

export default EditListingForm
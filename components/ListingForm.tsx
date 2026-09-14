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

const ListingForm = () => {
	const router = useRouter()

	const form = useForm<z.infer<typeof listingSchema>>({
		resolver: zodResolver(listingSchema),
		defaultValues: {
			title: "",
			// enum-typed field: "" only marks the select as unselected and is
			// rejected by zodResolver before this can ever be submitted.
			type: "" as PropertyType,
			rooms: 1,
			price: 1500,
			neighborhood: "",
			city: "",
			hasCaution: false,
			cautionAmount: undefined,
		},
	})

	const onSubmit = async (values: z.infer<typeof listingSchema>) => {
		const listing = await createListing(values)

		if (listing) {
			router.push(`/listings/${listing.id}`)
		} else {
			console.error("Failed to create listing")
			router.push("/")
		}
	}

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
			<FieldGroup>
				<Field data-invalid={!!form.formState.errors.title}>
					<FieldLabel htmlFor="title">Listing title</FieldLabel>
					<Input
						id="title"
						placeholder="Ex. Bright studio in Maârif"
						aria-invalid={!!form.formState.errors.title}
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
							<FieldLabel htmlFor="type">Property type</FieldLabel>
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger
									id="type"
									className="w-full capitalize"
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
					<FieldLabel htmlFor="rooms">Rooms</FieldLabel>
					<Input
						id="rooms"
						type="number"
						min={1}
						placeholder="2"
						aria-invalid={!!form.formState.errors.rooms}
						{...form.register("rooms")}
					/>
					{form.formState.errors.rooms && (
						<FieldError>{form.formState.errors.rooms.message}</FieldError>
					)}
				</Field>

				<Field data-invalid={!!form.formState.errors.price}>
					<FieldLabel htmlFor="price">Rent per month (MAD)</FieldLabel>
					<Input
						id="price"
						type="number"
						min={1}
						placeholder="2500"
						aria-invalid={!!form.formState.errors.price}
						{...form.register("price")}
					/>
					<FieldDescription>Monthly rent in Moroccan Dirham.</FieldDescription>
					{form.formState.errors.price && (
						<FieldError>{form.formState.errors.price.message}</FieldError>
					)}
				</Field>

				<Field data-invalid={!!form.formState.errors.neighborhood}>
					<FieldLabel htmlFor="neighborhood">Neighborhood</FieldLabel>
					<Input
						id="neighborhood"
						placeholder="Ex. Maârif"
						aria-invalid={!!form.formState.errors.neighborhood}
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
							<FieldLabel htmlFor="city">City</FieldLabel>
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger
									id="city"
									className="w-full capitalize"
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
							<FieldLabel className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={field.value}
									onChange={(e) => field.onChange(e.target.checked)}
									className="size-4 accent-black"
								/>
								Security deposit (caution)
							</FieldLabel>
						</Field>
					)}
				/>

				{form.watch("hasCaution") && (
					<Field data-invalid={!!form.formState.errors.cautionAmount}>
						<FieldLabel htmlFor="cautionAmount">Caution amount (MAD)</FieldLabel>
						<Input
							id="cautionAmount"
							type="number"
							min={0}
							placeholder="3000"
							aria-invalid={!!form.formState.errors.cautionAmount}
							{...form.register("cautionAmount")}
						/>
						{form.formState.errors.cautionAmount && (
							<FieldError>{form.formState.errors.cautionAmount.message}</FieldError>
						)}
					</Field>
				)}

				<Button type="submit" className="w-full cursor-pointer">Publish Listing</Button>
			</FieldGroup>
		</form>
	)
}

export default ListingForm

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { cities, propertyTypes } from "@/constants"

const formSchema = z.object({
	title: z.string().min(1, { message: "Title is required." }),
	type: z.string().min(1, { message: "Property type is required." }),
	rooms: z.coerce.number().min(1, { message: "Rooms must be at least 1." }),
	price: z.coerce.number().min(1, { message: "Price is required." }),
	neighborhood: z.string().min(1, { message: "Neighborhood is required." }),
	city: z.string().min(1, { message: "City is required." }),
	hasCaution: z.boolean(),
	cautionAmount: z.coerce.number().optional(),
})

const ListingForm = () => {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			type: "",
			rooms: 1,
			price: 1500,
			neighborhood: "",
			city: "",
			hasCaution: false,
			cautionAmount: undefined,
		},
	})

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		// TODO: persist with a createListing server action (Supabase `listings` insert)
		console.log({
			...values,
			cautionAmount: values.hasCaution ? values.cautionAmount : undefined,
		})
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Listing title</FormLabel>
							<FormControl>
								<Input placeholder="Ex. Bright studio in Maârif" {...field} className="input" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Property type</FormLabel>
							<FormControl>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									defaultValue={field.value}
								>
									<SelectTrigger className="input capitalize">
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
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="rooms"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Rooms</FormLabel>
							<FormControl>
								<Input type="number" min={1} placeholder="2" {...field} className="input" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="price"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Rent per month (MAD)</FormLabel>
							<FormControl>
								<Input type="number" min={1} placeholder="2500" {...field} className="input" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="neighborhood"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Neighborhood</FormLabel>
							<FormControl>
								<Input placeholder="Ex. Maârif" {...field} className="input" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="city"
					render={({ field }) => (
						<FormItem>
							<FormLabel>City</FormLabel>
							<FormControl>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									defaultValue={field.value}
								>
									<SelectTrigger className="input capitalize">
										<SelectValue placeholder="Select the city" />
									</SelectTrigger>
									<SelectContent>
										{cities.map((cities) => (
											<SelectItem value={cities} key={cities} className="capitalize">
												{cities}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="hasCaution"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={field.value}
									onChange={(e) => field.onChange(e.target.checked)}
									className="size-4 accent-black"
								/>
								Security deposit (caution)
							</FormLabel>
							<FormMessage />
						</FormItem>
					)}
				/>

				{form.watch("hasCaution") && (
					<FormField
						control={form.control}
						name="cautionAmount"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Caution amount (MAD)</FormLabel>
								<FormControl>
									<Input type="number" min={0} placeholder="3000" {...field} className="input" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				<Button type="submit" className="w-full cursor-pointer">Publish Listing</Button>
			</form>
		</Form>
	)
}

export default ListingForm;
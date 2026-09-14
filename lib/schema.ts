import { z } from "zod"
import { propertyTypes } from "@/constants"

export const listingSchema = z.object({
	title: z.string().min(1, { message: "Title is required." }),
	type: z.enum(propertyTypes, { message: "Property type is required." }),
	rooms: z.coerce.number().min(1, { message: "Rooms must be at least 1." }),
	price: z.coerce.number().min(1, { message: "Price is required." }),
	neighborhood: z.string().min(1, { message: "Neighborhood is required." }),
	city: z.string().min(1, { message: "City is required." }),
	hasCaution: z.boolean(),
	cautionAmount: z.coerce.number().optional(),
})

export type ListingFormValues = z.infer<typeof listingSchema>

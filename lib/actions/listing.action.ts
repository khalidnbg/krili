"use server"

import { auth } from "@clerk/nextjs/server"
import { createSupabaseClient } from "../supabase";
import { } from "@/components/ListingForm";
import { ListingFormValues, listingSchema } from "../schema";

export async function createListing(input: ListingFormValues) {
	// Never trust the client — re-validate on the server.
	const parsed = listingSchema.safeParse(input);
	if (!parsed.success) {
		console.error("createListing: Validation failed", parsed.error);
		return null;
	}

	const { userId } = await auth();
	if (!userId) return null;

	const supabase = createSupabaseClient();

	// 1) Resolve the neighborhood lookup row (city + name → id).
	const { data: existing } = await supabase
		.from("neighborhoods")
		.select("id")
		.eq("name", parsed.data.neighborhood)
		.eq("city", parsed.data.city)
		.maybeSingle();

	let neighborhoodId = existing?.id;

	if (!neighborhoodId) {
		const { data: created, error: createError } = await supabase
			.from("neighborhoods")
			.insert({ name: parsed.data.neighborhood, city: parsed.data.city })
			.select("id")
			.maybeSingle();

		if (createError) {
			console.error("createListing could not create neighborhood:", createError.message)
			return null;
		}

		neighborhoodId = created?.id;
	}

	if (!neighborhoodId) {
		console.error("createListing could not resolve a neighborhood_id")
		return null
	}

	// 2) Insert the listing. RLS ties it to the Clerk user via the JWT sub claim;
	//    status defaults to "pending".
	const { data, error } = await supabase
		.from("listings")
		.insert({
			landlord_id: userId,
			neighborhood_id: neighborhoodId,
			title: parsed.data.title,
			price_mad: parsed.data.price,
			rooms: parsed.data.rooms,
			has_caution: parsed.data.hasCaution,
			caution_amount: parsed.data.cautionAmount ? parsed.data.cautionAmount : null
		})
		.select()
		.single();

	if (error || !data) {
		console.error("createListing failed:", error?.message)
		return null
	}

	return {
		id: data.id,
		title: data.title,
		type: parsed.data.type,
		price: data.price_mad,
		rooms: data.rooms,
		neighborhood: parsed.data.neighborhood,
		city: parsed.data.city,
		description: "",
		landlordName: "Landlord",
		hasCaution: data.has_caution,
		cautionAmount: data.caution_amount,
		bookmarked: false,
	} satisfies Listing
}
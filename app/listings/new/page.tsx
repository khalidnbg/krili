import ListingForm from "@/components/ListingForm"

const NewListing = () => {
	return (
		<main className="min-lg:w-1/3 min-md:w-2/3 items-center justify-center">

			<article className="w-full gap-4 flex flex-col">
				<h1>Listing Builder</h1>

				<ListingForm />
			</article>

		</main>
	)
}

export default NewListing
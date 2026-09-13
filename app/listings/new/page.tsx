import ListingForm from "@/components/ListingForm"

const NewListing = () => {
	return (
		<main className="lg:w-1/3 md:w-2/3 items-center justify-center">
			<article className="w-full gap-4 flex flex-col">
				<h1>Publish a new listing</h1>
				<p className="text-muted-foreground">
					Tell tenants about your property — new listings go live after a quick review.
				</p>
				<ListingForm />
			</article>
		</main>
	)
}

export default NewListing

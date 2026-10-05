import ListingForm from "@/components/ListingForm"

const NewListing = () => {
	return (
		<main className="px-4 py-10 md:px-8 md:py-14">
			<article className="mx-auto flex w-full flex-col gap-4">
				<h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
					Publish a new listing
				</h1>
				<p className="text-neutral-500">
					Tell tenants about your property — new listings go live after a quick review.
				</p>
				<ListingForm />
			</article>
		</main>
	)
}

export default NewListing
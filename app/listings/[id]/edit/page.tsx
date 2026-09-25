import EditListingForm from "@/components/EditListingForm"
import NotFound from "@/components/NotFound"
import { getManagedListing } from "@/lib/actions/listing.action"

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params
	const managed = await getManagedListing(id)

	if (!managed) {
		return (
			<main>
				<NotFound title="Listing not found" message="You can only edit your own listings." />
			</main>
		)
	}

	return (
		<main className="lg:w-1/3 md:w-2/3 items-center justify-center">
			<article className="w-full gap-4 flex flex-col">
				<h1>Edit listing</h1>
				<EditListingForm managed={managed} />
			</article>
		</main>
	)
}

export default Page
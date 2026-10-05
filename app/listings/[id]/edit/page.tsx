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
		<main className="px-4 py-10 md:px-8 md:py-14">
			<article className="mx-auto flex w-full flex-col gap-4">
				<h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
					Edit listing
				</h1>
				<EditListingForm managed={managed} />
			</article>
		</main>
	)
}

export default Page
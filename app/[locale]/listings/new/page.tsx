import ListingForm from "@/components/ListingForm"
import { getTranslations } from "next-intl/server"

const NewListing = async () => {
	const t = await getTranslations("listings.newListing")
	return (
		<main className="px-4 py-10 md:px-8 md:py-14">
			<article className="mx-auto flex w-full flex-col gap-4">
				<h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
					{t("title")}
				</h1>
				<p className="text-neutral-500">
					{t("subtitle")}
				</p>
				<ListingForm />
			</article>
		</main>
	)
}

export default NewListing
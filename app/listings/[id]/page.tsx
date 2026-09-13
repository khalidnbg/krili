import Link from "next/link"
import NotFound from "@/components/NotFound"
import PropertyIcon from "@/components/PropertyIcon"
import { allListings } from "@/constants"
import { getPropertyColor } from "@/lib/utils"

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params
	const listing = allListings.find((l) => l.id === id)

	if (!listing) {
		return (
			<main>
				<NotFound />
			</main>
		)
	}

	const initial = listing.landlordName.charAt(0)

	return (
		<main>
			<Link href="/" className="btn-signin w-fit">
				← All listings
			</Link>

			<section className="w-full">
				<article className="rounded-4xl border border-black overflow-hidden">
					<div
						className="h-64 flex items-center justify-center max-md:h-40"
						style={{ backgroundColor: getPropertyColor(listing.type) }}
					>
						<PropertyIcon type={listing.type} className="size-24 max-md:size-16" />
					</div>

					<div className="flex flex-col gap-5 p-8">
						<div className="flex justify-between items-start gap-4 flex-wrap">
							<div className="flex flex-col gap-2">
								<h1>{listing.title}</h1>
								<p className="text-muted-foreground">
									{listing.neighborhood} · {listing.city}
								</p>
							</div>
							<div className="property-badge h-fit capitalize">{listing.type}</div>
						</div>

						<div className="flex gap-4 flex-wrap items-center text-2xl font-bold">
							<p>
								{listing.price.toLocaleString()}
								<span className="text-sm text-muted-foreground font-normal"> MAD/month</span>
							</p>
							<span className="font-normal text-muted-foreground">·</span>
							<p>
								{listing.rooms} room{listing.rooms > 1 ? "s" : ""}
							</p>
						</div>

						<p className="text-lg max-w-2xl">{listing.description}</p>

						<p className="text-sm text-muted-foreground">
							{listing.hasCaution
								? `A security deposit of ${(listing.cautionAmount ?? 0).toLocaleString()} MAD is required before moving in.`
								: "No security deposit required."}
						</p>

						<div className="rounded-4xl border border-black p-6 flex justify-between items-center gap-4 flex-wrap">
							<div className="flex items-center gap-3">
								<div className="size-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl">
									{initial}
								</div>
								<div className="flex flex-col">
									<p className="font-bold">{listing.landlordName}</p>
									<p className="text-sm text-muted-foreground">Verified landlord</p>
								</div>
							</div>
							<button className="btn-primary">Contact landlord</button>
						</div>
					</div>
				</article>
			</section>
		</main>
	)
}

export default Page

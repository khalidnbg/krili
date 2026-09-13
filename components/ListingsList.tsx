import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { cn, getPropertyColor, getPropertyIcon } from "@/lib/utils"

interface ListingsListProps {
	title: string
	listings: Listing[]
	classNames?: string
}

const ListingsList = ({ title, listings, classNames }: ListingsListProps) => {
	return (
		<article className={cn("listing-list", classNames)}>
			<h2 className="font-bold text-3xl">{title}</h2>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="text-lg w-2/3">Property</TableHead>
						<TableHead className="text-lg">Type</TableHead>
						<TableHead className="text-lg text-right">Price</TableHead>
						<TableHead className="text-lg text-right">Rooms</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{listings?.map((listing) => {
						const Icon = getPropertyIcon(listing.type)
						return (
							<TableRow key={listing.id}>
								<TableCell>
									<Link href={`/listing/${listing.id}`}>
										<div className="flex items-center gap-2">
											<div
												className="size-[72px] flex items-center justify-center rounded-lg max-md:hidden"
												style={{ backgroundColor: getPropertyColor(listing.type) }}
											>
												<Icon className="size-8" />
											</div>
											<div className="flex flex-col gap-2">
												<p className="font-bold text-2xl">
													{listing.title}
												</p>
												<p className="text-lg">
													{listing.neighborhood} · {listing.city}
												</p>
											</div>
										</div>
									</Link>
								</TableCell>

								<TableCell>
									<div className="property-badge w-fit max-md:hidden">{listing.type}</div>
								</TableCell>

								<TableCell>
									<div className="flex items-center gap-2 w-full justify-end">
										<p className="text-2xl">
											{listing.price.toLocaleString()} <span className="max-md:hidden"> MAD</span>
										</p>
									</div>
								</TableCell>

								<TableCell>
									<div className="flex items-center gap-2 w-full justify-end">
										<p className="text-2xl">
											{listing.rooms} <span className="max-md:hidden">rooms</span>
										</p>
									</div>
								</TableCell>
							</TableRow>
						)
					})}
				</TableBody>
			</Table>

		</article>
	)
}

export default ListingsList

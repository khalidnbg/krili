import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import PropertyIcon from "@/components/PropertyIcon"
import { cn, getPropertyColor } from "@/lib/utils"

interface ListingsListProps {
	title: string
	listings: Listing[]
	classNames?: string
}

const ListingsList = ({ title, listings, classNames }: ListingsListProps) => {
	return (
		<article className={cn("flex flex-col gap-5", classNames)}>
			<h2 className="text-2xl font-bold text-neutral-900">{title}</h2>

			<div className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
				<Table>
					<TableHeader>
						<TableRow className="border-neutral-200/80 hover:bg-transparent">
							<TableHead className="w-2/3 text-sm font-medium text-neutral-500">Property</TableHead>
							<TableHead className="text-sm font-medium text-neutral-500">Type</TableHead>
							<TableHead className="text-right text-sm font-medium text-neutral-500">Price</TableHead>
							<TableHead className="text-right text-sm font-medium text-neutral-500">Rooms</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{listings?.map((listing) => (
							<TableRow
								key={listing.id}
								className="border-neutral-100 transition-colors hover:bg-neutral-50"
							>
								<TableCell>
									<Link href={`/listings/${listing.id}`}>
										<div className="flex items-center gap-3 py-1">
											<div
												className="flex size-14 shrink-0 items-center justify-center rounded-xl max-md:hidden"
												style={{ backgroundColor: getPropertyColor(listing.type) }}
											>
												<PropertyIcon type={listing.type} className="size-6" />
											</div>
											<div className="flex flex-col gap-1">
												<p className="text-base font-bold text-neutral-900">{listing.title}</p>
												<p className="text-sm text-neutral-500">
													{listing.neighborhood} · {listing.city}
												</p>
											</div>
										</div>
									</Link>
								</TableCell>

								<TableCell>
									<div className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-700 max-md:hidden">
										{listing.type}
									</div>
								</TableCell>

								<TableCell className="text-right">
									<p className="font-medium text-neutral-900">
										{listing.price.toLocaleString()} <span className="text-neutral-400 max-md:hidden">MAD</span>
									</p>
								</TableCell>

								<TableCell className="text-right">
									<p className="font-medium text-neutral-900">
										{listing.rooms} <span className="text-neutral-400 max-md:hidden">rooms</span>
									</p>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</article>
	)
}

export default ListingsList
export default function SimilarListingsSkeleton() {
	return (
		<section aria-labelledby="similar-heading-skeleton" className="flex flex-col gap-6">
			<div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="flex flex-col gap-4 rounded-3xl border border-neutral-200/80 bg-white p-4">
						<div className="h-[200px] w-full animate-pulse rounded-2xl bg-neutral-200 sm:h-[230px] md:h-[250px]" />
						<div className="flex flex-col gap-2 px-1">
							<div className="h-6 w-3/4 animate-pulse rounded bg-neutral-200" />
							<div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
							<div className="h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
							<div className="h-6 w-1/2 animate-pulse rounded bg-neutral-200 pt-1" />
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
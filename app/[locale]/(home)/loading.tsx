const SkeletonCard = () => (
	<div className="flex flex-col gap-4 rounded-3xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
		<div className="h-[200px] w-full animate-pulse rounded-2xl bg-neutral-100 sm:h-[230px] md:h-[250px]" />
		<div className="flex flex-col gap-2 px-1">
			<div className="h-5 w-3/4 animate-pulse rounded-full bg-neutral-100" />
			<div className="h-4 w-1/2 animate-pulse rounded-full bg-neutral-100" />
			<div className="h-4 w-1/3 animate-pulse rounded-full bg-neutral-100" />
			<div className="mt-1 h-5 w-2/5 animate-pulse rounded-full bg-neutral-100" />
		</div>
		<div className="h-10 w-full animate-pulse rounded-full bg-neutral-100" />
	</div>
)

const Loading = () => {
	return (
		<main className="flex flex-col gap-16 px-4 py-10 md:px-8 md:py-14">
			<section className="flex flex-col gap-3">
				<div className="h-10 w-72 animate-pulse rounded-full bg-neutral-100 md:h-12 md:w-96" />
				<div className="h-5 w-80 animate-pulse rounded-full bg-neutral-100" />
			</section>

			<section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<SkeletonCard key={i} />
				))}
			</section>
		</main>
	)
}

export default Loading

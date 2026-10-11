export default function QueueLoading() {
	return (
		<main className="flex flex-col gap-6 w-full">
			<div className="h-8 w-full animate-pulse rounded-full bg-neutral-200" />
			<div className="h-6 w-full animate-pulse rounded-full bg-neutral-200" />
			<div className="flex flex-col gap-4 w-full">
				{Array.from({ length: 1 }).map((_, i) => (
					<div key={i} className="h-32 animate-pulse rounded-4xl bg-neutral-200" />
				))}
			</div>
		</main>
	)
}

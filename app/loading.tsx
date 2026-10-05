const Loading = () => {
	return (
		<main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-20">
			<div className="relative size-14">
				<span className="absolute inset-0 rounded-full border-2 border-neutral-200" />
				<span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#FE5933]" />
			</div>
			<p className="text-2xl font-medium text-neutral-400">Loading ...</p>
		</main>
	)
}

export default Loading
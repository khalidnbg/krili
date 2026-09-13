import Link from "next/link"
import { Search } from "lucide-react"

interface NotFoundProps {
	title?: string
	message?: string
}

const NotFound = ({
	title = "Listing not found",
	message = "This listing doesn't exist anymore or the link may be broken.",
}: NotFoundProps) => {
	return (
		<section className="flex flex-col items-center justify-center gap-6 w-full rounded-4xl border border-black px-10 py-16 text-center">
			<div className="size-16 flex items-center justify-center rounded-full bg-black text-white">
				<Search className="size-8" aria-hidden="true" />
			</div>
			<h1>{title}</h1>
			<p className="text-lg text-muted-foreground">{message}</p>
			<Link href="/" className="btn-primary w-fit">
				Browse all listings
			</Link>
		</section>
	)
}

export default NotFound
import Image from "next/image"
import Link from "next/link"

interface ListingCardProps {
	id: string
	name: string
	topic: string
	color: string
	subject: string
	duration?: string
}

const ListingCard = ({ id, name, topic, color, subject, duration }: ListingCardProps) => {
	return (
		<article className="listing-card" style={{ backgroundColor: color }}>
			<div className="flex justify-between items-center">
				<div className="subject-badge">{subject}</div>
				<button className="listing-bookmark" >
					<Image
						// src={
						// 	bookmarked ? "/icons/bookmark-filled.svg" : "/icons/bookmark.svg"
						// }
						src="/icons/bookmark.svg"
						alt="bookmark"
						width={12.5}
						height={15}
					/>
				</button>
			</div>

			<h2 className="text-2xl font-bold">{name}</h2>
			<p className="text-sm">{topic}</p>
			<div className="flex items-center gap-2">
				<Image
					src="/icons/clock.svg"
					alt="duration"
					width={13.5}
					height={13.5}
				/>
				<p className="text-sm">{duration} minutes</p>
			</div>

			<Link href={`/listings/${id}`} className="w-full">
				<button className="btn-primary w-full justify-center">
					Launch Lesson
				</button>
			</Link>
		</article>
	);
}

export default ListingCard
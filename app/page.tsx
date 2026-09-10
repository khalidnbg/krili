import CTA from "@/components/CTA"
import ListingCard from "@/components/ListingCard"
import ListingsList from "@/components/ListingsList"
import { recentSessions } from "@/constants"

const page = () => {
	return (
		<main>
			<h1>Popular Listings</h1>

			<section className="home-section">
				<ListingCard id="1" name="Listing 1" topic="Technology" color="#ffda6a" subject="Technology" duration='10s' />
				<ListingCard id="2" name="Listing 2" topic="Design" color="#e5d0ff" subject="Design" duration='15s' />
				<ListingCard id="3" name="Listing 3" topic="Marketing" color="#eff000" subject="Marketing" duration='20s' />
			</section>

			<section className="home-section">
				<ListingsList title="Recent Listings completed" listings={recentSessions} classNames="w-2/3 max-lg:w-full" />
				<CTA />
			</section>

		</main>
	)
}

export default page
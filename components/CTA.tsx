import Image from "next/image"
import Link from "next/link"

const Cta = () => {
	return (
		<section className="cta-section">
			<div className="cta-badge">Become a host.</div>
			<h2 className="text-3xl font-bold">List your property on Krili</h2>
			<p>Reach thousands of tenants across Morocco — post your house, studio or room any time, free.</p>
			<Image src="cta.svg" alt="Rent your property" width={362} height={232} />
			<button className="btn-primary">
				<Image src="/icons/plus.svg" alt="plus" width={12} height={12} />
				<Link href="/listings/new">
					<p>Post a listing</p>
				</Link>
			</button>
		</section>
	)
}
export default Cta

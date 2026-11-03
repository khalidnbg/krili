import { SignIn } from '@clerk/nextjs'

export const metadata = {
	robots: {
		index: false,
		follow: false,
	},
}

export default function Page() {
	return <main className="flex items-center justify-center">
		<SignIn />
	</main>
}
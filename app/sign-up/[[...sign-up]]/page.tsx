import { SignUp } from "@clerk/nextjs"

const page = () => {
	return (
		<main className="flex items-center justify-center min-h-screen">
			<SignUp />
		</main>)
}

export default page
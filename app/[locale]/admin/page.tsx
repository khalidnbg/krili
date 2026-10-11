import { redirect } from "next/navigation"
// or: import { redirect } from "@/i18n/navigation" (needs a locale argument)

const Page = async ({ params }: { params: Promise<{ locale: string }> }) => {
	const { locale } = await params
	redirect(`/${locale}/admin/queue`)
}

export default Page
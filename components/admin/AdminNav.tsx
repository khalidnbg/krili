"use client"

import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/routing" // use your next-intl navigation helpers (or next/link + next/navigation if you handle locale differently)

const tabs = [
	{ href: "/admin/queue", labelKey: "moderationQueue" },
	{ href: "/admin/reports", labelKey: "reports" },
	{ href: "/admin/users", labelKey: "users" },
] as const

const AdminNav = () => {
	const t = useTranslations("admin")
	const pathname = usePathname()

	return (
		<nav className="flex flex-wrap gap-2">
			{tabs.map((tab) => {
				const active = pathname.startsWith(tab.href)
				return (
					<Link
						key={tab.href}
						href={tab.href}
						className={
							active
								? "rounded-full border border-black bg-black px-4 py-2 text-sm font-semibold text-white"
								: "rounded-full border border-black px-4 py-2 text-sm font-semibold hover:bg-muted"
						}
					>
						{t(tab.labelKey)}
					</Link>
				)
			})}
		</nav>
	)
}

export default AdminNav
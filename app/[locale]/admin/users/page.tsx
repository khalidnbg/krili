import Pagination from "@/components/Pagination"
import UsersFilter from "@/components/admin/UsersFilter"
import SuspendUserButton from "@/components/admin/SuspendUserButton"
import { getUsers } from "@/lib/actions/admin-users.action"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import UsersLoading from "./loading"

const pageSize = 10

type SearchParams = Promise<Record<string, string | string[] | undefined>>

async function UsersContent({ searchParams }: { searchParams: SearchParams }) {
	const t = await getTranslations("admin")
	const sp = await searchParams
	const str = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : "")

	const currentPage = Math.max(1, Number(str("page")) || 1)
	const search = str("search")
	const role = str("role")

	const usersResult = await getUsers({ page: currentPage, pageSize, search, role })
	const users = usersResult?.rows ?? []
	const totalPages = Math.max(1, Math.ceil((usersResult?.total ?? 0) / pageSize))

	// Keep filters when paging (everything except the page key)
	const preservedParams: Record<string, string> = {}
	for (const [key, value] of Object.entries(sp)) {
		if (key === "page") continue
		if (typeof value === "string") preservedParams[key] = value
	}

	return (
		<section className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1>{t("users")}</h1>
				<UsersFilter search={search} role={role} />
			</div>

			{users.length === 0 ? (
				<p className="text-muted-foreground">{t("noUsers")}</p>
			) : (
				<div className="overflow-x-auto rounded-4xl border border-black">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-black text-left">
								<th className="p-3">{t("name")}</th>
								<th className="p-3">{t("email")}</th>
								<th className="p-3">{t("phone")}</th>
								<th className="p-3">{t("role")}</th>
								<th className="p-3">{t("verified")}</th>
								<th className="p-3">{t("listingsCount")}</th>
								<th className="p-3">{t("joined")}</th>
								<th className="p-3">{t("actions")}</th>
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr key={user.id} className="border-b border-border last:border-0">
									<td className="p-3 font-semibold">
										{user.firstName || user.lastName
											? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
											: user.id.slice(0, 8)}
										{user.suspended && (
											<span className="ml-2 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
												{t("suspended")}
											</span>
										)}
									</td>
									<td className="p-3">{user.email ?? "—"}</td>
									<td className="p-3">{user.phone ?? "—"}</td>
									<td className="p-3 capitalize">{user.role}</td>
									<td className="p-3">
										<span className={user.phoneVerified ? "text-green-700" : "opacity-40"}>P</span>
										{" / "}
										<span className={user.idVerified ? "text-green-700" : "opacity-40"}>ID</span>
									</td>
									<td className="p-3">{user.listingCount}</td>
									<td className="p-3">{new Date(user.createdAt).toLocaleDateString("en-GB")}</td>
									<td className="p-3">
										<SuspendUserButton userId={user.id} suspended={user.suspended} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				basePath="/admin/users"
				pageParam="page"
				searchParams={preservedParams}
			/>
		</section>
	)
}

const Page = async ({ searchParams }: { searchParams: SearchParams }) => {
	return (
		<Suspense fallback={<UsersLoading />}>
			<UsersContent searchParams={searchParams} />
		</Suspense>
	)
}

export default Page
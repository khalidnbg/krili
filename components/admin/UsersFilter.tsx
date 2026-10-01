"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "../ui/button"

interface UsersFilterProps {
	search?: string
	role?: string
}

const UsersFilter = ({ search = "", role = "" }: UsersFilterProps) => {
	const router = useRouter()
	const [value, setValue] = useState(search)
	const [userRole, setUserRole] = useState(role)

	const apply = () => {
		const params = new URLSearchParams()
		if (value.trim()) params.set("usersSearch", value.trim())
		if (userRole) params.set("usersRole", userRole)
		const qs = params.toString()
		router.push(`/admin${qs ? `?${qs}` : ""}`)
	}

	return (
		<div className="flex flex-wrap items-end gap-3">
			<label className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">Search</span>
				<Input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder="Name or email"
					className="w-56"
				/>
			</label>
			<label className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">Role</span>
				<Select value={userRole} onValueChange={(v) => setUserRole(v ?? "")}>
					<SelectTrigger className="w-40 capitalize">
						<SelectValue placeholder="All roles" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="landlord">Landlord</SelectItem>
						<SelectItem value="tenant">Tenant</SelectItem>
						<SelectItem value="both">Both</SelectItem>
					</SelectContent>
				</Select>
			</label>
			<Button type="button" onClick={apply}>Apply</Button>
			<Button
				type="button"
				variant="ghost"
				onClick={() => {
					setValue("")
					setUserRole("")
					router.push("/admin")
				}}
			>
				Clear
			</Button>
		</div>
	)
}

export default UsersFilter
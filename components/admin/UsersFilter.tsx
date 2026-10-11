"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "../ui/button"

interface UsersFilterProps {
	search?: string
	role?: string
}

const UsersFilter = ({ search = "", role = "" }: UsersFilterProps) => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [value, setValue] = useState(search)
	const [userRole, setUserRole] = useState(role)

	// Debounced search effect
	useEffect(() => {
		const timer = setTimeout(() => {
			const params = new URLSearchParams(searchParams.toString())
			if (value.trim()) params.set("search", value.trim())
			else params.delete("search")
			if (userRole) params.set("role", userRole)
			else params.delete("role")
			const qs = params.toString()
			router.push(`/admin/users${qs ? `?${qs}` : ""}`)
		}, 300) // 300ms debounce

		return () => clearTimeout(timer)
	}, [value, userRole, searchParams, router])

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
			<Button
				type="button"
				variant="ghost"
				onClick={() => {
					setValue("")
					setUserRole("")
					router.push("/admin/users")
				}}
			>
				Clear
			</Button>
		</div>
	)
}

export default UsersFilter
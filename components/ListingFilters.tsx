"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { cities, propertyTypes } from "@/constants"

interface ListingFiltersProps {
	searchParams?: Record<string, string | undefined>
	resultCount?: number
}

const ListingFilters = ({ searchParams, resultCount }: ListingFiltersProps) => {
	const router = useRouter()

	const [city, setCity] = useState(searchParams?.city ?? "")
	const [type, setType] = useState(searchParams?.type ?? "")
	const [minPrice, setMinPrice] = useState(searchParams?.minPrice ?? "")
	const [maxPrice, setMaxPrice] = useState(searchParams?.maxPrice ?? "")
	const [rooms, setRooms] = useState(searchParams?.rooms ?? "")

	const apply = (next: { city?: string; type?: string; rooms?: string } = {}) => {
		const params = new URLSearchParams()
		const add = (key: string, value: string | undefined) => {
			if (value) params.set(key, value)
		}
		add("city", next.city ?? city)
		add("type", next.type ?? type)
		add("rooms", next.rooms ?? rooms)
		add("minPrice", minPrice)
		add("maxPrice", maxPrice)

		const qs = params.toString()
		router.push(qs ? `/listings?${qs}` : "/listings")
	}

	const clear = () => {
		setCity("")
		setType("")
		setRooms("")
		setMinPrice("")
		setMaxPrice("")
		router.push("/listings")
	}

	const toValue = (value: string | null) => value ?? ""

	return (
		<section className="flex flex-wrap items-end gap-4 rounded-4xl border border-black p-5">
			<label className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">City</span>
				<Select
					value={city}
					onValueChange={(value) => {
						const next = toValue(value)
						setCity(next)
						apply({ city: next })
					}}

				>
					<SelectTrigger className="w-full capitalize">
						<SelectValue placeholder="All cities" />
					</SelectTrigger>
					<SelectContent>
						{cities.map((option) => (
							<SelectItem value={option} key={option} className="capitalize">
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</label>

			<label className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">Type</span>
				<Select
					value={type}
					onValueChange={(value) => {
						const next = toValue(value)
						setType(next)
						apply({ type: next })
					}}

				>
					<SelectTrigger className="w-full capitalize">
						<SelectValue placeholder="All types" />
					</SelectTrigger>
					<SelectContent>
						{propertyTypes.map((option) => (
							<SelectItem value={option} key={option} className="capitalize">
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</label>

			<label className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">Rooms</span>
				<Select
					value={rooms}
					onValueChange={(value) => {
						const next = toValue(value)
						setRooms(next)
						apply({ rooms: next })
					}}

				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Any" />
					</SelectTrigger>
					<SelectContent>
						{["1", "2", "3", "4"].map((option) => (
							<SelectItem value={option} key={option}>
								{option === "1" ? "1+ room" : `${option}+ rooms`}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</label>

			<label className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">Price (MAD)</span>
				<div className="flex items-center gap-2">
					<Input
						type="number"
						min={0}
						placeholder="Min"
						value={minPrice}
						onChange={(e) => setMinPrice(e.target.value)}
						className="w-24"
					/>
					<span className="text-muted-foreground">—</span>
					<Input
						type="number"
						min={0}
						placeholder="Max"
						value={maxPrice}
						onChange={(e) => setMaxPrice(e.target.value)}
						className="w-24"
					/>
					<Button type="button" onClick={() => apply()}>
						Apply
					</Button>
				</div>
			</label>

			<Button type="button" variant="ghost" onClick={clear}>
				Clear filters
			</Button>

			<p className="text-sm font-semibold text-muted-foreground">
				{resultCount} listing{resultCount === 1 ? "" : "s"} found
			</p>
		</section>
	)
}

export default ListingFilters

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
import { useTranslations } from "next-intl"

interface ListingFiltersProps {
	searchParams?: Record<string, string | undefined>
	resultCount?: number
}

const ListingFilters = ({ searchParams, resultCount }: ListingFiltersProps) => {
	const router = useRouter()
	const t = useTranslations("filters")

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
		<section className="flex flex-wrap items-end gap-4 rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
			<label className="flex flex-col gap-1.5">
				<span className="text-sm font-medium text-neutral-700">{t("city")}</span>
				<Select
					value={city}
					onValueChange={(value) => {
						const next = toValue(value)
						setCity(next)
						apply({ city: next })
					}}
				>
					<SelectTrigger className="w-full min-w-[9rem] rounded-full border-neutral-200 capitalize">
						<SelectValue placeholder={t("allCities")} />
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
				<span className="text-sm font-medium text-neutral-700">{t("type")}</span>
				<Select
					value={type}
					onValueChange={(value) => {
						const next = toValue(value)
						setType(next)
						apply({ type: next })
					}}
				>
					<SelectTrigger className="w-full min-w-[9rem] rounded-full border-neutral-200 capitalize">
						<SelectValue placeholder={t("allTypes")} />
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
				<span className="text-sm font-medium text-neutral-700">{t("rooms")}</span>
				<Select
					value={rooms}
					onValueChange={(value) => {
						const next = toValue(value)
						setRooms(next)
						apply({ rooms: next })
					}}
				>
					<SelectTrigger className="w-full min-w-[8rem] rounded-full border-neutral-200">
						<SelectValue placeholder={t("any")} />
					</SelectTrigger>
					<SelectContent>
						{["1", "2", "3", "4"].map((option) => (
							<SelectItem value={option} key={option}>
								{option === "1" ? t("onePlusRoom") : t("roomsPlus", { count: option })}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</label>

			<label className="flex flex-col gap-1.5">
				<span className="text-sm font-medium text-neutral-700">{t("price")}</span>
				<div className="flex items-center gap-2">
					<Input
						type="number"
						min={0}
						placeholder={t("min")}
						value={minPrice}
						onChange={(e) => setMinPrice(e.target.value)}
						className="w-24 rounded-full border-neutral-200"
					/>
					<span className="text-neutral-400">—</span>
					<Input
						type="number"
						min={0}
						placeholder={t("max")}
						value={maxPrice}
						onChange={(e) => setMaxPrice(e.target.value)}
						className="w-24 rounded-full border-neutral-200"
					/>
					<Button
						type="button"
						onClick={() => apply()}
						className="rounded-full bg-neutral-900 text-white hover:bg-neutral-800"
					>
						{t("apply")}
					</Button>
				</div>
			</label>

			<Button
				type="button"
				variant="ghost"
				onClick={clear}
				className="rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
			>
				{t("clearFilters")}
			</Button>

			<p className="ml-auto text-sm font-semibold text-[#FE5933]">
				{t("listingsFound", { count: resultCount ?? 0 })}
			</p>
		</section>
	)
}

export default ListingFilters
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
import { Amenity, amenityOptions, cities, propertyTypes } from "@/constants"
import { useTranslations } from "next-intl"
import AmenitySelector from "./AmenitySelector"

interface ListingFiltersProps {
	searchParams?: Record<string, string | undefined>
	resultCount?: number,
}

const ListingFilters = ({ searchParams, resultCount }: ListingFiltersProps) => {
	const router = useRouter()
	const t = useTranslations("filters")

	const [city, setCity] = useState(searchParams?.city ?? "")
	const [type, setType] = useState(searchParams?.type ?? "")
	const [minPrice, setMinPrice] = useState(searchParams?.minPrice ?? "")
	const [maxPrice, setMaxPrice] = useState(searchParams?.maxPrice ?? "")
	const [rooms, setRooms] = useState(searchParams?.rooms ?? "")
	const [amenities, setAmenities] = useState<Amenity[]>(
		searchParams?.amenities
			? searchParams.amenities.split(",").filter((a): a is Amenity => amenityOptions.includes(a as Amenity))
			: []
	)

	const apply = (next: { city?: string; type?: string; rooms?: string, amenities?: Amenity[] } = {}) => {
		const params = new URLSearchParams()
		const add = (key: string, value: string | undefined) => {
			if (value) params.set(key, value)
		}
		add("city", next.city ?? city)
		add("type", next.type ?? type)
		add("rooms", next.rooms ?? rooms)
		add("minPrice", minPrice)
		add("maxPrice", maxPrice)
		if ((next.amenities ?? amenities).length > 0) {
			params.set("amenities", (next.amenities ?? amenities).join(","))
		}

		const qs = params.toString()
		router.push(qs ? `/listings?${qs}` : "/listings")
	}

	const clear = () => {
		setCity("")
		setType("")
		setRooms("")
		setMinPrice("")
		setMaxPrice("")
		setAmenities([])
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

			{amenities.length > 0 && (
				<div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
					<span>{t("amenities")}</span>
					<span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-[#FE5933]">
						{amenities.length}
					</span>
				</div>
			)}

			<div className="w-full border-t border-neutral-200 pt-4">
				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium text-neutral-700">{t("amenities")}</span>
					<AmenitySelector
						value={amenities}
						onChange={(next) => {
							const validAmenities = next.filter(
								(amenity): amenity is Amenity => amenityOptions.includes(amenity as Amenity)
							)
							setAmenities(validAmenities)
							apply({ amenities: validAmenities })
						}}
					/>
				</div>
			</div>

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
"use client"

import { amenityOptions } from "@/constants"
import { Check } from "lucide-react"
import { useTranslations } from "next-intl"

interface AmenitySelectorProps {
	value?: string[]
	onChange: (value: string[]) => void
}

const AmenitySelector = ({ value = [], onChange }: AmenitySelectorProps) => {
	const t = useTranslations("amenity")

	const toggle = (key: string) =>
		onChange(value.includes(key) ? value.filter((item) => item !== key) : [...value, key])

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{amenityOptions.map((key) => {
				const selected = value.includes(key)
				return (
					<button
						type="button"
						key={key}
						onClick={() => toggle(key)}
						aria-pressed={selected}
						className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-start text-sm font-medium transition-colors ${selected
								? "border-[#FE5933] bg-[#FE5933]/5 text-neutral-900"
								: "border-neutral-200/80 bg-neutral-50/60 text-neutral-700 hover:border-[#FE5933]/40 hover:bg-[#FE5933]/5"
							}`}
					>
						<span
							className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${selected ? "bg-[#FE5933] text-white" : "bg-neutral-200/70 text-transparent"
								}`}
						>
							<Check className="size-4" strokeWidth={3} />
						</span>
						<span className="leading-tight">{t(key)}</span>
					</button>
				)
			})}
		</div>
	)
}

export default AmenitySelector
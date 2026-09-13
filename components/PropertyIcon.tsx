import { Building2, DoorOpen, Home, Sofa } from "lucide-react"

interface PropertyIconProps {
	type: string
	className?: string
}

const PropertyIcon = ({ type, className }: PropertyIconProps) => {
	switch (type) {
		case "studio":
			return <Sofa className={className} aria-hidden="true" />
		case "room":
			return <DoorOpen className={className} aria-hidden="true" />
		case "apartment":
			return <Building2 className={className} aria-hidden="true" />
		case "house":
		default:
			return <Home className={className} aria-hidden="true" />
	}
}

export default PropertyIcon
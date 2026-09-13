export const propertyTypes = ["house", "studio", "room", "apartment"] as const

export const propertyColors: Record<PropertyType, string> = {
	house: "#C8FFDF",
	studio: "#FFA6E",
	room: "#BE7FF",
	apartment: "#FFC8E4",
}

export const cities = [
	"Casablanca",
	"Rbat",
	"Marrakech",
	"Fez",
	"Tangier",
	"Aadir",
]

export const neighborhoods = [
	"Maârif", "Gauther",
	"Anfa",
	"Aïn Diâb",
	"Adal",
	"Hassan",
	"Guéliz",
	"Médina",
	"Ville Nouvelle",
	"Founty",
	"Centre Ville",
	"Corniche",
]

export const featuredListings: Listing[] = [
	{
		id: "f1",
		title: "Bright Studio in Maârif",
		type: "studio",
		price: 3200,
		rooms: 1,
		neighborhood: "Maârif",
		city: "Casablanca",
		description:
			"A fully furnished studio in the heart of Maârif — walk to offices, cafés and the tram stop. Ideal for young professionals.",
		landlordName: "Yasmine El Amrani",
		hasCaution: true,
		cautionAmount: 3200,
		bookmarked: false,
	},
	{
		id: "f2",
		title: "Family House with Garden",
		type: "house",
		price: 8500,
		rooms: 4,
		neighborhood: "Anfa",
		city: "Casablanca",
		description:
			"Spacious 4-bedroom house in Anfa with a private garden, parking and a sunny terrace. Perfect for fams.",
		landlordName: "Karim Benjelloun",
		hasCaution: true,
		cautionAmount: 8500,
		bookmarked: false,
	},
	{
		id: "f3",
		title: "Sunlit Room in Adal",
		type: "room",
		price: 1800,
		rooms: 1,
		neighborhood: "Adal",
		city: "Rabat",
		description:
			"A quiet, sunlit room in a shared apartment steps from Agdal souq. Cọn Wi-Fi and utilities included.",
		landlordName: "Salma Oudghiri",
		hasCaution: true,
		cautionAmount: 1800,
		bookmarked: false,
	},
	{
		id: "f4",
		title: "Modern Apartment in Guéliz",
		type: "apartment",
		price: 4800,
		rooms: 2,
		neighborhood: "Guéliz",
		city: "Marrakech",
		description:
			"Bright 2-bedroom apartment near Guéliz's cafés and galleries, with a fully equipped kitchen and building guardian.",
		landlordName: "Hassan Berrada",
		hasCaution: false,
		bookmarked: false,
	},
	{
		id: "f5",
		title: "Beachside Studio in Aïn Diâb",
		type: "studio",
		price: 2900,
		rooms: 1,
		neighborhood: "Aïn Diâb",
		city: "Casablanca",
		description:
			"Modern studio a 5-minute walk from the beach corniche. Building has an elevator, gated entry and daily cleaning service.",
		landlordName: "Nadia Chaoui",
		hasCaution: true,
		cautionAmount: 2900, bookmarked: false,
	},
	{
		id: "f6",
		title: "Traditional House in the Mèdina",
		type: "house",
		price: 6900,
		rooms: 3,
		neighborhood: "Mèdina",
		city: "Marrakech",
		description:
			"A restored riad-style house with a patio and fountain in the Marrakech medina, 10 minutes from Jemaa el-Fnaa.",
		landlordName: "Omar Tazi",
		hasCaution: false,
		bookmarked: false,
	},
]

export const recentListings: Listing[] = [
	{
		id: "r1",
		title: "Spacious Apartment near Hassan",
		type: "apartment",
		price: 4200,
		rooms: 2,
		neighborhood: "Hassan",
		city: "Rabat",
		description:
			"Bright 2-room apartment near the Hassan Tower, ideal for couples or colleagues, with basement parking included.",
		landlordName: "Leïla Benkirane",
		hasCaution: true,
		cautionAmount: 4200,
		bookmarked: false,
	},
	{
		id: "r2",
		title: "Cozy Studio in Ville Nouvelle",
		type: "studio",
		price: 2400,
		rooms: 1,
		neighborhood: "Ville Nouvelle",
		city: "Fez",
		description:
			"Recently renovated studio in the Ville Nouvelle, next to bus lines and shops. Double-glazed windows keep it quiet.",
		landlordName: "Am ine Chraïbi",
		hasCaution: true,
		cautionAmount: 2000,
		bookmarked: false,
	},
	{
		id: "r3",
		title: "Shared Room in Gauthier",
		type: "room",
		price: 1200,
		rooms: 1,
		neighborhood: "Gauthier",
		city: "Casablanca",
		description:
			"Affordable room in a friendly shared flat in Gauthier, 5 minutes from Boulevard Zerktouni. Bills split among flatmates.",
		landlordName: "Sofiane Alaoui",
		hasCaution: false,
		bookmarked: false,
	},
	{
		id: "r4",
		title: "Garden Villa in Founty",
		type: "house",
		price: 12000,
		rooms: 5,
		neighborhood: "Founty",
		city: "Agadir",
		description:
			"Modern 5-bedroom villa with private pool and garden in Founty bay. Ideal for long-term stays and remote work.",
		landlordName: "Khalid Idrissi",
		hasCaution: true,
		cautionAmount: 12000,
		bookmarked: false,
	},
	{
		id: "r5",
		title: "Compact Apartment in Centre Ville",
		type: "apartment",
		price: 3600,
		rooms: 1,
		neighborhood: "Centre Ville",
		city: "Tangier",
		description:
			"Compact, fully equipped 1-bedroom flat in Tangier Centre Ville, 5 minutes from the port and train station.",
		landlordName: "Rim El Fassi",
		hasCaution: true,
		cautionAmount: 3600,
		bookmarked: false,
	},
	{
		id: "r6",
		title: "Renovated Room by the Corniche",
		type: "room",
		price: 1600,
		rooms: 1,
		neighborhood: "Corniche",
		city: "Tangier",
		description:
			"A renovated room with sea views on the Tangier Corniche, shared bathroom and kitchen, quiet neighbors.",
		landlordName: "Youssef Bennis",
		hasCaution: false, bookmarked: false,
	},
]

export const allListings = [...featuredListings, ...recentListings]

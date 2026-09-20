/* eslint-disable @typescript-eslint/no-unused-vars */
// Global type declarations — consumed across the app via the `@/*` path alias.

type PropertyType = "house" | "studio" | "room" | "apartment"
type ListingStatus = "pending" | "published" | "rejected" | "rented"
type UserRole = "landlord" | "tenant" | "both"

type ListingPhoto = {
	url: string
	sort_order: number
	is_cover: boolean
}

type Listing = {
	id: string
	title: string
	type: PropertyType
	price: number
	rooms: number
	neighborhood: string
	city: string
	description: string
	landlordName: string
	hasCaution: boolean
	cautionAmount?: number
	bookmarked: boolean
	photos?: ListingPhoto[]
}

interface CreateListing {
	title: string
	type: PropertyType
	rooms: number
	price: number
	neighborhood: string
	city: string
	hasCaution: boolean
	cautionAmount?: number
}

interface GetAllListings {
	limit?: number
	page?: number
	type?: string | string[]
	city?: string | string[]
	rooms?: number
	minPrice?: number
	maxPrice?: number
}

interface SearchParams {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

interface Avatar {
	userName: string
	width: number
	height: number
	className?: string
}

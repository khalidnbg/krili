// app/sitemap.ts
import type { MetadataRoute } from "next"
import { siteUrl, getPublishedCityTypeCombos, getPublishedListingsForSitemap } from "@/lib/seo"

export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = siteUrl()

	const staticPages: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1,
			alternates: {
				languages: {
					fr: `${baseUrl}/fr`,
					ar: `${baseUrl}/ar`,
					"x-default": `${baseUrl}/fr`,
				},
			},
		},
		{
			url: `${baseUrl}/fr/listings`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
			alternates: {
				languages: {
					fr: `${baseUrl}/fr/listings`,
					ar: `${baseUrl}/ar/listings`,
					"x-default": `${baseUrl}/fr/listings`,
				},
			},
		},
		{
			url: `${baseUrl}/ar/listings`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
		},
	]

	// Add landing pages for city/type combinations
	let landingPages: MetadataRoute.Sitemap = []
	try {
		const combos = await getPublishedCityTypeCombos()

		landingPages = combos.map((combo) => {
			const [city, type] = combo.split(":")

			if (type) {
				// City + type page
				return {
					url: `${baseUrl}/fr/listings?city=${city}&type=${type}`,
					lastModified: new Date(),
					changeFrequency: "weekly",
					priority: 0.8,
					alternates: {
						languages: {
							fr: `${baseUrl}/fr/listings?city=${city}&type=${type}`,
							ar: `${baseUrl}/ar/listings?city=${city}&type=${type}`,
							"x-default": `${baseUrl}/fr/listings?city=${city}&type=${type}`,
						},
					},
				}
			} else {
				// City-only page
				return {
					url: `${baseUrl}/fr/listings?city=${city}`,
					lastModified: new Date(),
					changeFrequency: "weekly",
					priority: 0.7,
					alternates: {
						languages: {
							fr: `${baseUrl}/fr/listings?city=${city}`,
							ar: `${baseUrl}/ar/listings?city=${city}`,
							"x-default": `${baseUrl}/fr/listings?city=${city}`,
						},
					},
				}
			}
		})
	} catch (error) {
		console.error("Failed to fetch city/type combos for sitemap:", error)
		// Fail gracefully - return only static pages
	}

	// Add published listings
	let listingPages: MetadataRoute.Sitemap = []
	try {
		const listings = await getPublishedListingsForSitemap()

		listingPages = listings.map((listing) => ({
			url: `${baseUrl}/fr/listings/${listing.id}`,
			lastModified: new Date(listing.updated_at),
			changeFrequency: "weekly",
			priority: 0.6,
			alternates: {
				languages: {
					fr: `${baseUrl}/fr/listings/${listing.id}`,
					ar: `${baseUrl}/ar/listings/${listing.id}`,
					"x-default": `${baseUrl}/fr/listings/${listing.id}`,
				},
			},
		}))
	} catch (error) {
		console.error("Failed to fetch listings for sitemap:", error)
		// Fail gracefully - return only static pages
	}

	return [...staticPages, ...landingPages, ...listingPages]
}
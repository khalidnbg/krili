// app/robots.ts
import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: [
					"/admin",
					"/dashboard",
					"/bookmarks",
					"/listings/new",
					"/listings/*/edit",
					"/sign-in",
					"/sign-up",
					"/api/",
					"/fr/admin",
					"/fr/dashboard",
					"/fr/bookmarks",
					"/fr/listings/new",
					"/fr/listings/*/edit",
					"/fr/sign-in",
					"/fr/sign-up",
					"/ar/admin",
					"/ar/dashboard",
					"/ar/bookmarks",
					"/ar/listings/new",
					"/ar/listings/*/edit",
					"/ar/sign-in",
					"/ar/sign-up",
				],
			},
		],
		sitemap: `${siteUrl()}/sitemap.xml`,
	}
}
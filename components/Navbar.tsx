"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Bookmark, Compass, LayoutDashboard, Menu, Plus, Shield, X } from "lucide-react"
import { SignInButton, Show, UserButton, SignUpButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { useTranslations, useLocale } from "next-intl"
import { Link, usePathname, useRouter } from "@/i18n/routing"

interface NavbarProps {
	isAdmin?: boolean
}

const Navbar = ({ isAdmin = false }: NavbarProps) => {
	const pathname = usePathname()
	const router = useRouter()
	const locale = useLocale()
	const t = useTranslations("nav")
	const [open, setOpen] = useState(false)

	const isNewListingPage = pathname === "/listings/new"
	const close = () => setOpen(false)

	const switchLocale = (newLocale: string) => {
		router.replace(pathname, { locale: newLocale })
	}

	useEffect(() => {
		const id = requestAnimationFrame(() => setOpen(false))
		return () => cancelAnimationFrame(id)
	}, [pathname])

	useEffect(() => {
		if (!open) return
		const previous = document.body.style.overflow
		document.body.style.overflow = "hidden"
		return () => {
			document.body.style.overflow = previous
		}
	}, [open])

	const navLink = (href: string, label: string, Icon: typeof Compass, exact = true) => {
		const isActive = exact ? pathname === href : pathname.startsWith(href)
		return (
			<Link
				href={href}
				className={cn(
					"flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
					isActive
						? "bg-[#FE5933] text-white"
						: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
				)}
			>
				<Icon className="size-4" />
				{label}
			</Link>
		)
	}

	const mobileLink = (href: string, label: string, Icon: typeof Compass, exact = true) => {
		const isActive = exact ? pathname === href : pathname.startsWith(href)
		return (
			<Link
				href={href}
				onClick={close}
				className={cn(
					"flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium",
					isActive ? "bg-[#FE5933] text-white" : "text-neutral-700 hover:bg-neutral-100"
				)}
			>
				<Icon className="size-4" /> {label}
			</Link>
		)
	}

	return (
		<header className="sticky top-4 z-50 mx-4 md:mx-8">
			<nav className="flex items-center justify-between gap-4 rounded-full border border-neutral-200/80 bg-white/90 px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md">
				<Link href="/" className="relative z-[70] shrink-0">
					<Image src="/logo.png" alt="logo" width={40} height={38} className="h-9 w-auto" />
				</Link>

				{/* Desktop */}
				<div className="hidden items-center gap-1 md:flex">
					{navLink("/listings", t("browse"), Compass)}
					<Show when="signed-in">
						{navLink("/dashboard", t("myListings"), LayoutDashboard)}
						{navLink("/bookmarks", t("saved"), Bookmark)}
						{isAdmin && navLink("/admin", t("admin"), Shield, false)}
					</Show>
				</div>

				<div className="hidden items-center gap-3 md:flex">
					{/* Locale switcher */}
					<button
						onClick={() => switchLocale(locale === "fr" ? "ar" : "fr")}
						className="rounded-full px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
					>
						{locale === "fr" ? "AR" : "FR"}
					</button>
					<Show when="signed-in">
						{!isNewListingPage && (
							<Link
								href="/listings/new"
								className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
							>
								{t("newListing")}
							</Link>
						)}
						<UserButton />
					</Show>
					<Show when="signed-out">
						<SignInButton>
							<button className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
								{t("signIn")}
							</button>
						</SignInButton>
						<SignUpButton>
							<button className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
								{t("signUp")}
							</button>
						</SignUpButton>
					</Show>
				</div>

				{/* Mobile bar */}
				<div className="flex items-center gap-3 md:hidden">
					<Show when="signed-in">
						<UserButton />
					</Show>
					<button
						type="button"
						className="relative z-[70] flex size-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-900"
						aria-label={open ? "Close menu" : "Open menu"}
						aria-expanded={open}
						onClick={() => setOpen(!open)}
					>
						{open ? <X className="size-4" /> : <Menu className="size-4" />}
					</button>
				</div>
			</nav>

			{open && (
				<>
					<div
						className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in-0"
						aria-hidden="true"
						onClick={close}
					/>

					<div className="relative z-50 mt-2 flex flex-col gap-1 overflow-hidden rounded-3xl border border-neutral-200/80 bg-white p-3 shadow-xl md:hidden animate-in fade-in-0 slide-in-from-top-2">
						{/* Locale switcher */}
						<button
							onClick={() => switchLocale(locale === "fr" ? "ar" : "fr")}
							className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
						>
							{locale === "fr" ? "العربية" : "Français"}
						</button>
						{mobileLink("/listings", t("browse"), Compass)}

						<Show when="signed-in">
							{mobileLink("/dashboard", t("myListings"), LayoutDashboard)}
							{mobileLink("/bookmarks", t("saved"), Bookmark)}
							{isAdmin && mobileLink("/admin", t("admin"), Shield, false)}
							{!isNewListingPage && (
								<Link
									href="/listings/new"
									onClick={close}
									className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
								>
									<Plus className="size-4" /> {t("newListing")}
								</Link>
							)}
						</Show>

						<Show when="signed-out">
							<div className="mt-1 flex flex-col gap-2 border-t border-neutral-200 pt-3">
								<SignUpButton>
									<button className="w-full justify-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white">
										{t("signUp")}
									</button>
								</SignUpButton>
								<SignInButton>
									<button className="w-full justify-center rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-900">
										{t("signIn")}
									</button>
								</SignInButton>
							</div>
						</Show>
					</div>
				</>
			)}
		</header>
	)
}

export default Navbar
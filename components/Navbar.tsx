"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Bookmark, Compass, LayoutDashboard, Menu, Plus, Shield, X } from "lucide-react"
import { SignInButton, Show, UserButton, SignUpButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

interface NavbarProps {
	isAdmin?: boolean
}

const Navbar = ({ isAdmin = false }: NavbarProps) => {
	const pathname = usePathname()
	const [open, setOpen] = useState(false)

	const isNewListingPage = pathname === "/listings/new"
	const close = () => setOpen(false)

	useEffect(() => setOpen(false), [pathname])

	// Lock background scrolling while the overlay is open.
	useEffect(() => {
		if (!open) return
		const previous = document.body.style.overflow
		document.body.style.overflow = "hidden"
		return () => {
			document.body.style.overflow = previous
		}
	}, [open])

	return (
		<nav className={cn("navbar", "relative z-50")}>
			<Link href="/" className="relative z-[70]">
				<div className="flex cursor-pointer items-center gap-2.5">
					<Image src="/logo.png" alt="logo" width={46} height={44} className="h-auto w-auto" />
				</div>
			</Link>

			{/* Desktop (md and up) */}
			<div className="hidden items-center gap-3 md:flex">
				<Link href="/listings" className="btn-signin">Browse</Link>
				<Show when="signed-in">
					<Link href="/dashboard" className="btn-signin">My listings</Link>
					<Link href="/bookmarks" className="btn-signin">Saved</Link>
					{isAdmin && <Link href="/admin" className="btn-signin">Admin</Link>}
					{!isNewListingPage && (
						<Link href="/listings/new" className="btn-signin">List a property</Link>
					)}
					<UserButton />
				</Show>
				<Show when="signed-out">
					<SignUpButton>
						<button className="btn-signin">Sign Up</button>
					</SignUpButton>
					<SignInButton>
						<button className="btn-signin">Sign In</button>
					</SignInButton>
				</Show>
			</div>

			{/* Mobile bar */}
			<div className="flex items-center gap-3 md:hidden">
				<Show when="signed-in">
					<UserButton />
				</Show>
				<button
					type="button"
					className="relative z-[70] flex size-9 items-center justify-center border border-white rounded-full p-0"
					aria-label={open ? "Close menu" : "Open menu"}
					aria-expanded={open}
					onClick={() => setOpen(!open)}
				>
					{open ? <X className="size-4 text-white" /> : <Menu className="size-4" />}
				</button>
			</div>

			{open && (
				<>
					{/* Dimmed overlay — tap anywhere to close */}
					<div
						className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in-0"
						aria-hidden="true"
						onClick={close}
					/>

					{/* Menu panel */}
					<div className="absolute left-0 right-0 top-full z-[60] mt-1 flex flex-col gap-1 overflow-hidden rounded-2xl border border-black bg-white p-4 shadow-xl md:hidden animate-in fade-in-0 slide-in-from-top-2">
						<p className="px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
							Menu
						</p>

						<Link
							href="/listings"
							onClick={close}
							className={cn(
								"flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
								pathname === "/listings" && "bg-muted font-semibold"
							)}
						>
							<Compass className="size-4 text-muted-foreground" /> Browse
						</Link>

						<Show when="signed-in">
							<Link
								href="/dashboard"
								onClick={close}
								className={cn(
									"flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
									pathname === "/dashboard" && "bg-muted font-semibold"
								)}
							>
								<LayoutDashboard className="size-4 text-muted-foreground" /> My listings
							</Link>
							<Link
								href="/bookmarks"
								onClick={close}
								className={cn(
									"flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
									pathname === "/bookmarks" && "bg-muted font-semibold"
								)}
							>
								<Bookmark className="size-4 text-muted-foreground" /> Saved
							</Link>
							{isAdmin && (
								<Link
									href="/admin"
									onClick={close}
									className={cn(
										"flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
										pathname.startsWith("/admin") && "bg-muted font-semibold"
									)}
								>
									<Shield className="size-4 text-muted-foreground" /> Admin
								</Link>
							)}
							{!isNewListingPage && (
								<Link
									href="/listings/new"
									onClick={close}
									className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
								>
									<Plus className="size-4 text-muted-foreground" /> List a property
								</Link>
							)}
						</Show>

						<Show when="signed-out">
							<div className="mt-1 flex flex-col gap-2 border-t border-border pt-2">
								<SignUpButton>
									<button className="btn-signin w-full justify-center">Sign Up</button>
								</SignUpButton>
								<SignInButton>
									<button className="btn-signin w-full justify-center">Sign In</button>
								</SignInButton>
							</div>
						</Show>
					</div>
				</>
			)}
		</nav>
	)
}

export default Navbar

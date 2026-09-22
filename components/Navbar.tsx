"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
	SignInButton,
	Show,
	UserButton,
	SignUpButton,
} from "@clerk/nextjs";

const Navbar = () => {
	const pathname = usePathname();

	const isNewListingPage = pathname === "/listings/new";

	return (
		<nav className="navbar">
			<Link href="/">
				<div className="flex items-center gap-2.5 cursor-pointer">
					<Image
						src="/logo.png"
						alt="logo"
						width={46}
						height={44}
						className="h-auto w-auto"
					/>
				</div>
			</Link>

			<div className="flex items-center gap-4">
				<Show when="signed-in">
					<Link href="/dashboard" className="btn-signin">My listings</Link>
					{!isNewListingPage && (
						<Link href="/listings/new" className="btn-signin">List a property</Link>
					)}
				</Show>


				<Show when="signed-out">
					<SignUpButton>
						<button className="btn-signin">Sign Up</button>
					</SignUpButton>

					<SignInButton>
						<button className="btn-signin">Sign In</button>
					</SignInButton>
				</Show>

				<Show when="signed-in">
					<UserButton />
				</Show>
			</div>
		</nav>
	);
};

export default Navbar;
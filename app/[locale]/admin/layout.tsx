import AdminNav from "@/components/admin/AdminNav"

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<main>
			<AdminNav />
			{children}
		</main>
	)
}

export default AdminLayout
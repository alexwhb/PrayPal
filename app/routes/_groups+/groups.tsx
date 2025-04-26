import { Outlet } from 'react-router'

export default function Needs() {
	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="mb-8 text-center text-3xl font-bold">
				Community Groups
			</h1>

			<p className="mx-auto mb-8 max-w-3xl text-center text-muted-foreground">
				This is where you can find or create groups within the church.
			</p>
			<Outlet />
		</main>
	)
}
import { Outlet } from 'react-router'

export default function Needs() {
	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="mb-8 text-center text-3xl font-bold">
				Community Needs Board
			</h1>

			<p className="mx-auto mb-8 max-w-3xl text-center text-muted-foreground">
				the vision is to try, as a church body, to live out this:
				Acts 4:34-35 (ESV) "There was not a needy person among them, for as
				many as were owners of lands or houses sold them and brought the
				proceeds of what was sold and laid it at the apostles' feet, and it
				was distributed to each as any had need."
			</p>
			<Outlet />
		</main>
	)
}

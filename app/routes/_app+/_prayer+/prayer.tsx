import { Outlet, redirect } from 'react-router'
import { type Route } from './+types/prayer'

export async function loader({ request }: Route.LoaderArgs) {
	// if this page is just /prayer then redirect to /prayer/board
	if (new URL(request.url).pathname === '/prayer') {
		return redirect('/prayer/board')
	}

	return {}
}

export default function Prayer() {
	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="mb-8 text-center text-3xl font-bold">
				Community Prayer Board
			</h1>
			<p className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground">
				Share prayer requests with the community. Together in faith, we support
				one another.
			</p>

			<h2 className="mb-4 text-xl font-semibold">Prayer Requests</h2>
			<Outlet />
		</main>
	)
}

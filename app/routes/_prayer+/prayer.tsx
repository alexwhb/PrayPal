import { Outlet } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { type Route } from './+types/prayer'

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	return {}
}

export default function Prayer() {
	return (
		<main className="container mx-auto px-4 py-8">
			<Outlet />
		</main>
	)
}

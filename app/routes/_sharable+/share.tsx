import { Outlet } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { type Route } from './+types/share'

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	return {}
}

export default function Share() {
	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="mb-8 text-center text-3xl font-bold">
				Community Share Board
			</h1>
			<p className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground">
				Borrow tools, equipment, and other useful items from church members. Return when you're done!
			</p>

			<Outlet />
		</main>
	)
}

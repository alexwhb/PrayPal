import { Outlet, useSearchParams } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { type Route } from './+types/share'

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	return {}
}

export default function Share() {
	const [searchParams] = useSearchParams()
	const isGiveBoard = searchParams.get('type')?.toLowerCase() === 'give'

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="mb-8 text-center text-3xl font-bold">
				{isGiveBoard ? 'Free Items Board' : 'Community Share Board'}
			</h1>
			<p className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground">
				{isGiveBoard 
					? 'Browse and claim free items from church members.'
					: 'Borrow tools, equipment, and other useful items from church members. Return when you\'re done!'}
			</p>

			<Outlet />
		</main>
	)
}

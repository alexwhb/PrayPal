import { data } from 'react-router'
import NeedsBoard from '#app/components/needs/needs-board.tsx'
import { useBoardNavigation } from '#app/hooks/use-board-navigation.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { loadBoardData } from '#app/utils/board-loader.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/needs.board.ts'

export { action } from './_needs.board.actions.server.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)

	const boardData = await loadBoardData(
		{ url, userId },
		{
			type: 'NEED',
			model: prisma.request,
			where: {
				type: 'NEED',
				status: 'ACTIVE',
				fulfilled: false,
			},
			getCategoryWhere: () => ({ type: 'NEED', active: true }),
			select: {
				id: true,
				user: {
					select: {
						id: true,
						name: true,
						image: { select: { id: true } },
						username: true
					}
				},
				category: { select: { name: true } },
				description: true,
				createdAt: true,
				fulfilled: true,
				response: true,
			},
			transformResponse: (items, user) => items.map(data => ({
				...data,
				canModerate: user.roles.some(role => ['admin', 'moderator'].includes(role.name)),
			}))
		}
	)

	return {
		...boardData,
		needs: boardData.items
	}
}

export default function NeedsBoardPage({
	actionData,
	loaderData,
}: Route.ComponentProps) {
	const { getSortUrl, getFilterUrl, getNextPageUrl } = useBoardNavigation()

	return (
		<NeedsBoard
			loaderData={loaderData}
			actionData={actionData}
			getFilterUrl={getFilterUrl}
			getSortUrl={getSortUrl}
			getNextPageUrl={getNextPageUrl}
		/>
	)
}

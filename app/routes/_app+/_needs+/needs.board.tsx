import { data } from 'react-router'
import NeedsBoard from '#app/components/needs/needs-board.tsx'
import { useBoardNavigation } from '#app/hooks/use-board-navigation.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { loadBoardData } from '#app/utils/board-loader.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { moderateItem } from '#app/utils/moderation.server.ts'
import { type Route } from './+types/needs.board.ts'

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

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const needId = formData.get('needId')
	const action = formData.get('_action')

	console.log('action',action)

	if (action === 'delete') {
		const moderatorAction = formData.get('moderatorAction') === '1'
		const reason = formData.get('reason') as string || 'Moderation action'

		return moderateItem({
			userId,
			itemId: needId as string,
			itemType: 'NEED',
			action: 'delete',
			reason,
			isModerator: moderatorAction
		})
	} else if (action === 'markFulfilled') {
		await prisma.request.update({
			where: { id: needId as string },
			data: {
				fulfilled: formData.get('fulfilled') === '1',
			},
		})
		
		return data({ success: true })
	} else if (action === 'pending' || action === 'removed') {
		const moderatorAction = formData.get('moderatorAction') === '1'
		const reason = formData.get('reason') as string || 'Moderation action'
		
		return moderateItem({
			userId,
			itemId: needId as string,
			itemType: 'NEED',
			action: action as 'pending' | 'removed',
			reason,
			isModerator: moderatorAction
		})
	}
	
	return null
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

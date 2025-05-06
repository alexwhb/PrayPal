import { ModerationType } from '@prisma/client'
import { data } from 'react-router'
import PrayerBoard from '#app/components/prayer/prayer-board.tsx'
import { useBoardNavigation } from '#app/hooks/use-board-navigation.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { loadBoardData } from '#app/utils/board-loader.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { moderateItem } from '#app/utils/moderation.server.ts'
import { type Route } from './+types/prayer.board.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const user = userId ? await prisma.user.findUnique({
		where: { id: userId },
		include: { roles: true },
	}) : null

	const canModerate = user?.roles.some(role => 
		['admin', 'moderator'].includes(role.name)
	) ?? false

	const url = new URL(request.url)

	const boardData = await loadBoardData(
		{ url, userId },
		{
			type: 'PRAYER',
			model: prisma.request,
			where: {
				type: 'PRAYER',
				status: 'ACTIVE',
			},
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
			getCategoryWhere: () => ({ type: 'PRAYER', active: true }),
			transformResponse: (items, user) => items.map(data => ({
				answered: data.fulfilled,
				answeredMessage: data.response?.message ?? null,
				prayerCount: data.response?.prayerCount ?? 0,
				hasPrayed: data.response?.prayedBy?.includes(userId) ?? false,
				lastUpdatedAt: data.response?.lastUpdatedAt ?? null,
				canModerate: user.roles.some(role => ['admin', 'moderator'].includes(role.name)),
				...data,
			}))
		}
	)

	return data({
		prayers: boardData.items,
		canModerate,
		...boardData
	})
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const prayerId = formData.get('prayerId')
	const action = formData.get('_action')

	if (action === 'togglePraying') {
		// First fetch the current request
		const request = await prisma.request.findUnique({
			where: { id: prayerId as string },
			select: { response: true },
		})

		// Initialize or get current values
		const currentResponse = request?.response ?? {}
		const prayedBy = new Set(currentResponse.prayedBy ?? [])
		const currentCount = currentResponse.prayerCount ?? 0

		// Toggle user's prayer status
		const hasPrayed = prayedBy.has(userId)
		if (hasPrayed) {
			prayedBy.delete(userId)
		} else {
			prayedBy.add(userId)
		}

		// Update the request with new values
		await prisma.request.update({
			where: { id: prayerId as string },
			data: {
				response: {
					prayerCount: hasPrayed ? currentCount - 1 : currentCount + 1,
					prayedBy: Array.from(prayedBy),
					lastUpdatedAt: new Date().toISOString(),
				},
			},
		})

		return data({ success: true })
	} else if (action === 'delete') {
		const moderatorAction = formData.get('moderatorAction') === '1'
		const reason = formData.get('reason') as string || 'Moderation action'
		
		return moderateItem({
			userId,
			itemId: prayerId as string,
			itemType: ModerationType.PRAYER,
			action: 'delete',
			reason,
			isModerator: moderatorAction
		})
	} else if (action === 'markAsAnswered') {
		await prisma.request.update({
			where: { id: prayerId as string },
			data: {
				fulfilled: true,
				response: {
					message: formData.get('testimony') as string,
				},
			},
		})
		
		return data({ success: true })
	} else if (action === 'pending' || action === 'removed') {
		const moderatorAction = formData.get('moderatorAction') === '1'
		const reason = formData.get('reason') as string || 'Moderation action'
		
		return moderateItem({
			userId,
			itemId: prayerId as string,
			itemType: 'PRAYER',
			action: action as 'pending' | 'removed',
			reason,
			isModerator: moderatorAction
		})
	}
	
	return null
}

export default function PrayerBoardPage({
	actionData,
	loaderData,
}: Route.ComponentProps) {
	const { getSortUrl, getFilterUrl, getNextPageUrl } = useBoardNavigation()

	return (
		<PrayerBoard
			loaderData={loaderData}
			actionData={actionData}
			getFilterUrl={getFilterUrl}
			getSortUrl={getSortUrl}
			getNextPageUrl={getNextPageUrl}
		/>
	)
}

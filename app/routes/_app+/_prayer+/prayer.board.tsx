import { useCallback } from 'react'
import { data, useSearchParams } from 'react-router'
import PrayerBoard from '#app/components/prayer/prayer-board.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { loadBoardData } from '#app/utils/board-loader.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/prayer.board.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request).catch(() => null)
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
			model: prisma.request,
			where: {
				type: 'PRAYER',
				status: 'ACTIVE',
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
		
		if (moderatorAction) {
			await prisma.moderationLog.create({
				data: {
					moderatorId: userId,
					itemId: prayerId as string,
					itemType: 'PRAYER',
					action: 'DELETE',
					reason: formData.get('reason') as string || 'Moderation action'
				}
			})
		}

		await prisma.request.delete({ where: { id: prayerId as string } })
		return data({ success: true })
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
	}
}

export default function PrayerBoardPage({
	actionData,
	loaderData,
}: Route.ComponentProps) {
	const [searchParams] = useSearchParams()

	// Helper to generate URLs with updated search params
	const generateUrl = useCallback(
		(newParams: Record<string, string | number>) => {
			const params = new URLSearchParams(searchParams)
			Object.entries(newParams).forEach(([key, value]) => {
				if (value === undefined || value === null || value === '') {
					params.delete(key)
				} else {
					params.set(key, String(value))
				}
			})
			return `?${params.toString()}`
		},
		[searchParams],
	)

	// Generate URLs for different actions
	const getSortUrl = useCallback(() => {
		// we toggle our sort.
		const currentSort = searchParams.get('sort') === 'asc' ? 'asc' : 'desc'
		const newSort = currentSort === 'asc' ? 'desc' : 'asc'
		return generateUrl({ sort: newSort, page: 1 })
	}, [generateUrl, searchParams])

	const getFilterUrl = useCallback(
		(newFilter: string) => {
			return generateUrl({ filter: newFilter, page: 1 })
		},
		[generateUrl],
	)

	const getNextPageUrl = useCallback(() => {
		const currentPage = parseInt(searchParams.get('page') || '1', 10)
		return generateUrl({ page: currentPage + 1 })
	}, [generateUrl, searchParams])

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

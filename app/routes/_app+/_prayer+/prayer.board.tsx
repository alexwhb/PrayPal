import { data } from 'react-router'
import PrayerBoard from '#app/components/prayer/prayer-board.tsx'
import { useBoardNavigation } from '#app/hooks/use-board-navigation.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { loadBoardData } from '#app/utils/board-loader.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/prayer.board.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const user = userId
		? await prisma.user.findUnique({
				where: { id: userId },
				include: { roles: true },
			})
		: null

	const canModerate =
		user?.roles.some((role) => ['admin', 'moderator'].includes(role.name)) ??
		false

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
						username: true,
					},
				},
				category: { select: { name: true } },
				description: true,
				createdAt: true,
				fulfilled: true,
				response: true,
			},
			getCategoryWhere: () => ({ type: 'PRAYER', active: true }),
			transformResponse: (items, user) =>
				items.map((data) => ({
					answered: data.fulfilled,
					answeredMessage: data.response?.message ?? null,
					prayerCount: data.response?.prayerCount ?? 0,
					hasPrayed: data.response?.prayedBy?.includes(userId) ?? false,
					lastUpdatedAt: data.response?.lastUpdatedAt ?? null,
					canModerate: user.roles.some((role) =>
						['admin', 'moderator'].includes(role.name),
					),
					...data,
				})),
		},
	)

	return data({
		prayers: boardData.items,
		canModerate,
		...boardData,
	})
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

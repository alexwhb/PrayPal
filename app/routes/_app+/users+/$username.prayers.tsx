import { data } from 'react-router'
import BoardFooter from '#app/components/board/board-footer'
import PrayerItem from '#app/components/prayer/prayer-item.tsx'
import { Card, CardContent } from '#app/components/ui/card'
import { useBoardNavigation } from '#app/hooks/use-board-navigation'
import { requireUserId } from '#app/utils/auth.server'
import { loadBoardData } from '#app/utils/board-loader.server'
import { prisma } from '#app/utils/db.server'
import { type Route } from './+types/$username.prayers'

export {action} from '../_prayer+/_prayer.board.action.server.ts'


export async function loader({ params, request }: Route.LoaderArgs) {
  const userId = await requireUserId(request)
  const url = new URL(request.url)
  
  // Find the profile user
  const profileUser = await prisma.user.findFirst({
    where: { username: params.username },
    select: { id: true, name: true, username: true }
  })
  
  if (!profileUser) {
    throw new Response('User not found', { status: 404 })
  }
  
  // Use the board loader but filter by the profile user's ID
  const boardData = await loadBoardData(
    { url, userId },
    {
      type: 'PRAYER',
      model: prisma.request,
      where: {
        type: 'PRAYER',
        status: 'ACTIVE',
        userId: profileUser.id
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
		userId,
    prayers: boardData.items,
    hasNextPage: boardData.hasNextPage,
    userDisplayName: profileUser.name ?? profileUser.username,
    ...boardData
  })
}

export default function UserPrayersTab({loaderData, actionData}: Route.ComponentProps) {
  const { prayers, hasNextPage, userDisplayName, userId: currentUserId } = loaderData
  const { getNextPageUrl } = useBoardNavigation()
  
  if (prayers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {userDisplayName} hasn't posted any prayer requests yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {prayers.map(prayer => (
				<PrayerItem
					key={prayer.id}
					prayer={prayer}
					actionData={actionData}
					canModerate={false}
					isCurrentUser={prayer.user.id === currentUserId} // In a real app, check if the current user is the author
				/>
      ))}
      <BoardFooter getNextPageUrl={getNextPageUrl} hasNextPage={hasNextPage} />
    </div>
  )
}
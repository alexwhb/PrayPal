import { data } from 'react-router'
import BoardFooter from '#app/components/board/board-footer'
import ShareItem from '#app/components/shared/share-item.tsx'
import { Card, CardContent } from '#app/components/ui/card'
import { useBoardNavigation } from '#app/hooks/use-board-navigation'
import { requireUserId } from '#app/utils/auth.server'
import { loadBoardData } from '#app/utils/board-loader.server'
import { prisma } from '#app/utils/db.server'
import { getImageSrc, getUserImgSrc } from '#app/utils/misc'
import { type Route } from './+types/$username.shares'

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
      type: 'SHARE',
      model: prisma.shareItem,
      where: {
        status: 'ACTIVE',
        userId: profileUser.id
      },
      getCategoryWhere: () => ({ type: 'SHARE', active: true }),
      select: {
        id: true,
        owner: {
          select: {
            id: true,
            name: true,
            image: { select: { id: true } },
            username: true,
          },
        },
        category: { select: { name: true } },
        imageId: true,
        title: true,
        description: true,
        location: true,
        createdAt: true,
        claimed: true,
        shareType: true,
        duration: true,
      },
      transformResponse: (items, user) =>
        items.map((item) => ({
          id: item.id,
          userId: item.owner.id,
          userDisplayName: item.owner.name ?? item.owner.username,
          userName: item.owner.username,
          userAvatar: getUserImgSrc(item.owner.image.id),
          title: item.title,
          description: item.description,
          category: item.category.name,
          location: item.location,
          image: item.imageId != null ? getImageSrc(item.imageId) : 'https://placehold.co/600x400',
          postedDate: item.createdAt,
          claimed: item.claimed,
          shareType: item.shareType.toLowerCase(),
          duration: item.duration,
          canModerate: user.roles.some((role) =>
            ['admin', 'moderator'].includes(role.name),
          ),
        })),
    },
  )

  return data({
    shares: boardData.items,
    hasNextPage: boardData.hasNextPage,
    userDisplayName: profileUser.name ?? profileUser.username,
    ...boardData
  })
}

export default function UserSharesTab({loaderData}: Route.ComponentProps) {
  const { shares, hasNextPage, userDisplayName } = loaderData
  const { getNextPageUrl } = useBoardNavigation()
  
  if (shares.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {userDisplayName} hasn't shared any items yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shares.map(share => (
					<ShareItem
						key={share.id}
						item={share}
						isCurrentUser={share.userId === loaderData.userId}
						onOpenDialog={() => {}}
					/>
        ))}
      </div>
      <BoardFooter getNextPageUrl={getNextPageUrl} hasNextPage={hasNextPage} />
    </div>
  )
}
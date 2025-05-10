import { Gift } from 'lucide-react'
import { useState } from 'react'
import { data } from 'react-router'
import BoardFooter from '#app/components/board/board-footer.tsx'
import BoardHeader from '#app/components/board/board-header.tsx'
import { DeleteDialog } from '#app/components/shared/delete-dialog.tsx'
import ShareItem from '#app/components/shared/share-item.tsx'
import { type ShareType } from '#app/components/shared/type.ts'
import { useBoardNavigation } from '#app/hooks/use-board-navigation.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { loadBoardData } from '#app/utils/board-loader.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getImageSrc, getUserImgSrc } from '#app/utils/misc.tsx'
import { type Route } from './+types/share.board.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)
	const sort = url.searchParams.get('sort') === 'asc' ? 'asc' : 'desc'
	const type: 'GIVE' | 'BORROW' =
		url.searchParams.get('type')?.toUpperCase() === 'GIVE' ? 'GIVE' : 'BORROW'

	const boardData = await loadBoardData(
		{ url, userId },
		{
			type: 'SHARE',
			model: prisma.shareItem,
			where: {
				status: 'ACTIVE',
				shareType: type,
				claimed: false, // Only show unclaimed items
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
				items.map((item) => {
					console.log(item.image)
					return {
						id: item.id,
						userId: item.owner.id,
						userDisplayName: item.owner.name ?? item.owner.username,
						userName: item.owner.username,
						userAvatar: getUserImgSrc(item.owner.image.id),
						title: item.title,
						description: item.description,
						category: item.category.name,
						location: item.location,
						image:
							item.imageId != null
								? getImageSrc(item.imageId)
								: 'https://placehold.co/600x400',
						postedDate: item.createdAt,
						claimed: item.claimed,
						shareType: item.shareType.toLowerCase(),
						duration: item.duration,
						canModerate: user.roles.some((role) =>
							['admin', 'moderator'].includes(role.name),
						),
					}
				}),
		},
	)

	return data({
		items: boardData.items,
		total: boardData.total,
		page: boardData.page,
		hasMore: boardData.hasNextPage,
		filters: boardData.filters,
		activeFilter: boardData.activeFilter,
		userId,
		sort,
		type,
	})
}

type DialogState = {
	isOpen: boolean
	itemId: string | null
	action: 'delete' | 'pending' | 'removed'
	isModerator: boolean
}

export default function ShareBoardPage({
	actionData,
	loaderData,
}: Route.ComponentProps) {
	const { getSortUrl, getFilterUrl, getNextPageUrl } = useBoardNavigation()
	const isBorrowBoard = loaderData.type === 'BORROW'
	const [dialogState, setDialogState] = useState<DialogState>({
		isOpen: false,
		itemId: null,
		action: 'delete',
		isModerator: false,
	})

	const handleOpenDialog = (
		itemId: string,
		action: 'delete' | 'pending' | 'removed',
		isModerator: boolean,
	) => {
		setDialogState({
			isOpen: true,
			itemId,
			action,
			isModerator,
		})
	}

	const handleCloseDialog = () => {
		setDialogState({
			isOpen: false,
			itemId: null,
			action: 'delete',
			isModerator: false,
		})
	}

	const getNewActionUrl = () => {
		return `../new?type=${loaderData.type.toLowerCase()}`
	}

	return (
		<div className="space-y-6">
			<BoardHeader
				filters={loaderData.filters}
				activeFilter={loaderData.activeFilter}
				getFilterUrl={getFilterUrl}
				getSortUrl={getSortUrl}
				getNewActionUrl={getNewActionUrl}
				newActionToolTipString={isBorrowBoard ? 'Share Equipment' : 'Give Item'}
				secondaryAction={
					isBorrowBoard
						? {
								label: 'View Free Items',
								href: '?type=give',
								tooltip: 'Switch to Free Items board',
								icon: Gift,
							}
						: {
								label: 'View Borrowable Items',
								href: '?',
								tooltip: 'Switch to Borrowable Items board',
								icon: Gift,
							}
				}
			/>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{loaderData.items.length > 0 ? (
					loaderData.items.map((item: ShareType) => (
						<ShareItem
							key={item.id}
							item={item}
							isCurrentUser={item.userId === loaderData.userId}
							onOpenDialog={handleOpenDialog}
						/>
					))
				) : (
					<div className="col-span-full rounded-lg border p-8 text-center">
						<p className="text-muted-foreground">
							No items found in this category.
						</p>
					</div>
				)}
			</div>

			<DeleteDialog
				open={dialogState.isOpen}
				onOpenChange={handleCloseDialog}
				additionalFormData={{
					itemId: dialogState.itemId ?? '',
					_action: dialogState.action,
				}}
				isModerator={dialogState.isModerator}
				title={
					dialogState.action === 'pending'
						? 'Mark Item as Pending'
						: dialogState.action === 'removed'
							? 'Remove Item'
							: 'Delete Item'
				}
				description={
					dialogState.action === 'pending'
						? 'This item will be flagged for review by other moderators.'
						: dialogState.action === 'removed'
							? 'This item will be removed from public view.'
							: 'This item will be permanently deleted.'
				}
				confirmLabel={
					dialogState.action === 'pending'
						? 'Mark as Pending'
						: dialogState.action === 'removed'
							? 'Remove Item'
							: 'Delete Item'
				}
			/>

			<BoardFooter
				getNextPageUrl={getNextPageUrl}
				hasNextPage={loaderData.hasMore}
			/>
		</div>
	)
}

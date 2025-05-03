import { invariantResponse } from '@epic-web/invariant'
import { Gift } from 'lucide-react'
import { useCallback, useState } from 'react'
import { data, useSearchParams } from 'react-router'
import BoardFooter from '#app/components/board/board-footer.tsx'
import BoardHeader from '#app/components/board/board-header.tsx'
import { DeleteDialog } from '#app/components/shared/delete-dialog.tsx'
import ShareItem from '#app/components/shared/share-item.tsx'
import { type ShareType } from '#app/components/shared/type.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { loadBoardData } from '#app/utils/board-loader.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { initiateConversation } from '#app/utils/messaging.server.ts'
import { moderateItem } from '#app/utils/moderation.server.ts'
import { type Route } from './+types/share.board.ts'
import { useBoardNavigation } from '#app/hooks/use-board-navigation.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)
	const sort = url.searchParams.get('sort') === 'asc' ? 'asc' : 'desc'
	const type : 'GIVE' | 'BORROW' =
		url.searchParams.get('type')?.toUpperCase() === 'GIVE' ? 'GIVE' : 'BORROW'

	const boardData = await loadBoardData(
		{ url, userId },
		{
			type: 'SHARE',
			model: prisma.shareItem,
			where: {
				status: 'ACTIVE',
				shareType: type,
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
					userAvatar: item.owner.image?.id
						? `/resources/user-images/${item.owner.image.id}`
						: '',
					title: item.title,
					description: item.description,
					category: item.category.name,
					location: item.location,
					image: 'https://placehold.co/600x400',
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

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const itemId = formData.get('itemId')
	const action = formData.get('_action')

	if (action === 'delete' || action === 'pending' || action === 'removed') {
		const moderatorAction = formData.get('moderatorAction') === '1'
		const reason = formData.get('reason') as string || 'Moderation action'

		return moderateItem({
			userId,
			itemId: itemId as string,
			itemType: 'SHARE_ITEM',
			action: action as 'delete' | 'pending' | 'removed',
			reason,
			isModerator: moderatorAction
		})
	}

	if (action === 'toggleClaimed') {
		const item = await prisma.shareItem.findUnique({
			where: { id: itemId as string },
			select: { userId: true, claimed: true },
		})

		// Verify ownership
		invariantResponse(item?.userId === userId, 'Not authorized', {
			status: 403,
		})

		await prisma.shareItem.update({
			where: { id: itemId as string },
			data: { claimed: !item.claimed },
		})

		return data({ success: true })
	}

	if (action === 'requestItem') {
		const item = await prisma.shareItem.findUnique({
			where: { id: itemId as string },
			select: { userId: true, title: true },
		})

		if (!item) return null

		return initiateConversation({
			initiatorId: userId,
			participantIds: [item.userId],
			checkExisting: true,
			initialMessage: `Hi! I'm interested in your shared item: "${item.title}"`,
		})
	}

	return null
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

	return (
		<div className="space-y-6">
			<BoardHeader
				filters={loaderData.filters}
				activeFilter={loaderData.activeFilter}
				getFilterUrl={getFilterUrl}
				getSortUrl={getSortUrl}
				newActionToolTipString="Share an Item"
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

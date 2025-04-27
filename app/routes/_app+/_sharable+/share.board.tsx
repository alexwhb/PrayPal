import {
	CalendarDays,
	Clock,
	Flag,
	Gift,
	MapPin,
	Share,
	Trash,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { data, Link, useSearchParams } from 'react-router'
import BoardFooter from '#app/components/board/board-footer.tsx'
import BoardHeader from '#app/components/board/board-header.tsx'
import { DeleteDialog } from '#app/components/shared/delete-dialog.tsx'
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '#app/components/ui/avatar.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '#app/components/ui/card.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu'
import { requireUserId } from '#app/utils/auth.server.ts'
import { loadBoardData } from '#app/utils/board-loader.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { formatDate } from '#app/utils/formatter.ts'
import { type Route } from './+types/share.board.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)
	const sort = url.searchParams.get('sort') === 'asc' ? 'asc' : 'desc'
	const type = url.searchParams.get('type')?.toUpperCase() === 'GIVE' ? 'GIVE' : 'BORROW'

	const boardData = await loadBoardData(
		{ url, userId },
		{
			type: type,
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

type Share = Awaited<ReturnType<typeof loader>>['items'][number]

type ItemCardProps = {
	item: Share
	isCurrentUser: boolean
	onOpenDialog: (itemId: string, action: 'delete' | 'pending' | 'removed', isModerator: boolean) => void
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const itemId = formData.get('itemId')
	const action = formData.get('_action')

	if (action === 'delete') {
		// TODO invalidate our total cache value whenever we remove an element.
		const moderatorAction = formData.get('moderatorAction') === '1'

		if (moderatorAction) {
			await prisma.moderationLog.create({
				data: {
					moderatorId: userId,
					itemId: itemId as string,
					itemType: 'SHARE_ITEM',
					action: 'DELETE',
					reason: (formData.get('reason') as string) || 'Moderation action',
				},
			})
		}

		await prisma.shareItem.delete({ where: { id: itemId as string } })
		return data({ success: true })
	}

	// ... other actions
}

type DialogState = {
	isOpen: boolean;
	itemId: string | null;
	action: 'delete' | 'pending' | 'removed';
	isModerator: boolean;
}

export default function ShareBoard({
	actionData,
	loaderData,
}: Route.ComponentProps) {
	const [searchParams] = useSearchParams()
	const isBorrowBoard = loaderData.type === 'BORROW'
	const [dialogState, setDialogState] = useState<DialogState>({
		isOpen: false,
		itemId: null,
		action: 'delete',
		isModerator: false
	})

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

	const handleOpenDialog = (itemId: string, action: 'delete' | 'pending' | 'removed', isModerator: boolean) => {
		setDialogState({
			isOpen: true,
			itemId,
			action,
			isModerator
		})
	}

	const handleCloseDialog = () => {
		setDialogState({
			isOpen: false,
			itemId: null,
			action: 'delete',
			isModerator: false
		})
	}

	return (
		<div className="space-y-6">
			<BoardHeader
				filters={loaderData.filters}
				activeFilter={loaderData.activeFilter}
				getFilterUrl={getFilterUrl}
				getSortUrl={getSortUrl}
				newActionToolTipString={isBorrowBoard ? "Share Equipment" : "Give Item"}
				secondaryAction={
					isBorrowBoard
						? {
							label: "View Free Items",
							href: "?type=give",
							tooltip: "Switch to Free Items board",
							icon: Gift
						}
						: {
							label: "View Borrowable Items",
							href: "?",
							tooltip: "Switch to Borrowable Items board",
							icon: Gift
						}
				}
			/>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{loaderData.items.length > 0 ? (
					loaderData.items.map((item: Share) => (
						<ItemCard
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

function ItemCard({ item, isCurrentUser, onOpenDialog }: ItemCardProps) {
	const isBorrowable = item.shareType === 'borrow'

	return (
		<Card
			className={`${item.claimed ? 'opacity-75' : ''} border-2 transition-shadow hover:shadow-md`}
		>
			<CardHeader className="p-0">
				<div className="relative h-58 w-full overflow-hidden">
					<img
						src={item.image}
						alt={item.title}
						className="h-full w-full rounded-t-lg object-cover"
					/>
					<div className="absolute right-2 top-2">
						<Badge
							variant="secondary"
							className="bg-green-500 hover:bg-green-400"
						>
							{item.category}
						</Badge>
					</div>
					<div className="absolute left-2 top-2">
						<Badge
							variant={isBorrowable ? 'outline' : 'default'}
							className={
								isBorrowable
									? 'bg-blue-500 text-white hover:bg-blue-600'
									: 'bg-green-500 hover:bg-green-600'
							}
						>
							{isBorrowable ? (
								<div className="flex items-center gap-1">
									<Share className="h-3 w-3" />
									<span>Borrow</span>
								</div>
							) : (
								<div className="flex items-center gap-1">
									<Gift className="h-3 w-3" />
									<span>Free</span>
								</div>
							)}
						</Badge>
					</div>
					{item.claimed && (
						<div className="absolute inset-0 flex items-center justify-center rounded-t-lg bg-black/50">
							<Badge
								variant="default"
								className="bg-red-200 py-2 text-lg hover:bg-red-300 text-red-900"
							>
								{isBorrowable ? 'Currently Borrowed' : 'Claimed'}
							</Badge>
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent className="pt-4">
				<h3 className="mb-1 text-lg font-semibold">{item.title}</h3>
				<p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
					{item.description}
				</p>
				<div className="mb-1 flex items-center text-sm text-muted-foreground">
					<MapPin className="mr-1 h-3 w-3" />
					{item.location}
				</div>
				{isBorrowable && item.duration && (
					<div className="mb-1 flex items-center text-sm text-muted-foreground">
						<Clock className="mr-1 h-3 w-3" />
						{item.duration}
					</div>
				)}
				<div className="mb-3 flex items-center text-sm text-muted-foreground">
					<CalendarDays className="mr-1 h-3 w-3" />
					Posted {formatDate(item.postedDate)}
				</div>

				<div className="flex items-center gap-2">
					{/*TODO username is not the user name*/}
					<Link to={`/users/${item.userName}`} prefetch="intent" className="flex items-center gap-2">
						<Avatar className="h-6 w-6">
							<AvatarImage src={item.userAvatar} alt={item.userDisplayName} />
							<AvatarFallback>{item.userDisplayName.charAt(0)}</AvatarFallback>
						</Avatar>
						<span className="text-sm">{item.userDisplayName}</span>
					</Link>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between pt-0">
				<Button>
					{item.claimed ? 'Mark as Available' : 'Mark as Claimed'}
				</Button>

				<div className="flex gap-2">
					{item.canModerate && !isCurrentUser && (
						<DropdownMenu modal={false}>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm">
									<Flag className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" onCloseAutoFocus={(event) => event.preventDefault()}>
								<DropdownMenuItem
									onClick={() => {
										onOpenDialog(item.id, 'pending', true)
									}}
								>
									Mark as Pending
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										onOpenDialog(item.id, 'removed', true)
									}}
								>
									Remove Item
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}

					{isCurrentUser && (
						<Button
							variant="destructive"
							size="sm"
							onClick={() => onOpenDialog(item.id, 'delete', false)}
						>
							<Trash className="mr-2 h-4 w-4" />
							Delete
						</Button>
					)}
				</div>
			</CardFooter>
		</Card>
	)
}

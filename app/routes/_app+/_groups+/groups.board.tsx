import { useCallback } from 'react'
import { data, useSearchParams } from 'react-router'
import BoardFooter from '#app/components/board/board-footer'
import BoardHeader from '#app/components/board/board-header'
import GroupCard from '#app/components/groups/group-card.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { loadBoardData } from '#app/utils/board-loader.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/groups.board.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request).catch(() => null)
	const url = new URL(request.url)

	// First query: Fetch groups with leader's membership
	const boardData = await loadBoardData(
		{ url, userId },
		{
			type: 'GROUP',
			model: prisma.group,
			where: {
				active: true,
				category: {
					type: 'GROUP',
					active: true,
				},
			},
			getCategoryWhere: () => ({ type: 'GROUP', active: true }),
			select: {
				id: true,
				name: true,
				description: true,
				frequency: true,
				meetingTime: true,
				location: true,
				isOnline: true,
				capacity: true,
				createdAt: true,
				category: { select: { name: true } },
				_count: { select: { memberships: true } },
				memberships: {
					where: { role: 'LEADER' },
					select: {
						user: {
							select: {
								id: true,
								name: true,
								image: { select: { id: true } },
								username: true,
							},
						},
					},
				},
			},
		},
	)
	
	// Get group IDs from the result
	const groupIds = boardData.items.map((group) => group.id)

	// Second query: Fetch current user's memberships for these groups
	const userMemberships = await prisma.groupMembership.findMany({
		where: {
			userId,
			groupId: { in: groupIds },
		},
		select: {
			groupId: true,
			role: true,
		},
	})

	// Create a map for quick lookup
	const userMembershipMap = new Map(userMemberships.map((m) => [m.groupId, m]))

	// Transform the response with both queries' data
	const transformedGroups = boardData.items.map((group) => {
		const userMembership = userMembershipMap.get(group.id)
		const isMember = !!userMembership
		const isLeader = userMembership?.role === 'LEADER'
		const leader = group.memberships[0]?.user // Leader's user info

		return {
			...group,
			isMember,
			isLeader,
			memberCount: group._count.memberships,
			hasCapacity: !group.capacity || group._count.memberships < group.capacity,
			canModerate: boardData.user.roles.some((role) =>
				['admin', 'moderator'].includes(role.name),
			),
			user: leader,
		}
	})

	return data({
		groups: transformedGroups,
		filters: boardData.filters,
		activeFilter: boardData.activeFilter,
		canModerate: boardData.user.roles.some((role) =>
			['admin', 'moderator'].includes(role.name),
		),
		userId,
		hasNextPage: boardData.hasNextPage,
		total: boardData.total,
		page: boardData.page,
	})
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const groupId = formData.get('groupId')
	const action = formData.get('_action')

	if (action === 'join') {
		// Check capacity before joining
		const group = await prisma.group.findUnique({
			where: { id: groupId as string },
			include: {
				_count: { select: { memberships: true } },
			},
		})

		if (group?.capacity && group._count.memberships >= group.capacity) {
			return data({ error: 'Group is at capacity' }, { status: 400 })
		}

		await prisma.groupMembership.create({
			data: {
				userId,
				groupId: groupId as string,
				role: 'MEMBER',
			},
		})

		return data({ success: true })
	} else if (action === 'leave') {
		await prisma.groupMembership.delete({
			where: {
				userId_groupId: {
					userId,
					groupId: groupId as string,
				},
			},
		})
		return data({ success: true })
	} else if (action === 'delete') {
		// TODO invalidate our total cache value whenever we remove an element.
		const moderatorAction = formData.get('moderatorAction') === '1'

		if (moderatorAction) {
			await prisma.moderationLog.create({
				data: {
					moderatorId: userId,
					itemId: groupId as string,
					itemType: 'GROUP',
					action: 'DELETE',
					reason: (formData.get('reason') as string) || 'Moderation action',
				},
			})
		}

		await prisma.group.update({
			where: { id: groupId as string },
			data: { active: false },
		})
		return data({ success: true })
	}
}

export default function GroupsBoard({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const {
		groups,
		filters,
		activeFilter,
		canModerate,
		userId: currentUserId,
		hasNextPage,
	} = loaderData

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
		<div className="space-y-6">
			<BoardHeader
				filters={filters}
				activeFilter={activeFilter}
				getFilterUrl={getFilterUrl}
				getSortUrl={getSortUrl}
				newActionToolTipString="Create New Group"
			/>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{groups.length > 0 ? (
					groups.map((group) => (
						<GroupCard
							key={group.id}
							group={group}
							actionData={actionData}
							canModerate={canModerate}
							isCurrentUser={group.user.id === currentUserId}
						/>
					))
				) : (
					<div className="col-span-full rounded-lg border p-8 text-center">
						<p className="text-muted-foreground">
							No groups found in this category.
						</p>
					</div>
				)}
			</div>
			<BoardFooter getNextPageUrl={getNextPageUrl} hasNextPage={hasNextPage} />
		</div>
	)
}

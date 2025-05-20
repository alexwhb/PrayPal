import { data, Link, redirect } from 'react-router'
import { Icon } from '#app/components/ui/icon.tsx'
import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar'
import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '#app/components/ui/tabs'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { getUserImgSrc } from '#app/utils/misc'
import { type Route } from './+types/groups.manage.$groupId'
import { Img } from 'openimg/react'
import { Form } from 'react-router'


export async function loader({ params, request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const groupId = params.groupId

	const group = await prisma.group.findUnique({
		where: { id: groupId },
		select: {
			id: true,
			name: true,
			isPrivate: true,
			memberships: {
				select: {
					userId: true,
					role: true,
					status: true,
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							image: { select: { objectKey: true } },
						},
					},
				},
			},
		},
	})

	if (!group) {
		throw new Response('Group not found', { status: 404 })
	}

	// Check if user is a leader of this group
	const userMembership = group.memberships.find((m) => m.userId === userId)
	const isLeader = userMembership?.role === 'LEADER'

	if (!isLeader) {
		return redirect(`/groups/${groupId}`)
	}

	// Filter memberships by status
	const members = group.memberships.filter((m) => m.status === 'APPROVED')

	// Get all pending requests regardless of whether the group is private
	const pendingRequests = group.memberships.filter(
		(m) => m.status === 'PENDING',
	)

	return data({
		group: {
			id: group.id,
			name: group.name,
			isPrivate: group.isPrivate,
		},
		members,
		pendingRequests,
	})
}

export async function action({ request, params }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const groupId = params.groupId
	const formData = await request.formData()
	const action = formData.get('_action')
	const targetUserId = formData.get('userId') as string

	console.log('Action:', action, 'Target User ID:', targetUserId)

	// Verify user is a leader
	const userMembership = await prisma.groupMembership.findUnique({
		where: {
			userId_groupId: {
				userId,
				groupId,
			},
		},
	})

	if (!userMembership || userMembership.role !== 'LEADER') {
		return data({ error: 'Unauthorized' }, { status: 403 })
	}

	if (action === 'approve' && targetUserId) {
		console.log('Approving membership for user:', targetUserId)

		// Update membership status to APPROVED
		await prisma.groupMembership.update({
			where: {
				userId_groupId: {
					userId: targetUserId,
					groupId,
				},
			},
			data: { status: 'APPROVED' },
		})

		// Create notification for approved user
		await prisma.notification.create({
			data: {
				userId: targetUserId,
				type: 'GROUP_APPROVED',
				title: 'Group Join Request Approved',
				description: `Your request to join the group has been approved.`,
				actionUrl: `/groups/${groupId}`,
			},
		})

		return data({ success: true })
	}

	if (action === 'reject' && targetUserId) {
		console.log('Rejecting membership for user:', targetUserId)

		// Delete the membership
		await prisma.groupMembership.delete({
			where: {
				userId_groupId: {
					userId: targetUserId,
					groupId,
				},
			},
		})

		// Create notification for rejected user
		await prisma.notification.create({
			data: {
				userId: targetUserId,
				type: 'GROUP_REJECTED',
				title: 'Group Join Request Rejected',
				description: `Your request to join the group was not approved.`,
				actionUrl: `/groups`,
			},
		})

		return data({ success: true })
	}

	if (action === 'promote' && targetUserId) {
		await prisma.groupMembership.update({
			where: {
				userId_groupId: {
					userId: targetUserId,
					groupId,
				},
			},
			data: { role: 'LEADER' },
		})

		return data({ success: true })
	}

	if (action === 'demote' && targetUserId) {
		await prisma.groupMembership.update({
			where: {
				userId_groupId: {
					userId: targetUserId,
					groupId,
				},
			},
			data: { role: 'MEMBER' },
		})

		return data({ success: true })
	}

	if (action === 'remove' && targetUserId) {
		await prisma.groupMembership.delete({
			where: {
				userId_groupId: {
					userId: targetUserId,
					groupId,
				},
			},
		})

		return data({ success: true })
	}

	return data({ error: 'Invalid action' }, { status: 400 })
}

export default function GroupManagePage({ loaderData }: Route.ComponentProps) {
	const { group, members, pendingRequests } = loaderData

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="sm" asChild>
					<Link to={`/groups/${group.id}`}>
						<Icon name="arrow-left" className="mr-2 h-4 w-4" />
						Back to Group
					</Link>
				</Button>
				<h1 className="text-2xl font-bold">Manage {group.name}</h1>
			</div>

			<Tabs defaultValue="members">
				<TabsList>
					<TabsTrigger value="members">Members ({members.length})</TabsTrigger>
					<TabsTrigger value="requests">
						Join Requests ({pendingRequests.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="members" className="mt-4 space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Group Members</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{members.map((member) => (
									<div
										key={member.userId}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-3">
											<Avatar>
												<AvatarImage
													src={getUserImgSrc(member.user.image?.objectKey)}
													asChild
												>
													<Img
														src={getUserImgSrc(member.user.image?.objectKey)}
														alt={member.user.name}
														className="h-full w-full object-cover"
														width={64}
														height={64}
													/>
												</AvatarImage>
												<AvatarFallback>
													{(member.user.name || member.user.username)[0]}
												</AvatarFallback>
											</Avatar>
											<div>
												<Link
													to={`/users/${member.user.username}`}
													className="font-medium hover:underline"
												>
													{member.user.name || member.user.username}
												</Link>
												{member.role === 'LEADER' && (
													<Badge variant="secondary" className="ml-2">
														Leader
													</Badge>
												)}
											</div>
										</div>

										<div className="flex gap-2">
											{member.role === 'MEMBER' ? (
												<Form method="post">
													<input
														type="hidden"
														name="userId"
														value={member.userId}
													/>
													<input type="hidden" name="_action" value="promote" />
													<Button size="sm" variant="outline" type="submit">
														Make Leader
													</Button>
												</Form>
											) : (
												<Form method="post">
													<input
														type="hidden"
														name="userId"
														value={member.userId}
													/>
													<input type="hidden" name="_action" value="demote" />
													<Button size="sm" variant="outline" type="submit">
														Remove as Leader
													</Button>
												</Form>
											)}

											<Form method="post">
												<input
													type="hidden"
													name="userId"
													value={member.userId}
												/>
												<input type="hidden" name="_action" value="remove" />
												<Button size="sm" variant="destructive" type="submit">
													Remove
												</Button>
											</Form>
										</div>
									</div>
								))}

								{members.length === 0 && (
									<p className="text-muted-foreground py-4 text-center">
										No members found
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="requests" className="mt-4 space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Pending Join Requests</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{pendingRequests.map((request) => (
									<div
										key={request.userId}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-3">
											<Avatar>
												<AvatarImage
													src={getUserImgSrc(request.user.image.id)}
													alt={request.user.name || request.user.username}
												>
													<Img
														src={getUserImgSrc(request.user.image.id)}
														alt={request.user.name || request.user.username}
														className="h-full w-full object-cover"
														width={64}
														height={64}
													/>
												</AvatarImage>

												<AvatarFallback>
													{(request.user.name || request.user.username)[0]}
												</AvatarFallback>
											</Avatar>
											<Link
												to={`/users/${request.user.username}`}
												className="font-medium hover:underline"
											>
												{request.user.name || request.user.username}
											</Link>
										</div>

										<div className="flex gap-2">
											<Form method="post">
												<input
													type="hidden"
													name="userId"
													value={request.userId}
												/>
												<input type="hidden" name="_action" value="approve" />
												<Button size="sm" variant="default" type="submit">
													<Icon name="check" className="mr-2 h-4 w-4" />
													Approve
												</Button>
											</Form>

											<Form method="post">
												<input
													type="hidden"
													name="userId"
													value={request.userId}
												/>
												<input type="hidden" name="_action" value="reject" />
												<Button size="sm" variant="destructive" type="submit">
													<Icon name="cross-1" className="mr-2 h-4 w-4" />
													Reject
												</Button>
											</Form>
										</div>
									</div>
								))}

								{pendingRequests.length === 0 && (
									<p className="text-muted-foreground py-4 text-center">
										No pending requests
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}

import { data, Link, useLoaderData } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { formatDate } from '#app/utils/formatter.ts'
import { ModerationType, ModeratorAction } from '@prisma/client'
import { Alert, AlertDescription } from '#app/components/ui/alert.tsx'
import { AlertCircle } from 'lucide-react'
import { Separator } from '#app/components/ui/separator.tsx'

export async function loader({ params, request }: { params: { logId: string }, request: Request }) {
	const userId = await requireUserId(request)

	// Check if user is a moderator or admin
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { roles: true },
	})

	const isModOrAdmin = user?.roles.some(role =>
		['admin', 'moderator'].includes(role.name)
	) ?? false

	if (!isModOrAdmin) {
		throw new Response('Not authorized', { status: 403 })
	}

	const logId = params.logId

	// Get the moderation log with related data
	const moderationLog = await prisma.moderationLog.findUnique({
		where: { id: logId },
		include: {
			moderator: {
				select: {
					id: true,
					name: true,
					username: true,
				},
			},
			report: {
				include: {
					reportedBy: {
						select: {
							id: true,
							name: true,
							username: true,
						},
					},
				},
			},
		},
	})

	if (!moderationLog) {
		throw new Response('Moderation log not found', { status: 404 })
	}

	// Get the moderated item based on type
	let moderatedItem = null

	if (moderationLog.itemType === 'PRAYER' || moderationLog.itemType === 'NEED') {
		moderatedItem = await prisma.request.findUnique({
			where: { id: moderationLog.itemId },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
					},
				},
				category: true,
			},
		})
	} else if (moderationLog.itemType === 'GROUP') {
		moderatedItem = await prisma.group.findUnique({
			where: { id: moderationLog.itemId },
			include: {
				memberships: {
					where: { role: 'LEADER' },
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
							},
						},
					},
				},
				category: true,
			},
		})
	} else if (moderationLog.itemType === 'SHARE_ITEM') {
		moderatedItem = await prisma.shareItem.findUnique({
			where: { id: moderationLog.itemId },
			include: {
				owner: {
					select: {
						id: true,
						name: true,
						username: true,
					},
				},
				category: true,
			},
		})
	} else if (moderationLog.itemType === 'USER') {
		moderatedItem = await prisma.user.findUnique({
			where: { id: moderationLog.itemId },
			select: {
				id: true,
				name: true,
				username: true,
				email: true,
				createdAt: true,
			},
		})
	} else if (moderationLog.itemType === 'MESSAGE') {
		moderatedItem = await prisma.message.findUnique({
			where: { id: moderationLog.itemId },
			include: {
				sender: {
					select: {
						id: true,
						name: true,
						username: true,
					},
				},
				recipient: {
					select: {
						id: true,
						name: true,
						username: true,
					},
				},
			},
		})
	}

	return data({
		moderationLog,
		moderatedItem,
		isAdmin: user?.roles.some(role => role.name === 'admin') ?? false,
	})
}

export default function ModerationDetails() {
	const { moderationLog, moderatedItem, isAdmin } = useLoaderData<typeof loader>()

	function getItemTypeLabel(type: ModerationType) {
		const labels: Record<ModerationType, string> = {
			PRAYER: 'Prayer Request',
			NEED: 'Need Request',
			MESSAGE: 'Message',
			USER: 'User',
			GROUP: 'Group',
			SHARE_ITEM: 'Shared Item',
		}
		return labels[type] || type
	}

	function getActionLabel(action: ModeratorAction) {
		const labels: Record<ModeratorAction, string> = {
			DELETE: 'Deleted',
			FLAG: 'Flagged',
			HIDE: 'Hidden',
			RESTORE: 'Restored',
		}
		return labels[action] || action
	}

	function getActionColor(action: ModeratorAction) {
		const colors: Record<ModeratorAction, string> = {
			DELETE: 'destructive',
			FLAG: 'outline',
			HIDE: 'outline',
			RESTORE: 'default',
		}
		return colors[action] as "destructive" | "outline" | "default"
	}

	function renderModeratedItem() {
		if (!moderatedItem) {
			return (
				<Alert variant="destructive" className="mb-4">
					<AlertCircle className="h-4 w-4" />
					{/*<AlertTitle>Item not found</AlertTitle>*/}
					<AlertDescription>
						The moderated item may have been deleted or is no longer accessible.
					</AlertDescription>
				</Alert>
			)
		}

		if (moderationLog.itemType === 'PRAYER' || moderationLog.itemType === 'NEED') {
			return (
				<Card className="mb-4">
					<CardHeader>
						<CardTitle>{moderationLog.itemType === 'PRAYER' ? 'Prayer Request' : 'Need Request'}</CardTitle>
						<CardDescription>
							Posted by{' '}
							<Link to={`/users/${moderatedItem.user.username}`} className="font-medium hover:underline">
								{moderatedItem.user.name}
							</Link>{' '}
							in {moderatedItem.category.name}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="whitespace-pre-wrap">{moderatedItem.description}</p>
						<div className="mt-4 flex items-center gap-2">
							<Badge variant="outline">{moderatedItem.status}</Badge>
							{moderatedItem.flagged && <Badge variant="outline">Flagged</Badge>}
							{moderatedItem.fulfilled && <Badge>Fulfilled</Badge>}
						</div>
					</CardContent>
				</Card>
			)
		} else if (moderationLog.itemType === 'GROUP') {
			const leader = moderatedItem.memberships[0]?.user

			return (
				<Card className="mb-4">
					<CardHeader>
						<CardTitle>{moderatedItem.name}</CardTitle>
						<CardDescription>
							Created by{' '}
							{leader ? (
								<Link to={`/users/${leader.username}`} className="font-medium hover:underline">
									{leader.name}
								</Link>
							) : (
								'Unknown user'
							)}{' '}
							in {moderatedItem.category.name}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="whitespace-pre-wrap">{moderatedItem.description}</p>
						<div className="mt-4 flex items-center gap-2">
							<Badge variant="outline">{moderatedItem.active ? 'Active' : 'Inactive'}</Badge>
						</div>
					</CardContent>
				</Card>
			)
		} else if (moderationLog.itemType === 'SHARE_ITEM') {
			return (
				<Card className="mb-4">
					<CardHeader>
						<CardTitle>{moderatedItem.title}</CardTitle>
						<CardDescription>
							Shared by{' '}
							<Link to={`/users/${moderatedItem.owner.username}`} className="font-medium hover:underline">
								{moderatedItem.owner.name}
							</Link>{' '}
							in {moderatedItem.category.name}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="whitespace-pre-wrap">{moderatedItem.description}</p>
						<div className="mt-4 flex items-center gap-2">
							<Badge variant="outline">{moderatedItem.status}</Badge>
							{moderatedItem.flagged && <Badge variant="outline">Flagged</Badge>}
						</div>
					</CardContent>
				</Card>
			)
		} else if (moderationLog.itemType === 'USER') {
			return (
				<Card className="mb-4">
					<CardHeader>
						<CardTitle>User Profile</CardTitle>
						<CardDescription>
							Account created on {formatDate(moderatedItem.createdAt)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div>
								<span className="font-medium">Name:</span> {moderatedItem.name}
							</div>
							<div>
								<span className="font-medium">Username:</span> @{moderatedItem.username}
							</div>
							{isAdmin && (
								<div>
									<span className="font-medium">Email:</span> {moderatedItem.email}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)
		} else if (moderationLog.itemType === 'MESSAGE') {
			return (
				<Card className="mb-4">
					<CardHeader>
						<CardTitle>Message</CardTitle>
						<CardDescription>
							Sent by{' '}
							<Link to={`/users/${moderatedItem.sender.username}`} className="font-medium hover:underline">
								{moderatedItem.sender.name}
							</Link>{' '}
							to{' '}
							{moderatedItem.recipient ? (
								<Link to={`/users/${moderatedItem.recipient.username}`} className="font-medium hover:underline">
									{moderatedItem.recipient.name}
								</Link>
							) : (
								'a group'
							)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="whitespace-pre-wrap">{moderatedItem.content}</p>
						<div className="mt-4">
              <span className="text-sm text-muted-foreground">
                Sent on {formatDate(moderatedItem.createdAt)}
              </span>
						</div>
					</CardContent>
				</Card>
			)
		}

		return null
	}

	return (
		<div className="container mx-auto py-8 max-w-3xl">
			<div className="mb-4">
				<Link to="/admin/moderation" className="text-sm font-medium text-primary hover:underline">
					← Back to Moderation Dashboard
				</Link>
			</div>

			<h1 className="mb-6 text-3xl font-bold">Moderation Action Details</h1>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Moderation Action</CardTitle>
					<CardDescription>
						Performed on {formatDate(moderationLog.createdAt)}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div>
							<span className="font-medium">Action:</span>{' '}
							<Badge variant={getActionColor(moderationLog.action)}>
								{getActionLabel(moderationLog.action)}
							</Badge>
						</div>
						<div>
							<span className="font-medium">Item Type:</span>{' '}
							<Badge variant="outline">{getItemTypeLabel(moderationLog.itemType)}</Badge>
						</div>
						<div>
							<span className="font-medium">Moderator:</span>{' '}
							<Link to={`/users/${moderationLog.moderator.username}`} className="hover:underline">
								{moderationLog.moderator.name}
							</Link>
						</div>
						{moderationLog.reason && (
							<div>
								<span className="font-medium">Reason:</span>
								<p className="mt-1 whitespace-pre-wrap text-muted-foreground">
									{moderationLog.reason}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{moderationLog.report && (
				<>
					<h2 className="mb-4 text-xl font-bold">Associated Report</h2>
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Report Details</CardTitle>
							<CardDescription>
								Reported on {formatDate(moderationLog.report.createdAt)}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<span className="font-medium">Reported By:</span>{' '}
									<Link to={`/users/${moderationLog.report.reportedBy.username}`} className="hover:underline">
										{moderationLog.report.reportedBy.name}
									</Link>
								</div>
								<div>
									<span className="font-medium">Reason:</span>{' '}
									<Badge>{moderationLog.report.reason}</Badge>
								</div>
								{moderationLog.report.description && (
									<div>
										<span className="font-medium">Description:</span>
										<p className="mt-1 whitespace-pre-wrap text-muted-foreground">
											{moderationLog.report.description}
										</p>
									</div>
								)}
								<div>
									<span className="font-medium">Status:</span>{' '}
									<Badge variant="outline">{moderationLog.report.status}</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				</>
			)}

			<h2 className="mb-4 text-xl font-bold">Moderated Content</h2>
			{renderModeratedItem()}

			<div className="mt-8 flex justify-end">
				<Link to="/admin/moderation">
					<Button variant="outline">Back to Moderation Dashboard</Button>
				</Link>
			</div>
		</div>
	)
}
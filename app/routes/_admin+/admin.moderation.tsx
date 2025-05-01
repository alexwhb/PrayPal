import { type ModerationType, type ModeratorAction } from '@prisma/client'
import { data, Form, Link, useLoaderData } from 'react-router'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table.tsx'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '#app/components/ui/tabs.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { formatDate } from '#app/utils/formatter.ts'


export async function loader({ request }: { request: Request }) {
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

	// Get all moderation logs with related data
	const moderationLogs = await prisma.moderationLog.findMany({
		include: {
			moderator: {
				select: {
					id: true,
					name: true,
					username: true,
				},
			},
			report: true,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})

	// Get pending reports
	const pendingReports = await prisma.report.findMany({
		where: {
			status: 'PENDING',
		},
		include: {
			reportedBy: {
				select: {
					id: true,
					name: true,
					username: true,
				},
			},
		},
		orderBy: {
			createdAt: 'desc',
		},
	})

	return data({
		moderationLogs,
		pendingReports,
		isAdmin: user?.roles.some(role => role.name === 'admin') ?? false,
	})
}

export async function action({ request }: { request: Request }) {
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

	const formData = await request.formData()
	const action = formData.get('_action')

	if (action === 'resolveReport') {
		const reportId = formData.get('reportId') as string
		const resolution = formData.get('resolution') as string
		const moderatorAction = formData.get('moderatorAction') as ModeratorAction
		const itemId = formData.get('itemId') as string
		const itemType = formData.get('itemType') as ModerationType

		// Create moderation log
		const moderationLog = await prisma.moderationLog.create({
			data: {
				moderatorId: userId,
				itemId,
				itemType,
				action: moderatorAction,
				reason: resolution || 'Moderation action',
				report: {
					connect: {
						id: reportId,
					},
				},
			},
		})

		// Update report status
		await prisma.report.update({
			where: { id: reportId },
			data: {
				status: 'RESOLVED',
				resolution,
				resolvedById: userId,
				resolvedAt: new Date(),
			},
		})

		// Take action on the item based on moderatorAction
		if (moderatorAction === 'DELETE') {
			if (itemType === 'PRAYER' || itemType === 'NEED') {
				await prisma.request.delete({ where: { id: itemId } })
			} else if (itemType === 'GROUP') {
				await prisma.group.update({
					where: { id: itemId },
					data: { active: false }
				})
			} else if (itemType === 'SHARE_ITEM') {
				await prisma.shareItem.delete({ where: { id: itemId } })
			} else if (itemType === 'USER') {
				await prisma.user.delete({ where: { id: itemId } })
			}
		} else if (moderatorAction === 'HIDE' || moderatorAction === 'FLAG') {
			if (itemType === 'PRAYER' || itemType === 'NEED') {
				await prisma.request.update({
					where: { id: itemId },
					data: {
						status: 'REMOVED',
						flagged: moderatorAction === 'FLAG'
					}
				})
			} else if (itemType === 'SHARE_ITEM') {
				await prisma.shareItem.update({
					where: { id: itemId },
					data: {
						status: 'REMOVED',
						flagged: moderatorAction === 'FLAG'
					}
				})
			}
		} else if (moderatorAction === 'RESTORE') {
			if (itemType === 'PRAYER' || itemType === 'NEED') {
				await prisma.request.update({
					where: { id: itemId },
					data: {
						status: 'ACTIVE',
						flagged: false
					}
				})
			} else if (itemType === 'GROUP') {
				await prisma.group.update({
					where: { id: itemId },
					data: { active: true }
				})
			} else if (itemType === 'SHARE_ITEM') {
				await prisma.shareItem.update({
					where: { id: itemId },
					data: {
						status: 'ACTIVE',
						flagged: false
					}
				})
			}
		}

		return data({ success: true })
	}

	if (action === 'dismissReport') {
		const reportId = formData.get('reportId') as string

		await prisma.report.update({
			where: { id: reportId },
			data: {
				status: 'DISMISSED',
				resolvedById: userId,
				resolvedAt: new Date(),
				resolution: 'Dismissed by moderator',
			},
		})

		return data({ success: true })
	}

	return null
}

function getItemTypeLabel(type: ModerationType) {
	const labels = {
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
	const labels = {
		DELETE: 'Deleted',
		FLAG: 'Flagged',
		HIDE: 'Hidden',
		RESTORE: 'Restored',
	}
	return labels[action] || action
}

export default function ModerationView() {
	const { moderationLogs, pendingReports, isAdmin } = useLoaderData<typeof loader>()

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-6 text-3xl font-bold">Moderation Dashboard</h1>

			<Tabs defaultValue="pending">
				<TabsList className="mb-4">
					<TabsTrigger value="pending">Pending Reports ({pendingReports.length})</TabsTrigger>
					<TabsTrigger value="history">Moderation History</TabsTrigger>
				</TabsList>

				<TabsContent value="pending">
					<Card>
						<CardHeader>
							<CardTitle>Pending Reports</CardTitle>
							<CardDescription>
								Review and take action on reported content
							</CardDescription>
						</CardHeader>
						<CardContent>
							{pendingReports.length === 0 ? (
								<p className="text-center text-muted-foreground py-4">
									No pending reports to review
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Type</TableHead>
											<TableHead>Reported By</TableHead>
											<TableHead>Reason</TableHead>
											<TableHead>Date</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pendingReports.map(report => (
											<TableRow key={report.id}>
												<TableCell>
													<Badge variant="outline">
														{getItemTypeLabel(report.itemType as ModerationType)}
													</Badge>
												</TableCell>
												<TableCell>
													<Link
														to={`/users/${report.reportedBy.username}`}
														className="hover:underline"
													>
														{report.reportedBy.name}
													</Link>
												</TableCell>
												<TableCell>
													<div>
														<Badge>{report.reason}</Badge>
														{report.description && (
															<p className="text-sm text-muted-foreground mt-1">
																{report.description}
															</p>
														)}
													</div>
												</TableCell>
												<TableCell>{formatDate(report.createdAt)}</TableCell>
												<TableCell>
													<div className="flex gap-2">
														<Link
															to={`/admin/moderation/review/${report.id}`}
															className="text-sm font-medium text-primary hover:underline"
														>
															<Button size="sm">Review</Button>
														</Link>
														<Form method="post">
															<input type="hidden" name="_action" value="dismissReport" />
															<input type="hidden" name="reportId" value={report.id} />
															<Button size="sm" variant="outline">Dismiss</Button>
														</Form>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="history">
					<Card>
						<CardHeader>
							<CardTitle>Moderation History</CardTitle>
							<CardDescription>
								View past moderation actions
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Moderator</TableHead>
										<TableHead>Action</TableHead>
										<TableHead>Item Type</TableHead>
										<TableHead>Reason</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Details</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{moderationLogs.map(log => (
										<TableRow key={log.id}>
											<TableCell>
												<Link
													to={`/users/${log.moderator.username}`}
													className="hover:underline"
												>
													{log.moderator.name}
												</Link>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														log.action === 'DELETE' ? 'destructive' :
															log.action === 'RESTORE' ? 'default' : 'outline'
													}
												>
													{getActionLabel(log.action)}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge variant="outline">
													{getItemTypeLabel(log.itemType)}
												</Badge>
											</TableCell>
											<TableCell className="max-w-xs truncate">
												{log.reason || 'No reason provided'}
											</TableCell>
											<TableCell>{formatDate(log.createdAt)}</TableCell>
											<TableCell>
												<Link
													to={`/admin/moderation/details/${log.id}`}
													className="text-sm font-medium text-primary hover:underline"
												>
													<Button size="sm" variant="outline">View Details</Button>
												</Link>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
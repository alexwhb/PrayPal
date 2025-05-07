import { type ModerationType, type ModeratorAction } from '@prisma/client'
import { data, useLoaderData } from 'react-router'
import { Badge } from '#app/components/ui/badge.tsx'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '#app/components/ui/tabs.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { formatDate } from '#app/utils/formatter.ts'
import { PendingReportsTab } from './components/moderation/pending-reports-tab.tsx'
import { ModerationHistoryTab } from './components/moderation/moderation-history-tab.tsx'

export async function loader({ request }: { request: Request }) {
	const userId = await requireUserId(request)

	// Check if user is a moderator or admin
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { roles: true },
	})

	const isModOrAdmin =
		user?.roles.some((role) => ['admin', 'moderator'].includes(role.name)) ??
		false

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
		isAdmin: user?.roles.some((role) => role.name === 'admin') ?? false,
	})
}

export async function action({ request }: { request: Request }) {
	const userId = await requireUserId(request)

	// Check if user is a moderator or admin
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { roles: true },
	})

	const isModOrAdmin =
		user?.roles.some((role) => ['admin', 'moderator'].includes(role.name)) ??
		false

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
					data: { active: false },
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
					},
				})
			} else if (itemType === 'SHARE_ITEM') {
				await prisma.shareItem.update({
					where: { id: itemId },
					data: {
						status: 'REMOVED',
					},
				})
			}
		} else if (moderatorAction === 'RESTORE') {
			if (itemType === 'PRAYER' || itemType === 'NEED') {
				await prisma.request.update({
					where: { id: itemId },
					data: {
						status: 'ACTIVE',
					},
				})
			} else if (itemType === 'GROUP') {
				await prisma.group.update({
					where: { id: itemId },
					data: { active: true },
				})
			} else if (itemType === 'SHARE_ITEM') {
				await prisma.shareItem.update({
					where: { id: itemId },
					data: {
						status: 'ACTIVE',
					},
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

export { getItemTypeLabel, getActionLabel }

export default function ModerationView() {
	const { moderationLogs, pendingReports, isAdmin } = useLoaderData<typeof loader>()

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-6 text-3xl font-bold">Moderation Dashboard</h1>

			<Tabs defaultValue="pending">
				<TabsList className="mb-4">
					<TabsTrigger value="pending">
						Pending Reports ({pendingReports.length})
					</TabsTrigger>
					<TabsTrigger value="history">Moderation History</TabsTrigger>
				</TabsList>

				<TabsContent value="pending">
					<PendingReportsTab pendingReports={pendingReports} />
				</TabsContent>

				<TabsContent value="history">
					<ModerationHistoryTab moderationLogs={moderationLogs} />
				</TabsContent>
			</Tabs>
		</div>
	)
}
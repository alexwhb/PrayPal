import { type $Enums, type Notification } from '@prisma/client'
import { Bell, MessageSquare, UserPlus, CheckCircle } from 'lucide-react'
import { data, Link } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'
import { Card, CardContent } from '#app/components/ui/card.tsx'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '#app/components/ui/tabs.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { formatDate } from '#app/utils/formatter.ts'
import { type Route } from './+types/notifications'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)

	// Fetch notifications from the database
	const notifications = await prisma.notification.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					username: true,
					image: { select: { id: true } }
				}
			}
		}
	})

	// Mark all as read
	await prisma.notification.updateMany({
		where: { userId, read: false },
		data: { read: true, readAt: new Date() },
	})

	return data({
		notifications,
		unreadCount: notifications.filter((n) => !n.read).length,
	})
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const action = formData.get('_action')

	if (action === 'markAllAsRead') {
		await prisma.notification.updateMany({
			where: { userId, read: false },
			data: { read: true, readAt: new Date() },
		})

		return data({ success: true })
	}

	if (action === 'clearAll') {
		await prisma.notification.deleteMany({
			where: { userId },
		})

		return data({ success: true })
	}

	return null
}

// Helper function to get notification icon based on type
const getNotificationIcon = (type: $Enums.NotificationType) => {
	switch (type) {
		case 'MESSAGE_RECEIVED':
			return <MessageSquare className="h-5 w-5 text-blue-500" />
		case 'GROUP_JOIN_REQUEST':
		case 'GROUP_APPROVED':
		case 'GROUP_REJECTED':
			return <UserPlus className="h-5 w-5 text-purple-500" />
		case 'SHARE_ITEM_REQUEST':
		case 'SHARE_ITEM_APPROVED':
		case 'SHARE_ITEM_REJECTED':
			return <CheckCircle className="h-5 w-5 text-green-500" />
		case 'SYSTEM_ANNOUNCEMENT':
		case 'OTHER':
		default:
			return <Bell className="h-5 w-5 text-gray-500" />
	}
}

export default function NotificationsPage({
	loaderData,
}: Route.ComponentProps) {
	const { notifications } = loaderData

	const allNotifications = notifications
	const unreadNotifications = notifications.filter((n) => !n.read)

	return (
		<div className="container py-8">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Notifications</h1>
				<div className="flex gap-2">
					<form method="post">
						<input type="hidden" name="_action" value="markAllAsRead" />
						<Button type="submit" variant="outline">
							Mark all as read
						</Button>
					</form>
					<form method="post">
						<input type="hidden" name="_action" value="clearAll" />
						<Button type="submit" variant="outline">
							Clear all
						</Button>
					</form>
				</div>
			</div>

			<Tabs defaultValue="all">
				<TabsList className="mb-6">
					<TabsTrigger value="all">All ({allNotifications.length})</TabsTrigger>
					<TabsTrigger value="unread">
						Unread ({unreadNotifications.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all">
					<NotificationList notifications={allNotifications} />
				</TabsContent>

				<TabsContent value="unread">
					<NotificationList notifications={unreadNotifications} />
				</TabsContent>
			</Tabs>
		</div>
	)
}

// Updated to match the actual Notification schema
function NotificationList({ notifications }: { notifications: Array<Notification & { user: any }> }) {
	if (notifications.length === 0) {
		return (
			<div className="rounded-lg border p-8 text-center">
				<p className="text-muted-foreground">No notifications found.</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{notifications.map((notification) => (
				<Card
					key={notification.id}
					className={notification.read ? '' : 'border-l-4 border-l-blue-500'}
				>
					<CardContent className="p-4">
						<div className="flex items-start gap-4">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
								{getNotificationIcon(notification.type)}
							</div>

							<div className="flex-1">
								<div className="flex items-start justify-between">
									<div>
										<h3 className="font-medium">{notification.title}</h3>
										<p className="mt-1 text-sm text-muted-foreground">
											{notification.description}
										</p>
									</div>
									<p className="text-xs text-muted-foreground">
										{formatDate(notification.createdAt)}
									</p>
								</div>

								{notification.actionUrl && (
									<div className="mt-2">
										<Link to={notification.actionUrl}>
											<Button variant="outline" size="sm">
												View
											</Button>
										</Link>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	)
}

import { Outlet } from 'react-router'
import LayoutMainApp from '#app/components/layout-main-app.tsx'
import { useTheme } from '#app/routes/resources+/theme-switch.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useOptionalUser } from '#app/utils/user'
import { type Route } from './+types/_app+/_layout.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)

	// Fetch recent notifications
	const notifications = await prisma.notification.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' },
		take: 5
	})

	// Get unread count
	const unreadCount = await prisma.notification.count({
		where: { userId, read: false }
	})

	return {
		notifications,
		unreadCount
	}
}

export default function AppLayout({loaderData}: Route.ComponentProps) {
	const { notifications, unreadCount } = loaderData
	const user = useOptionalUser()
	const theme = useTheme()

	return (
		<LayoutMainApp theme={theme} user={user} notifications={notifications} unreadCount={unreadCount}>
			<Outlet />
		</LayoutMainApp>
	)
}
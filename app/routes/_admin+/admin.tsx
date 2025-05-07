// TODO. This will be really mostly just a panel where you can see the current
// stats of the app, such as how many users are registered, how many posts are
// created, etc. Oh there should also be a view where the admin can modify the
// available categories for prayers and needs.

// There should also be a site settings page where the admin can modify
// things like, the sites name... they should also be able to change things like
// are users automatically allowed to post once an account has been created? Or
// do they need to be approved by an admin first? Since this is potentially
// just for a single small church body, that should be quite possible, and
// would massively reduce the amount of spam that gets posted.

import { Outlet, redirect } from 'react-router'
import LayoutAdmin from '#app/components/admin/layout-admin.tsx'
import { useTheme } from '#app/routes/resources+/theme-switch.tsx'
import { logout, requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'
import { type Route } from './+types/admin.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { roles: true },
	})
	if (!user || !user.roles.some((role) => role.name === 'admin')) {
		await logout({ request, redirectTo: '/' })
	} else {
		const url = new URL(request.url)
		if (url.pathname === '/admin') {
			return redirect('/admin/dashboard')
		}
	}
}

export default function Admin() {
	const user = useOptionalUser()
	const theme = useTheme()

	return (
		<LayoutAdmin theme={theme} user={user}>
			<Outlet />
		</LayoutAdmin>
	)
}

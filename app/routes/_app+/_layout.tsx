import { Outlet } from 'react-router'
import LayoutMainApp from '#app/components/layout-main-app.tsx'
import { useTheme } from '#app/routes/resources+/theme-switch.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { useOptionalUser } from '#app/utils/user'
import { type Route } from './+types/_app+/_layout.ts'

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserId(request)
  return null
}

export default function AppLayout() {
  const user = useOptionalUser()
  const theme = useTheme()

  return (
    <LayoutMainApp theme={theme} user={user}>
      <Outlet />
    </LayoutMainApp>
  )
}
import { type User } from '@prisma/client'

import ProfileDropdown from '#app/components/profile-dropdown.tsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '#app/components/ui/dropdown-menu.tsx'
import { ThemeSwitch } from '#app/routes/resources+/theme-switch.tsx'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { getHighestRole } from '#app/utils/roles.ts'
import { type Theme } from '#app/utils/theme.server.ts'
import { Icon } from '#app/components/ui/icon.tsx'

type RequiredUser = User & {
  image: { id: string } | null
  roles: Array<{ name: string }>
}

interface TopNavProps {
  theme: Theme | null
  user: RequiredUser
}

export default function TopNav({ theme, user }: TopNavProps) {
  const userImageSrc = getUserImgSrc(user.image?.id)
  const highestRole = getHighestRole(user.roles)

  return (
    <nav className="px-3 sm:px-6 flex items-center justify-between border-b h-full">
      <div>Admin</div>
      <div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0">
        <button
          type="button"
          className="p-1.5 sm:p-2 rounded-full transition-colors"
        >
					<Icon name="bell" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
        </button>

        <ThemeSwitch userPreference={theme} />

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <img
              src={userImageSrc}
              alt={`${user.name}'s avatar`}
              width={28}
              height={28}
              className="rounded-full ring-2 ring-gray-200 dark:ring-[#2B2B30] sm:w-8 sm:h-8 cursor-pointer"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[280px] sm:w-80 bg-background border-border rounded-lg shadow-lg"
          >
            <ProfileDropdown 
              avatar={userImageSrc} 
              role={highestRole}
							username={user.username}
              name={user.name}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
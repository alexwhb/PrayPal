import { type User } from '@prisma/client'
import { Bell } from "lucide-react"
import ProfileDropdown from '#app/components/profile-dropdown.tsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '#app/components/ui/dropdown-menu.tsx'
import { ThemeSwitch } from '#app/routes/resources+/theme-switch.tsx'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import  { type Theme } from '#app/utils/theme.server.ts'


export default function TopNav({theme, user}: {theme: Theme | null, user: User | null}) {
	return (
		// bg-white dark:bg-[#0F0F12]  border-gray-200 dark:border-[#1F1F23]
		<nav className="px-3 sm:px-6 flex items-center justify-between  border-b  h-full">
			<div></div>
			{/*hover:bg-gray-100 dark:hover:bg-[#1F1F23] */}
			<div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0">
				<button
					type="button"
					className="p-1.5 sm:p-2 rounded-full transition-colors"
				>
					<Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
				</button>

				<ThemeSwitch userPreference={theme} />

				<DropdownMenu>
					<DropdownMenuTrigger className="focus:outline-none">
						<img
							src={getUserImgSrc(user?.image?.id)}
							alt="User avatar"
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
						{/* TODO role 1 should't be how we get the user role. */}
						<ProfileDropdown avatar={getUserImgSrc(user?.image?.id)} role={user.roles[1].name} name={user?.name}/>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</nav>
	)
}
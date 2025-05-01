import { FileText, LogOut, MoveUpRight, Settings } from 'lucide-react'
import { Form, Link } from 'react-router'
import { DropdownMenuItem } from '#app/components/ui/dropdown-menu.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar.tsx'
import { getUserImgSrc } from '#app/utils/misc.tsx'

interface MenuItem {
	label: string
	value?: string
	href: string
	icon?: React.ReactNode
	external?: boolean
}

interface ProfileProps {
	name: string
	role: string
	username: string
	avatar: string
}

export default function ProfileDropdown({
	name,
	username,
	role,
	avatar,
}: Partial<ProfileProps>) {
	const menuItems: MenuItem[] = [
		{
			label: 'Settings',
			href: '/settings/profile',
			icon: <Settings className="h-4 w-4" />,
		},
		{
			label: 'Terms & Policies',
			href: '/tos',
			icon: <FileText className="h-4 w-4" />,
			external: true,
		},
	]

	return (
		<div className="mx-auto w-full max-w-sm">
			<div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
				<div className="relative px-6 pb-6 pt-12">
					<Link to={`/users/${username}`} prefetch="intent">
					<div className="mb-8 flex items-center gap-4">
						<div className="relative shrink-0">
								<Avatar>
									<AvatarImage
										src={avatar}
										alt={name}
									/>
									<AvatarFallback>
										{name.charAt(0)}
									</AvatarFallback>
								</Avatar>
							<div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
						</div>

						{/* Profile Info */}
						<div className="flex-1">
							<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
								{name}
							</h2>
							<p className="text-zinc-600 dark:text-zinc-400">{role}</p>
						</div>
					</div>
					</Link>
					<div className="my-6 h-px bg-zinc-200 dark:bg-zinc-800" />
					<div className="space-y-2">
						{menuItems.map((item) => (
							<Link
								key={item.label}
								to={item.href}
								prefetch="intent"
								className="flex items-center justify-between rounded-lg p-2 transition-colors duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
							>
								<div className="flex items-center gap-2">
									{item.icon}
									<span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
										{item.label}
									</span>
								</div>
								<div className="flex items-center">
									{item.value && (
										<span className="mr-2 text-sm text-zinc-500 dark:text-zinc-400">
											{item.value}
										</span>
									)}
									{item.external && <MoveUpRight className="h-4 w-4" />}
								</div>
							</Link>
						))}

						<Form method="POST" action="/logout">
							<DropdownMenuItem asChild>
								<button type="submit" className="w-full">
									<Icon className="text-body-md" name="exit">
										Logout
									</Icon>
								</button>
							</DropdownMenuItem>
						</Form>
					</div>
				</div>
			</div>
		</div>
	)
}

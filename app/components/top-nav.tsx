import { type User } from '@prisma/client'
import { Bell, CheckCircle, MessageSquare, UserPlus } from "lucide-react"
import { Link } from 'react-router'
import ProfileDropdown from '#app/components/profile-dropdown.tsx'
import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '#app/components/ui/dropdown-menu.tsx'
import { ScrollArea } from '#app/components/ui/scroll-area.tsx'
import { ThemeSwitch } from '#app/routes/resources+/theme-switch.tsx'
import { formatDistanceToNow } from '#app/utils/formatter.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { getHighestRole } from '#app/utils/roles.ts'
import { type Theme } from '#app/utils/theme.server.ts'

type RequiredUser = User & {
	image: { id: string } | null
	roles: Array<{ name: string }>
}

interface TopNavProps {
	theme: Theme | null
	user: RequiredUser
	notifications?: Array<{
		id: string
		type: 'MESSAGE' | 'PRAYER' | 'FRIEND_REQUEST' | 'GROUP_INVITE'
		title: string
		message: string
		createdAt: string
		read: boolean
		sender?: {
			id: string
			name: string
			username: string
			image?: { id: string } | null
		}
	}>
	unreadCount?: number
}

export default function TopNav({ theme, user, notifications = [], unreadCount = 0 }: TopNavProps) {
	const userImageSrc = getUserImgSrc(user.image?.id)
	const highestRole = getHighestRole(user.roles)

	// Helper function to get notification icon based on type
	const getNotificationIcon = (type: string) => {
		switch (type) {
			case 'MESSAGE':
				return <MessageSquare className="h-4 w-4 text-blue-500" />;
			case 'PRAYER':
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case 'FRIEND_REQUEST':
			case 'GROUP_INVITE':
				return <UserPlus className="h-4 w-4 text-purple-500" />;
			default:
				return <Bell className="h-4 w-4 text-gray-500" />;
		}
	};

	return (
		<nav className="px-3 sm:px-6 flex items-center justify-between border-b h-full">
			<div></div>
			<div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="relative p-1.5 sm:p-2 rounded-full transition-colors"
						>
							<Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
							{unreadCount > 0 && (
								<span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500">
                  <span className="sr-only">{unreadCount} unread notifications</span>
                </span>
							)}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[350px]">
						<DropdownMenuLabel>Notifications</DropdownMenuLabel>
						<DropdownMenuSeparator />

						{notifications.length > 0 ? (
							<>
								<ScrollArea className="h-[300px]">
									<DropdownMenuGroup>
										{notifications.slice(0, 5).map((notification) => (
											<DropdownMenuItem key={notification.id} asChild>
												<Link
													to={`/notifications/${notification.id}`}
													className="flex items-start gap-3 p-3 cursor-pointer"
												>
													{notification.sender ? (
														<Avatar className="h-8 w-8">
															<AvatarImage
																src={getUserImgSrc(notification.sender.image?.id)}
																alt={notification.sender.name}
															/>
															<AvatarFallback>
																{notification.sender.name.charAt(0)}
															</AvatarFallback>
														</Avatar>
													) : (
														<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
															{getNotificationIcon(notification.type)}
														</div>
													)}

													<div className="flex-1 space-y-1">
														<div className="flex items-center justify-between">
															<p className="text-sm font-medium">
																{notification.title}
															</p>
															<p className="text-xs text-muted-foreground">
																{formatDistanceToNow(notification.createdAt)}
															</p>
														</div>
														<p className="text-xs text-muted-foreground line-clamp-2">
															{notification.message}
														</p>
													</div>

													{!notification.read && (
														<div className="h-2 w-2 rounded-full bg-blue-500" />
													)}
												</Link>
											</DropdownMenuItem>
										))}
									</DropdownMenuGroup>
								</ScrollArea>

								<DropdownMenuSeparator />
								<DropdownMenuItem asChild className="justify-center">
									<Link to="/notifications" className="w-full text-center">
										See all notifications
									</Link>
								</DropdownMenuItem>
							</>
						) : (
							<div className="p-4 text-center text-muted-foreground">
								<p>No notifications yet</p>
							</div>
						)}
					</DropdownMenuContent>
				</DropdownMenu>

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
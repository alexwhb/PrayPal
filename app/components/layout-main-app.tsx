// import { useTheme } from "next-themes"
import { type User } from '@prisma/client'
import  { type ReactNode, useEffect, useState  } from "react"
import  { type Theme } from '#app/utils/theme.server.ts'
import Sidebar from "./sidebar"
import TopNav from "./top-nav"

export type Notification = {
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
}


interface LayoutProps {
	children: ReactNode,
	userPrefs: any,
	user: User | null
	notifications?: Array<Notification>
	unreadCount?: number
}

export default function LayoutMainApp({ children, userPrefs, user, notifications, unreadCount}: LayoutProps) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		return null
	}

	return (
		<div className={`flex h-screen `}>
			<Sidebar />
			<div className="w-full flex flex-1 flex-col">
				<header className="h-16 border-b border-gray-200 dark:border-[#1F1F23]">
					<TopNav userPrefs={userPrefs} user={user} notifications={notifications} unreadCount={unreadCount}/>
				</header>
				<main className="flex-1 overflow-auto p-6 bg-white dark:bg-[#0F0F12]">{children}</main>
			</div>
		</div>
	)
}
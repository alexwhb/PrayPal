// import { useTheme } from "next-themes"
import  { type ReactNode, useEffect, useState  } from "react"
import  { type Theme } from '#app/utils/theme.server.ts'
import Sidebar from "./sidebar"
import TopNav from "./top-nav"
import { type User } from '@prisma/client'

interface LayoutProps {
	children: ReactNode,
	theme: Theme | null,
	user: User | null
}

export default function LayoutMainApp({ children, theme, user }: LayoutProps) {
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
					<TopNav theme={theme} user={user} />
				</header>
				<main className="flex-1 overflow-auto p-6 bg-white dark:bg-[#0F0F12]">{children}</main>
			</div>
		</div>
	)
}
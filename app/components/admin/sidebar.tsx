import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Icon } from '#app/components/ui/icon.tsx'

export default function Sidebar() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const location = useLocation()

	function handleNavigation() {
		setIsMobileMenuOpen(false)
	}

	function NavItem({
										 href,
										 icon,
										 children,
									 }: {
		href: string
		icon: React.ReactNode
		children: React.ReactNode
	}) {
		const isActive = location.pathname.startsWith(href)
		
		return (
			<Link
				to={href}
				className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
					isActive 
						? 'bg-gray-50 text-gray-900 dark:bg-[#1F1F23] dark:text-white' 
						: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-[#1F1F23] dark:hover:text-white'
				}`}
				prefetch="intent"
			>
				<Icon className={`mr-3 h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-500 dark:text-blue-400' : ''}`} />
				{children}
			</Link>
		)
	}

	return (
		<>
			<button
				type="button"
				className="fixed left-4 top-4 z-[10] rounded-lg bg-white p-2 shadow-md dark:bg-[#000000] lg:hidden"
				onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
			>
				<Icon name="menu" className="h-5 w-5 text-gray-600 dark:text-gray-300" />
			</button>
			<nav
				className={`fixed inset-y-0 left-0 z-[10] w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out dark:border-[#1F1F23] dark:bg-[#000000] lg:static lg:w-64 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} `}
			>
				<div className="flex h-full flex-col">
					<Link
						to="/admin"
						className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-[#1F1F23]"
					>
						<div className="flex items-center gap-3">
							<img
								src="https://kokonutui.com/logo.svg"
								alt="Acme"
								width={32}
								height={32}
								className="hidden flex-shrink-0 dark:block"
							/>
							<img
								src="https://kokonutui.com/logo-black.svg"
								alt="Acme"
								width={32}
								height={32}
								className="block flex-shrink-0 dark:hidden"
							/>
							<span className="text-lg font-semibold text-gray-900 hover:cursor-pointer dark:text-white">
								PrayPal
							</span>
						</div>
					</Link>

					<div className="flex-1 overflow-y-auto px-4 py-4">
						<div className="space-y-6">
							<div>
								<div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
									Admin
								</div>
								<div className="space-y-1">
									<NavItem href="/admin/dashboard" icon={<Icon name="bar-chart-2" />}>
										Main Dashboard
									</NavItem>
									<NavItem href="/admin/category-edit" icon={<Icon name="folder-tree" />}>
										Category Editor
									</NavItem>
									<NavItem href="/admin/moderation" icon={<Icon name="shield-alert" />}>
										Moderation
									</NavItem>
									<NavItem href="/admin/roles" icon={<Icon name="user-cog" />}>
										Role Editor
									</NavItem>
									<NavItem href="/admin/help-faqs" icon={<Icon name="help-circle" />}>
										Help FAQs
									</NavItem>
								</div>
							</div>

							<div>
								<div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
									Advanced
								</div>
								<div className="space-y-1">
									<NavItem href="/admin/cache" icon={<Icon name="users-2" />}>
										Cache Editor
									</NavItem>

								</div>
							</div>
						</div>
					</div>

					{/*<div className="border-t border-gray-200 px-4 py-4 dark:border-[#1F1F23]">*/}
					{/*	<div className="space-y-1">*/}
					{/*		/!*<NavItem href="#" icon={Settings}>*!/*/}
					{/*		/!*	Settings*!/*/}
					{/*		/!*</NavItem>*!/*/}
					{/*		/!*<NavItem href="/help" icon={HelpCircle}>*!/*/}
					{/*		/!*	Help*!/*/}
					{/*		/!*</NavItem>*!/*/}
					{/*	</div>*/}
					{/*</div>*/}
				</div>
			</nav>

			{isMobileMenuOpen && (
				<div
					className="fixed inset-0 z-[65] bg-black bg-opacity-50 lg:hidden"
					onClick={() => setIsMobileMenuOpen(false)}
				/>
			)}
		</>
	)
}

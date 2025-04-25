import { useEffect, useState } from 'react'
import {
	data,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useMatches,
} from 'react-router'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { type Socket } from 'socket.io-client'
import LayoutMainApp from '#app/components/layout.tsx'
import { connect, SocketContext } from '#app/utils/socket'
import logoIcon from '../public/podcasty.svg'
import { type Route } from './+types/root.ts'
import appleTouchIconAssetUrl from './assets/favicons/apple-touch-icon.png'
import faviconAssetUrl from './assets/favicons/favicon.svg'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { EpicProgress } from './components/progress-bar.tsx'
import { SearchBar } from './components/search-bar.tsx'
import { href as iconsHref } from './components/ui/icon.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import { UserDropdown } from './components/user-dropdown.tsx'
import {
	useOptionalTheme,
	useTheme,
} from './routes/resources+/theme-switch.tsx'
import tailwindStyleSheetUrl from './styles/tailwind.css?url'
import { getUserId, logout } from './utils/auth.server.ts'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { prisma } from './utils/db.server.ts'
import { getEnv } from './utils/env.server.ts'
import { pipeHeaders } from './utils/headers.server.ts'
import { honeypot } from './utils/honeypot.server.ts'
import { combineHeaders, getDomainUrl } from './utils/misc.tsx'
import { useNonce } from './utils/nonce-provider.ts'
import { getTheme, type Theme } from './utils/theme.server.ts'
import { makeTimings, time } from './utils/timing.server.ts'
import { getToast } from './utils/toast.server.ts'
import { useOptionalUser } from './utils/user.ts'

export const links: Route.LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		{ rel: 'preload', href: iconsHref, as: 'image' },
		{
			rel: 'icon',
			href: '/favicon.ico',
			sizes: '48x48',
		},
		{ rel: 'icon', type: 'image/svg+xml', href: faviconAssetUrl },
		{ rel: 'apple-touch-icon', href: appleTouchIconAssetUrl },
		{
			rel: 'manifest',
			href: '/site.webmanifest',
			crossOrigin: 'use-credentials',
		} as const, // necessary to make typescript happy
		{ rel: 'stylesheet', href: tailwindStyleSheetUrl },
	].filter(Boolean)
}

export const meta: Route.MetaFunction = ({ data }) => {
	return [
		{ title: data ? 'Podcasty' : 'Error | Podcasty' },
		{
			name: 'description',
			content: `Your one stop shop for hosting your own podcast`,
		},
	]
}

export async function loader({ request }: Route.LoaderArgs) {
	const timings = makeTimings('root loader')
	const userId = await time(() => getUserId(request), {
		timings,
		type: 'getUserId',
		desc: 'getUserId in root',
	})

	const user = userId
		? await time(
				() =>
					prisma.user.findUnique({
						select: {
							id: true,
							name: true,
							username: true,
							image: { select: { id: true } },
							roles: {
								select: {
									name: true,
									permissions: {
										select: { entity: true, action: true, access: true },
									},
								},
							},
						},
						where: { id: userId },
					}),
				{ timings, type: 'find user', desc: 'find user in root' },
			)
		: null
	if (userId && !user) {
		console.info('something weird happened')
		// something weird happened... The user is authenticated but we can't find
		// them in the database. Maybe they were deleted? Let's log them out.
		await logout({ request, redirectTo: '/' })
	}
	const { toast, headers: toastHeaders } = await getToast(request)
	const honeyProps = await honeypot.getInputProps()

	return data(
		{
			user,
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				userPrefs: {
					theme: getTheme(request),
				},
			},
			ENV: getEnv(),
			toast,
			honeyProps,
		},
		{
			headers: combineHeaders(
				{ 'Server-Timing': timings.toString() },
				toastHeaders,
			),
		},
	)
}

export const headers: Route.HeadersFunction = pipeHeaders

function Document({
	children,
	nonce,
	theme = 'light',
	env = {},
}: {
	children: React.ReactNode
	nonce: string
	theme?: Theme
	env?: Record<string, string | undefined>
}) {
	const allowIndexing = ENV.ALLOW_INDEXING !== 'false'
	return (
		<html lang="en" className={`${theme} h-full overflow-x-hidden`}>
			<head>
				<ClientHintCheck nonce={nonce} />
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				{allowIndexing ? null : (
					<meta name="robots" content="noindex, nofollow" />
				)}
				<Links />
			</head>
			<body className="bg-background text-foreground">
				{children}
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

export function Layout({ children }: { children: React.ReactNode }) {
	// if there was an error running the loader, data could be missing
	const data = useLoaderData<typeof loader | null>()
	const nonce = useNonce()
	const theme = useOptionalTheme()
	return (
		<Document nonce={nonce} theme={theme} env={data?.ENV}>
			{children}
		</Document>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const user = useOptionalUser()
	const theme = useTheme()
	const matches = useMatches()
	const isOnSearchPage = matches.find((m) => m.id === 'routes/users+/index')
	// const searchBar = isOnSearchPage ? null : <SearchBar status="idle" />
	const [socket, setSocket] = useState<Socket | undefined>(undefined)

	useEffect(() => {
		// Only create a socket if we have a user and don't already have a socket
		if (user?.id && !socket) {
			console.log('Creating new socket connection for user:', user.id)
			const newSocket = connect()

			// Set up connection handler
			newSocket.on('connect', () => {
				console.log('Socket connected, setting user ID:', user.id)
				newSocket.emit('set-user-id', user.id)
				setSocket(newSocket)
			})

			// Clean up function
			return () => {
				console.log('Cleaning up socket connection')
				if (newSocket.connected) {
					newSocket.disconnect()
				}
			}
		}

		// If we have no user, but we have a socket, disconnect it
		if (!user?.id && socket) {
			console.log('No user found, disconnecting socket')
			socket.disconnect()
			setSocket(undefined)
		}
	}, [socket, user?.id]) // Only depend on user.id, not the socket state

	return (
		<>
			<LayoutMainApp>
				{/*{user && <Header searchBar={searchBar} />}*/}

				<div className="flex-1">
					<SocketProvider socket={socket}>
						<Outlet />
					</SocketProvider>
				</div>

				{/*TODO add this back in, but in the header */}
				{/*<div className="container flex justify-end pb-5">*/}
				{/*	<ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />*/}
				{/*</div>*/}
			</LayoutMainApp>
			<Toaster closeButton position="top-center" theme={theme} />
			<EpicProgress />
		</>
	)
}

function Header({ searchBar }: { searchBar: React.ReactNode }) {
	return (
		<header className="container py-6">
			<nav className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
				<Logo />
				<h1 className="text-2xl font-bold">PrayPal</h1>
				<div className="flex items-center gap-10">
					<UserDropdown />
				</div>
			</nav>
		</header>
	)
}

// provide our Socket.io instance to children views.
function SocketProvider({
	socket,
	children,
}: {
	socket: Socket | undefined
	children: React.ReactNode
}) {
	return (
		<SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
	)
}

function Logo() {
	return (
		<Link to="/" className="group grid leading-snug">
			<img src={logoIcon} alt="" />
		</Link>
	)
}

function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<HoneypotProvider {...data.honeyProps}>
			<App />
		</HoneypotProvider>
	)
}

export default AppWithProviders

// this is a last resort error boundary. There's not much useful information we
// can offer at this level.
export const ErrorBoundary = GeneralErrorBoundary

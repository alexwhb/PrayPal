import { Category } from '@prisma/client'
import {
	Badge,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	HandIcon as PrayingHands,
} from 'lucide-react'
import { type ChangeEvent, useCallback, useState } from 'react'
import { data, Form, Link, useLoaderData, useSearchParams } from 'react-router'
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '#app/components/ui/avatar.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '#app/components/ui/card.tsx'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '#app/components/ui/dialog.tsx'

import { Label } from '#app/components/ui/label.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/prayer'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import ActionArgs = Route.ActionArgs
import { cn } from '#app/lib/utils.ts'

const PAGE_SIZE = 30

export async function loader({ params, request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)

	// Extract query parameters.
	const sort = url.searchParams.get('sort') === 'asc' ? 'asc' : 'desc'
	const page = parseInt(url.searchParams.get('page') || '1', 10)
	const filterParam = url.searchParams.get('filter')
	const activeFilter = filterParam && filterParam !== 'All' ? filterParam : null

	// Build the where clause dynamically
	const where = {
		type: 'PRAYER',
		status: 'ACTIVE',
	} as any

	// Only add category filter if activeFilter is not null and not "All"
	if (activeFilter) {
		where.category = {
			name: activeFilter,
		}
	}

	const [prayerData, totalPrayers] = await prisma.$transaction([
		prisma.request.findMany({
			where,
			select: {
				id: true,
				user: { select: { id: true, name: true, image: true, username: true } },
				category: { select: { name: true } },
				description: true,
				createdAt: true,
				fulfilled: true,
				response: true,
			},
			orderBy: { createdAt: sort },
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
		}),
		prisma.request.count({ where })
	])

	const hasNextPage = totalPrayers > page * PAGE_SIZE

	let filters = await prisma.category.findMany({
		where: { type: 'PRAYER', active: true },
		select: { name: true },
	})

	filters = [{ name: 'All' }, ...filters]
	
	const prayers = prayerData.map((data) => ({
		answered: data.fulfilled,
		answeredMessage:
			data.response &&
			typeof data.response === 'object' &&
			'message' in data.response
				? data.response.message
				: '' as string | null, 
		prayerCount: data.response?.prayerCount ?? 0,
		hasPrayed: data.response?.prayedBy?.includes(userId) ?? false,
		lastUpdatedAt: data.response?.lastUpdatedAt ?? null,
		...data,
	}))
	
	// Return "All" as activeFilter when it's null
	return { prayers, filters, activeFilter: activeFilter || 'All', userId, hasNextPage }
}


export async function action({ request }: ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const prayerId = formData.get('prayerId')
	const intent = formData.get('intent')

	if (intent === 'togglePraying') {
		// First fetch the current request
		const request = await prisma.request.findUnique({
			where: { id: prayerId as string },
			select: { response: true }
		})

		// Initialize or get current values
		const currentResponse = request?.response ?? {}
		const prayedBy = new Set(currentResponse.prayedBy ?? [])
		const currentCount = currentResponse.prayerCount ?? 0

		// Toggle user's prayer status
		const hasPrayed = prayedBy.has(userId)
		if (hasPrayed) {
			prayedBy.delete(userId)
		} else {
			prayedBy.add(userId)
		}

		// Update the request with new values
		await prisma.request.update({
			where: { id: prayerId as string },
			data: {
				response: {
					prayerCount: hasPrayed ? currentCount - 1 : currentCount + 1,
					prayedBy: Array.from(prayedBy),
					lastUpdatedAt: new Date().toISOString(),
				}
			}
		})

		return data({ success: true })
	}
}


export default function PrayerBoardPage() {
	const loaderData = useLoaderData<typeof loader>()
	const [searchParams] = useSearchParams()

	// Helper to generate URLs with updated search params
	const generateUrl = useCallback(
		(newParams: Record<string, string | number>) => {
			const params = new URLSearchParams(searchParams)
			Object.entries(newParams).forEach(([key, value]) => {
				if (value === undefined || value === null || value === '') {
					params.delete(key)
				} else {
					params.set(key, String(value))
				}
			})
			return `?${params.toString()}`
		},
		[searchParams],
	)

	// Generate URLs for different actions
	const getSortUrl = useCallback(
		(newSort: 'asc' | 'desc') => {
			return generateUrl({ sort: newSort, page: 1 })
		},
		[generateUrl],
	)

	const getFilterUrl = useCallback(
		(newFilter: string) => {
			return generateUrl({ filter: newFilter, page: 1 })
		},
		[generateUrl],
	)

	const getNextPageUrl = useCallback(
		() => {
			const currentPage = parseInt(searchParams.get('page') || '1', 10)
			return generateUrl({ page: currentPage + 1 })
		},
		[generateUrl, searchParams],
	)

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="mb-8 text-center text-3xl font-bold">
				Community Prayer Board
			</h1>
			<p className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground">
				Share prayer requests with the community. Together in faith, we support
				one another.
			</p>

			<h2 className="mb-4 text-xl font-semibold">Prayer Requests</h2>
			<PrayerBoard
				loaderData={loaderData}
				getFilterUrl={getFilterUrl}
				getSortUrl={getSortUrl}
				getNextPageUrl={getNextPageUrl}
			/>
		</main>
	)
}

type PrayerBoardProps = {
	loaderData: Awaited<ReturnType<typeof loader>>
	getFilterUrl: (filter: string) => string
	getSortUrl: (sort: 'asc' | 'desc') => string
	getNextPageUrl: () => string
}

function PrayerBoard({ loaderData, getFilterUrl, getSortUrl, getNextPageUrl }: PrayerBoardProps) {
	const { prayers, filters, activeFilter, userId: currentUserId, hasNextPage } = loaderData

	// const [showForm, setShowForm] = useState(false)
	// const [activeFilter, setActiveFilter] = useState('All')

	// const addPrayer = (newPrayer) => {
	// 	setPrayers([
	// 		{
	// 			id: (prayers.length + 1).toString(),
	// 			userId: "currentUser", // In a real app, this would be the actual user ID
	// 			userName: "You", // In a real app, this would be the actual username
	// 			userImage: "/placeholder.svg?height=40&width=40",
	// 			postedDate: new Date(),
	// 			answered: false,
	// 			answeredMessage: "",
	// 			...newPrayer,
	// 		},
	// 		...prayers,
	// 	])
	// 	setShowForm(false)
	// }

	const toggleAnswered = (id, answeredMessage = '') => {
		// setPrayers(
		// 	prayers.map((prayer) =>
		// 		prayer.id === id
		// 			? {
		// 					...prayer,
		// 					answered: !prayer.answered,
		// 					answeredMessage: !prayer.answered ? answeredMessage : '',
		// 				}
		// 			: prayer,
		// 	),
		// )
		// TODO
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<PrayerFilter
					filters={filters}
					activeFilter={activeFilter}
					getFilterUrl={getFilterUrl}
				/>
				<Link to="/prayer/new">
					<Button>Share Prayer Request</Button>
				</Link>

			</div>

			<div className="grid gap-4">
				{prayers.length > 0 ? (
					prayers.map((prayer) => (
						<PrayerItem
							key={prayer.id}
							prayer={prayer}
							onAnswered={toggleAnswered}
							isCurrentUser={prayer.user.id === currentUserId} // In a real app, check if the current user is the author
						/>
					))
				) : (
					<div className="rounded-lg border p-8 text-center">
						<p className="text-muted-foreground">
							No prayer requests found in this category.
						</p>
					</div>
				)}
			</div>
			{hasNextPage && (
				<div className="flex justify-center mt-2">
					<Link
						to={getNextPageUrl()}
						prefetch="intent"
						className="inline-flex items-center"
					>
						<Button variant="outline" className="flex items-center gap-1">
							Load More
							<ChevronDown className="h-4 w-4" />
						</Button>
					</Link>
				</div>
			)}
		</div>
	)
}

interface PrayerFilterProps {
	filters: Array<{ name: string }>
	activeFilter: string
	getFilterUrl: (filter: string) => string
}

function PrayerFilter({
	filters,
	activeFilter,
	getFilterUrl,
}: PrayerFilterProps) {
	return (
		<div className="flex flex-wrap gap-2">
			{filters.map((filter) => (
				<Link
					key={filter.name}
					to={getFilterUrl(filter.name)}
					prefetch="intent"
					className="inline-flex"
				>
					<Button
						variant={activeFilter === filter.name ? 'default' : 'outline'}
						size="sm"
					>
						{filter.name}
					</Button>
				</Link>
			))}
		</div>
	)
}

type Prayer = Awaited<ReturnType<typeof loader>>['prayers'][number]

interface PrayerItemProps {
	prayer: Prayer
	onAnswered: (id: string, answeredMessage?: string) => void
	isCurrentUser: boolean
}

function PrayerItem({ prayer, onAnswered, isCurrentUser }: PrayerItemProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [answeredMessage, setAnsweredMessage] = useState('')

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
	}

	const handleMarkAsAnswered = (e: React.FormEvent) => {
		e.preventDefault()
		onAnswered(prayer.id, answeredMessage)
		setIsDialogOpen(false)
		setAnsweredMessage('')
	}

	const handleMarkAsUnanswered = () => {
		onAnswered(prayer.id)
	}

	return (
		<Card className={prayer.answered ? 'opacity-75' : ''}>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">

					<div className="flex items-center gap-3">
						<Link to={`/users/${prayer.user.username}`} prefetch="intent">
						<Avatar>
							<AvatarImage
								src={getUserImgSrc(prayer.user.image?.id)}
								alt={prayer.user.username}
							/>
							<AvatarFallback>{prayer.user.username.charAt(0)}</AvatarFallback>
						</Avatar>
						</Link>
						<div>
							<h3 className="font-medium">{prayer.user.username}</h3>
							<div className="flex items-center text-sm text-muted-foreground">
								<CalendarDays className="mr-1 h-3 w-3" />
								{formatDate(prayer.createdAt)}
							</div>
						</div>
					</div>
					<Badge variant={prayer.answered ? 'outline' : 'secondary'}>
						{prayer.category.name}
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<p className="text-sm">{prayer.description}</p>

				{prayer.answered && prayer.answeredMessage && (
					<div className="mt-4 rounded-md border border-green-100 bg-green-50 p-3">
						<p className="mb-1 text-sm font-medium text-green-800">
							Prayer Answered:
						</p>
						<p className="text-sm text-green-700">{prayer.answeredMessage}</p>
					</div>
				)}
			</CardContent>
			<CardFooter className="flex justify-between pt-2">
				<div className="flex items-center gap-4">
					<Form method="post">
						<input type="hidden" name="prayerId" value={prayer.id} />
						<input type="hidden" name="intent" value="togglePraying" />
						<Button 
							type="submit"
							disabled={prayer?.answered === true}
							variant={prayer.hasPrayed ? "secondary" : "ghost"}
							size="sm"
							className={cn(
								"text-muted-foreground",
								prayer.hasPrayed && "bg-primary/10 text-primary"
							)}
						>
							<div className="flex items-center">
								<PrayingHands className="mr-1 h-4 w-4" />
								<span className="text-sm">
									{prayer.prayerCount} {prayer.prayerCount === 1 ? 'Prayer' : 'Prayers'}
								</span>
							</div>
						</Button>
					</Form>
				</div>
				{prayer.answered ? (
					<div className="flex items-center text-green-600">
						<CheckCircle2 className="mr-1 h-4 w-4" />
						<span className="text-sm">Prayer Answered</span>
					</div>
				) : (
					<div className="flex items-center text-muted-foreground">
						<PrayingHands className="mr-1 h-4 w-4" />
						<span className="text-sm">Praying</span>
					</div>
				)}
				{isCurrentUser &&
					(prayer.answered ? (
						<Button variant="ghost" size="sm" onClick={handleMarkAsUnanswered}>
							Mark as Unanswered
						</Button>
					) : (
						// todo move this into it's own component
						<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
							<DialogTrigger asChild>
								<Button variant="ghost" size="sm">
									Mark as Answered
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Share Your Testimony</DialogTitle>
									<DialogDescription>
										Share how this prayer was answered to encourage others in
										the community.
									</DialogDescription>
								</DialogHeader>
								<form onSubmit={handleMarkAsAnswered}>
									<div className="grid gap-4 py-4">
										<div className="grid gap-2">
											<Label htmlFor="testimony">
												How was your prayer answered?
											</Label>
											<Textarea
												id="testimony"
												placeholder="Share how God answered your prayer..."
												value={answeredMessage}
												onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
													setAnsweredMessage(e.target.value)
												}
												className="min-h-[100px]"
											/>
										</div>
									</div>
									<DialogFooter>
										<Button
											type="button"
											variant="outline"
											onClick={() => setIsDialogOpen(false)}
										>
											Cancel
										</Button>
										<Button type="submit">Share Testimony</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
					))}
			</CardFooter>
		</Card>
	)
}

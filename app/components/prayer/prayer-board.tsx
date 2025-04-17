import { ArrowUpDown, ChevronDown, PlusIcon } from 'lucide-react'
import { Link } from 'react-router'
import PrayerFilter from '#app/components/prayer/prayer-filter.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#app/components/ui/tooltip.tsx'
import { type loader } from '#app/routes/_prayer+/prayer.board.tsx'
import PrayerItem from '#app/components/prayer/prayer-item.tsx'

type PrayerBoardProps = {
	loaderData: Awaited<ReturnType<typeof loader>>
	getFilterUrl: (filter: string) => string
	getSortUrl: () => string
	getNextPageUrl: () => string
	actionData: any
}

export default function PrayerBoard({
											 loaderData,
											 getFilterUrl,
											 getSortUrl,
											 getNextPageUrl,
											 actionData
										 }: PrayerBoardProps) {
	const {
		prayers,
		filters,
		activeFilter,
		userId: currentUserId,
		hasNextPage,
	} = loaderData


	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<PrayerFilter
					filters={filters}
					activeFilter={activeFilter}
					getFilterUrl={getFilterUrl}
				/>

				<Link to={getSortUrl()}>
					<Button>
						<ArrowUpDown />
						Sort
					</Button>
				</Link>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Link to="/prayer/new">
								<Button>
									<PlusIcon />
								</Button>
							</Link>
						</TooltipTrigger>
						<TooltipContent>Share a prayer request</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			<div className="grid gap-4">
				{prayers.length > 0 ? (
					prayers.map((prayer) => (
						<PrayerItem
							key={prayer.id}
							prayer={prayer}
							actionData={actionData}
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
				<div className="mt-2 flex justify-center">
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
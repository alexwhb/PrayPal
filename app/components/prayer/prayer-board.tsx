import BoardFooter from '#app/components/board/board-footer.tsx'
import BoardHeader from '#app/components/board/board-header.tsx'
import PrayerItem from '#app/components/prayer/prayer-item.tsx'
import { type loader } from '#app/routes/_prayer+/prayer.board.tsx'

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
	actionData,
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
			<BoardHeader
				filters={filters}
				activeFilter={activeFilter}
				getFilterUrl={getFilterUrl}
				getSortUrl={getSortUrl}
				newActionToolTipString="New Prayer Request"
			/>

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
			<BoardFooter getNextPageUrl={getNextPageUrl} hasNextPage={hasNextPage} />
		</div>
	)
}

import BoardFooter from '#app/components/board/board-footer.tsx'
import BoardHeader from '#app/components/board/board-header.tsx'
import { NeedItem } from '#app/components/needs/need-item.tsx'
import { type Need } from '#app/components/needs/type.ts'
import { type loader } from '#app/routes/_needs+/needs.board.tsx'


type NeedsBoardProps = {
	loaderData: Awaited<ReturnType<typeof loader>>
	getFilterUrl: (filter: string) => string
	getSortUrl: () => string
	getNextPageUrl: () => string
	actionData: any
}

export default function NeedsBoard({
																			loaderData,
																			getFilterUrl,
																			getSortUrl,
																			getNextPageUrl,
																			actionData,
																		}: NeedsBoardProps) {
	const {
		needs,
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
				newActionToolTipString="Post a Need"
			/>

			<div className="grid gap-4">
				{needs.length > 0 ? (
					needs.map((need: Need) => (
						<NeedItem
							key={need.id}
							need={need}
							actionData={actionData}
							isCurrentUser={need.user.id === currentUserId} // In a real app, check if the current user is the author
						/>
					))
				) : (
					<div className="rounded-lg border p-8 text-center">
						<p className="text-muted-foreground">
							No need requests found in this category.
						</p>
					</div>
				)}
			</div>
			<BoardFooter getNextPageUrl={getNextPageUrl} hasNextPage={hasNextPage} />
		</div>
	)
}


import { ArrowUpDown, PlusIcon } from 'lucide-react'
import { Link } from 'react-router'
import Filters from '#app/components/board/filters.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#app/components/ui/tooltip.tsx'

export default function BoardHeader({
											 filters,
											 activeFilter,
											 getFilterUrl,
											 getSortUrl,
										 }: {
	filters: Array<{ name: string }>
	activeFilter: string
	getFilterUrl: (filter: string) => string
	getSortUrl: () => string
}) {
	return (
		<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
			<Filters
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
	)
}
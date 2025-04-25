import { ArrowUpDown, PlusIcon, LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import Filters from '#app/components/board/filters.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'

type BoardHeaderProps = {
	filters: Array<{ id: string; name: string }>
	activeFilter: string
	getFilterUrl: (filter: string) => string
	getSortUrl: () => string
	newActionToolTipString: string
	secondaryAction?: {
		label: string
		href: string
		tooltip: string
		icon: LucideIcon
	}
}

export default function BoardHeader({
	filters,
	activeFilter,
	getFilterUrl,
	getSortUrl,
	newActionToolTipString,
	secondaryAction,
}: BoardHeaderProps) {
	return (
		<div className="flex w-full items-center justify-between gap-4">
			<div className="flex flex-1 items-center gap-4">
				<Filters
					filters={filters}
					activeFilter={activeFilter}
					getFilterUrl={getFilterUrl}
				/>
				<Link to={getSortUrl()}>
					<Button>
						<ArrowUpDown className="h-4 w-4" />
						Sort
					</Button>
				</Link>
			</div>
			<div className="flex items-center gap-2">
				{secondaryAction && (
					<Button asChild variant="outline">
						<Link
							to={secondaryAction.href}
							className="flex items-center gap-2"
							title={secondaryAction.tooltip}
						>
							<secondaryAction.icon className="h-4 w-4" />
							{secondaryAction.label}
						</Link>
					</Button>
				)}
				<Button asChild>
					<Link
						to="../new"
						className="flex items-center gap-2"
						title={newActionToolTipString}
					>
						<PlusIcon className="h-4 w-4" />
						<span>New</span>
					</Link>
				</Button>
			</div>
		</div>
	)
}

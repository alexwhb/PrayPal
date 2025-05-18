
import { Link } from 'react-router'
import Filters from '#app/components/board/filters.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {Icon} from '#app/components/ui/icon.tsx'


type BoardHeaderProps = {
	filters: Array<{ id: string; name: string }>
	activeFilter: string
	getFilterUrl: (filter: string) => string
	getSortUrl: () => string
	getNewActionUrl?: () => string
	newActionToolTipString: string
	secondaryAction?: {
		label: string
		href: string
		tooltip: string
		icon: React.ReactNode
	}
}

export default function BoardHeader({
	filters,
	activeFilter,
	getFilterUrl,
	getSortUrl,
	getNewActionUrl,
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
						<Icon name="arrow-up-down" size="sm" />
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
							{secondaryAction.icon}
							{secondaryAction.label}
						</Link>
					</Button>
				)}
				<Button asChild>
					<Link
						to={getNewActionUrl ? getNewActionUrl() : '../new'}
						className="flex items-center gap-2"
						title={newActionToolTipString}
					>
						<Icon name="plus" size="sm" />
						<span>New</span>
					</Link>
				</Button>
			</div>
		</div>
	)
}

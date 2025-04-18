import { Link } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'

interface FilterProps {
	filters: Array<{ name: string }>
	activeFilter: string
	getFilterUrl: (filter: string) => string
}

export default function Filters({
												filters,
												activeFilter,
												getFilterUrl,
											}: FilterProps) {
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


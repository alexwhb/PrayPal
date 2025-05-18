import {Icon} from '#app/components/ui/icon.tsx'
import { Link } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'

export default function BoardFooter({
											 hasNextPage,
											 getNextPageUrl,
										 }: {
	hasNextPage: boolean
	getNextPageUrl: () => string
}) {
	return (
		<>
			{hasNextPage && (
				<div className="mt-2 flex justify-center">
					<Link
						to={getNextPageUrl()}
						prefetch="intent"
						className="inline-flex items-center"
					>
						<Button variant="outline" className="flex items-center gap-1">
							Load More
							<Icon name="chevron-down" size="sm" />
						</Button>
					</Link>
				</div>
			)}
		</>
	)
}
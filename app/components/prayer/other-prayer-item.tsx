import {Icon} from '#app/components/ui/icon.tsx'
import { Form, Link } from 'react-router'
import ContentModeration from '#app/components/content-moderation.tsx'
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '#app/components/ui/avatar.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '#app/components/ui/card.tsx'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { cn } from '#app/utils/misc.tsx'
import { formatDate } from '#app/utils/formatter.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx' // This is for users that are not me.
import { type Prayer } from './type.ts'

// This is for users that are not me.
export default function OtherPrayerItem({
	prayer,
	canModerate,
}: {
	prayer: Prayer
	canModerate: boolean
}) {
	return (
		<Card className={prayer.answered ? 'opacity-75' : ''}>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<Link to={`/users/${prayer.user.username}`} prefetch="intent">
							<Avatar>
								<AvatarImage
									src={getUserImgSrc(prayer.user.image?.objectKey)}
									alt={prayer.user.name}
								/>
								<AvatarFallback>{prayer.user.name.charAt(0)}</AvatarFallback>
							</Avatar>
						</Link>
						<div>
							<Link to={`/users/${prayer.user.username}`} prefetch="intent">
								<h3 className="font-medium">{prayer.user.name}</h3>
							</Link>
							<div className="flex items-center text-sm text-muted-foreground">
								<Icon name="calendar-days" size="xs" className="mr-1"/>
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
					<div className="mt-4 rounded-md border border-green-100 bg-green-50 p-3 dark:border-green-100/20 dark:bg-green-200/10">
						<p className="mb-1 text-sm font-medium text-green-800 dark:text-green-200">
							Prayer Answered:
						</p>
						<p className="text-sm text-green-800 dark:text-green-200">
							{prayer.answeredMessage}
						</p>
					</div>
				)}
			</CardContent>
			<CardFooter className="flex justify-between">
				<Form method="post">
					<input type="hidden" name="prayerId" value={prayer.id} />
					<input type="hidden" name="_action" value="togglePraying" />
					<div className="flex items-center gap-4">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="submit"
										disabled={prayer.answered}
										variant={'ghost'}
										size="sm"
										className={cn(
											'flex items-center text-muted-foreground',
											prayer.hasPrayed &&
												'text-green-600 transition-colors hover:text-green-600',
										)}
									>
										<Icon name="hand" size="sm" />
										<div className="flex items-center">
											<span className="mr-1 text-sm">Praying</span>
											{prayer.prayerCount > 0 && (
												<span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
													+{prayer.prayerCount}
												</span>
											)}
										</div>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{prayer.hasPrayed
										? 'Click to remove your prayer'
										: 'Click to pray'}
								</TooltipContent>
							</Tooltip>
							{prayer.answered && (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="text-sm font-medium text-green-600">
											<Icon name="check-circle" />
										</span>
									</TooltipTrigger>
									<TooltipContent>Prayer marked as answered</TooltipContent>
								</Tooltip>
							)}
						</TooltipProvider>
					</div>
				</Form>

				<ContentModeration
					itemId={prayer.id}
					itemType="prayer"
					canModerate={canModerate}
					isOwner={false}
				/>
			</CardFooter>
		</Card>
	)
}

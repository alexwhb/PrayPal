import { CalendarDays, HandIcon as PrayingHands } from 'lucide-react'
import { Form, Link } from 'react-router'
import { type Prayer } from './type.ts'
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
import { cn } from '#app/lib/utils.ts'
import { formatDate } from '#app/utils/formatter.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx' // This is for users that are not me.

// This is for users that are not me.

export default function OtherPrayerItem({ prayer }: { prayer: Prayer }) {
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
								<AvatarFallback>
									{prayer.user.username.charAt(0)}
								</AvatarFallback>
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
			<CardFooter>
				<div className="flex items-center gap-4">
					<Form method="post">
						<input type="hidden" name="prayerId" value={prayer.id} />
						<input type="hidden" name="_action" value="togglePraying" />
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
												'text-blue-500 transition-colors hover:text-blue-500',
										)}
									>
										<PrayingHands className="mr-1 h-4 w-4" />
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
						</TooltipProvider>
					</Form>
				</div>
			</CardFooter>
		</Card>
	)
}

import { type Group } from '@prisma/client'
import { Form, Link } from 'react-router'
import ContentModeration from '#app/components/content-moderation.tsx'
import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar'
import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import { Card } from '#app/components/ui/card.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip'
import { getUserImgSrc } from '#app/utils/misc'
import { Img } from 'openimg/react'

type GroupCardProps = {
	group: Group & {
		isMember: boolean
		isLeader: boolean
		memberCount: number
		hasCapacity: boolean
		isPrivate: boolean
		isPending: boolean
		memberships: Array<{
			user: {
				id: string
				name: string | null
				username: string
				image: { objectKey: string } | null
			}
		}>
	}
	canModerate: boolean
	isCurrentUser: boolean
}

export default function GroupCard({ group, canModerate }: GroupCardProps) {
	const leaders = group.memberships
	const displayedLeaders = leaders.slice(0, 3)
	const remainingLeaders = Math.max(0, leaders.length - 3)

	return (
		<Card className="flex flex-col space-y-4 rounded-lg border p-6 shadow-sm">
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-2">
					<Link to={`/groups/${group.id}`} className="hover:underline">
						<h3 className="text-xl font-semibold">{group.name}</h3>
					</Link>
				</div>
				{group.hasCapacity ? (
					<Badge variant="outline">
						{group.memberCount}/{group.capacity ?? '∞'} members
					</Badge>
				) : (
					<Badge variant="secondary">Full</Badge>
				)}
			</div>

			<p className="text-muted-foreground">{group.description}</p>

			<div className="flex flex-col gap-2">
				<div className="text-muted-foreground flex items-center gap-2 text-sm">
					<Icon name="calendar" size="sm" />
					<span>
						Meets {group.frequency.toLowerCase()} at{' '}
						{new Date(group.meetingTime).toLocaleTimeString()}
					</span>
				</div>
				<div className="text-muted-foreground flex items-center gap-2 text-sm">
					<Icon name="map-pin" size="sm" />
					<span>{group.isOnline ? 'Online' : group.location}</span>
				</div>
			</div>
			<div className="flex items-center gap-1">
				<div className="flex -space-x-2">
					<TooltipProvider>
						{displayedLeaders.map((leader) => (
							<Tooltip key={leader.user.id}>
								<TooltipTrigger asChild>
									<Link
										to={`/users/${leader.user.username}`}
										className="relative inline-block"
									>
										<Avatar className="border-background h-6 w-6 border-2">
											<AvatarImage
												src={getUserImgSrc(leader.user.image?.objectKey)}
												asChild
											>
												<Img
													src={getUserImgSrc(leader.user.image?.objectKey)}
													alt={leader.user.name}
													className="h-full w-full object-cover"
													width={32}
													height={32}
												/>
											</AvatarImage>


										</Avatar>
									</Link>
								</TooltipTrigger>
								<TooltipContent>
									Organized by {leader.user.name || leader.user.username}
								</TooltipContent>
							</Tooltip>
						))}
					</TooltipProvider>
				</div>
				{remainingLeaders > 0 && (
					<span className="text-muted-foreground ml-1 text-sm">
						+{remainingLeaders} more
					</span>
				)}
			</div>
			<div className="mt-auto flex gap-2 pt-4">
				<Form method="post" className="flex-1">
					<input type="hidden" name="groupId" value={group.id} />
					<input
						type="hidden"
						name="_action"
						value={group.isMember ? 'leave' : 'join'}
					/>
					{group.isPending ? (
						<Button
							variant="secondary"
							className="w-full"
							type="button"
							disabled
						>
							Request Pending
						</Button>
					) : (
						<Button
							variant={group.isMember ? 'outline' : 'default'}
							className="w-full"
							type="submit"
							disabled={!group.hasCapacity && !group.isMember}
						>
							{group.isMember
								? 'Leave Group'
								: group.isPrivate
									? 'Request to Join'
									: group.hasCapacity
										? 'Join Group'
										: 'Group Full'}
						</Button>
					)}
				</Form>

				<ContentModeration
					itemId={group.id}
					itemType="group"
					canModerate={canModerate}
					isOwner={group.isLeader}
				/>
			</div>
		</Card>
	)
}

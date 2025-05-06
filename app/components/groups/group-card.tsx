import { type Group } from '@prisma/client'
import { CalendarIcon, MapPinIcon, MoreVerticalIcon } from 'lucide-react'
import { Form, Link } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar'
import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu'
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '#app/components/ui/tooltip'
import { getUserImgSrc } from '#app/utils/misc'

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
                image: { id: string } | null
            }
        }>
    }
    canModerate: boolean
    isCurrentUser: boolean
}

export default function GroupCard({
    group,
    canModerate,
    isCurrentUser,
}: GroupCardProps) {
    const leaders = group.memberships
    const displayedLeaders = leaders.slice(0, 3)
    const remainingLeaders = Math.max(0, leaders.length - 3)

    return (
        <div className="flex flex-col space-y-4 rounded-lg border p-6 shadow-sm">
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                        Meets {group.frequency.toLowerCase()} at{' '}
                        {new Date(group.meetingTime).toLocaleTimeString()}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPinIcon className="h-4 w-4" />
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
												<Avatar className="h-6 w-6 border-2 border-background">
													{leader.user.image?.id ? (
														<AvatarImage
															src={getUserImgSrc(leader.user.image.id)}
															alt={leader.user.name || leader.user.username}
														/>
													) : (
														<AvatarFallback>
															{(leader.user.name || leader.user.username)[0]}
														</AvatarFallback>
													)}
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
							<span className="text-sm text-muted-foreground ml-1">
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

                {(group.isLeader || canModerate) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVerticalIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link to={`/groups/${group.id}/edit`}>Edit Group</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onSelect={() => {
                                    // Handle delete confirmation
                                }}
                            >
                                Delete Group
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    )
}
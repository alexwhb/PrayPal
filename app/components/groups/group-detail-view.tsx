
import { format } from 'date-fns'
import { 
  CalendarIcon, 
  Clock, 
  ExternalLink, 
  MapPin, 
  MessageSquare, 
  Users 
} from 'lucide-react'
import { useState } from 'react'
import { Form, Link } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar'
import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#app/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#app/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#app/components/ui/tooltip'
import { getUserImgSrc } from '#app/utils/misc'

type GroupMember = {
  id: string
  userId: string
  role: 'LEADER' | 'MEMBER'
  user: {
    id: string
    name: string | null
    username: string
    image: { id: string } | null
  }
}

type GroupDetailViewProps = {
  group: {
    id: string
    name: string
    description: string
    frequency: string
    meetingTime: string
    location: string
    isOnline: boolean
    isPrivate: boolean
    capacity: number | null
    memberCount: number
    isMember: boolean
    isLeader: boolean
    isPending?: boolean
    createdAt: string
    category: { name: string }
    members: GroupMember[]
    nextMeetingDate?: string
  }
  currentUserId: string
}

export default function GroupDetailView({ group, currentUserId }: GroupDetailViewProps) {
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  
  const leaders = group.members.filter(m => m.role === 'LEADER')
  const members = group.members.filter(m => m.role === 'MEMBER')
  
  // Determine which members to display based on privacy settings and membership
  const canViewAllMembers = !group.isPrivate || group.isMember
  
  // Always show leaders (group creators)
  const visibleMembers = canViewAllMembers 
    ? group.members 
    : leaders
  
  const displayedMembers = visibleMembers.slice(0, 5)
  const remainingMembersCount = Math.max(0, visibleMembers.length - 5)

  // Format dates
  const creationDate = format(new Date(group.createdAt), 'MMMM d, yyyy')
  
  // Format meeting time
  const meetingDateTime = new Date(group.meetingTime)
  const formattedMeetingTime = format(meetingDateTime, 'h:mm a')
  
  // Format next meeting date if available
  const nextMeetingDisplay = group.nextMeetingDate 
    ? format(new Date(group.nextMeetingDate), 'EEEE, MMMM d, yyyy')
    : null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{group.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{group.category.name}</Badge>
          <Badge variant="outline">{group.frequency.charAt(0) + group.frequency.slice(1).toLowerCase()}</Badge>
          {group.isOnline && <Badge variant="outline">Online</Badge>}
          {group.isPrivate && <Badge variant="outline">Private</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{group.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextMeetingDisplay && (
              <div>
                <h3 className="font-medium">Next Meeting</h3>
                <p className="text-muted-foreground">{nextMeetingDisplay}</p>
              </div>
            )}
            
            <div>
              <h3 className="font-medium">Meeting Time</h3>
              <p className="text-muted-foreground">{formattedMeetingTime}</p>
            </div>
            
            {group.location && (
              <div>
                <h3 className="font-medium">Location</h3>
                <p className="text-muted-foreground">
                  {group.isOnline ? 'Online' : group.location}
                </p>
              </div>
            )}
            
            {group.capacity && (
              <div>
                <h3 className="font-medium">Capacity</h3>
                <p className="text-muted-foreground">
                  {group.memberCount} / {group.capacity} members
                </p>
              </div>
            )}
            
            <div>
              <h3 className="font-medium">Created</h3>
              <p className="text-muted-foreground">{creationDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Meeting Details</h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>Meets {group.frequency.toLowerCase()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>at {formattedMeetingTime}</span>
            </div>
            
            {group.isMember && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{group.isOnline ? 'Online Meeting' : group.location}</span>
                {group.isOnline && (
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Join
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Members</h3>
            {/* Only show View All button if user can view all members */}
            {canViewAllMembers ? (
              <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>View All</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Group Members</DialogTitle>
                    <DialogDescription>
                      {group.memberCount} members in this group
                    </DialogDescription>
                  </DialogHeader>
                  
                  {leaders.length > 0 && (
                    <>
                      <h4 className="font-medium mt-4 mb-2">Leaders</h4>
                      <div className="space-y-2">
                        {leaders.map(member => (
                          <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                {member.user.image?.id ? (
                                  <AvatarImage
                                    src={getUserImgSrc(member.user.image.id)}
                                    alt={member.user.name || member.user.username}
                                  />
                                ) : (
                                  <AvatarFallback>
                                    {(member.user.name || member.user.username)[0]}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <Link 
                                to={`/users/${member.user.username}`}
                                className="font-medium hover:underline"
                              >
                                {member.user.name || member.user.username}
                              </Link>
                            </div>
                            <Badge variant="outline">Leader</Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {canViewAllMembers && members.length > 0 && (
                    <>
                      <h4 className="font-medium mt-4 mb-2">Members</h4>
                      <div className="space-y-2">
                        {members.map(member => (
                          <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                {member.user.image?.id ? (
                                  <AvatarImage
                                    src={getUserImgSrc(member.user.image.id)}
                                    alt={member.user.name || member.user.username}
                                  />
                                ) : (
                                  <AvatarFallback>
                                    {(member.user.name || member.user.username)[0]}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <Link 
                                to={`/users/${member.user.username}`}
                                className="font-medium hover:underline"
                              >
                                {member.user.name || member.user.username}
                              </Link>
                            </div>
                            {member.user.id === currentUserId && (
                              <Badge variant="secondary">You</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {!canViewAllMembers && (
                    <div className="mt-4 text-center text-muted-foreground">
                      <p>Only group members can view the full member list.</p>
                      <p>Join this group to see all members.</p>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            ) : (
              <div className="text-sm text-muted-foreground">
                {group.memberCount} members
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <TooltipProvider>
                {displayedMembers.map(member => (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <Link
                        to={`/users/${member.user.username}`}
                        className="relative inline-block"
                      >
                        <Avatar className="h-8 w-8 border-2 border-background">
                          {member.user.image?.id ? (
                            <AvatarImage
                              src={getUserImgSrc(member.user.image.id)}
                              alt={member.user.name || member.user.username}
                            />
                          ) : (
                            <AvatarFallback>
                              {(member.user.name || member.user.username)[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      {member.user.name || member.user.username}
                      {member.role === 'LEADER' ? ' (Leader)' : ''}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
            {canViewAllMembers && remainingMembersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 rounded-full"
                onClick={() => setMembersDialogOpen(true)}
              >
                +{remainingMembersCount} more
              </Button>
            )}
            {!canViewAllMembers && group.memberCount > leaders.length && (
              <span className="text-sm text-muted-foreground">
                +{group.memberCount - leaders.length} more (join to view)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        {/* Only show Message Group button if user is a member */}
        {group.isMember && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/messages/new?groupId=${group.id}`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Group
            </Link>
          </Button>
        )}
        
        {/* Show appropriate button based on membership status */}
        {!group.isMember && !group.isPending && (
          <Button variant="default" size="sm" type="submit" form="join-group-form">
            {group.isPrivate ? 'Request to Join' : 'Join Group'}
          </Button>
        )}
        
        {group.isPending && (
          <Button variant="secondary" size="sm" disabled>
            Membership Pending
          </Button>
        )}
        
        {group.isMember && !group.isLeader && (
          <Button variant="outline" size="sm" type="submit" form="leave-group-form">
            Leave Group
          </Button>
        )}
        
        {group.isLeader && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/groups/manage/${group.id}`}>
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link to={`/groups/${group.id}/edit`}>
                Edit Group
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Hidden form for joining the group */}
      {!group.isMember && !group.isPending && (
        <Form method="post" id="join-group-form" className="hidden">
          <input type="hidden" name="groupId" value={group.id} />
          <input type="hidden" name="_action" value="join" />
        </Form>
      )}

      {/* Hidden form for leaving the group */}
      {group.isMember && !group.isLeader && (
        <Form method="post" id="leave-group-form" className="hidden">
          <input type="hidden" name="groupId" value={group.id} />
          <input type="hidden" name="_action" value="leave" />
        </Form>
      )}
    </div>
  )
}
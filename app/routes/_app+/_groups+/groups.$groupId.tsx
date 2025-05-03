import { addMonths, addWeeks, format, isBefore, startOfDay } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { data, Link } from 'react-router'
import GroupDetailView from '#app/components/groups/group-detail-view'
import { Button } from '#app/components/ui/button'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { type Route } from './+types/groups.$groupId'

export async function loader({ params, request }: Route.LoaderArgs) {
  const userId = await requireUserId(request)
  const groupId = params.groupId

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      description: true,
      frequency: true,
      meetingTime: true,
      location: true,
      isOnline: true,
      isPrivate: true,
      capacity: true,
      createdAt: true,
      category: { select: { name: true } },
      _count: { select: { memberships: true } },
      memberships: {
        select: {
          userId: true,
          role: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: { select: { id: true } },
            },
          },
        },
      },
    },
  })

  if (!group) {
    throw new Response('Group not found', { status: 404 })
  }

  // Check if user is an active member of this group
  const userMembership = group.memberships.find(m => m.userId === userId)
  const isMember = !!userMembership && userMembership.status === 'ACTIVE'
  const isLeader = userMembership?.role === 'LEADER' && userMembership.status === 'ACTIVE'
  const isPending = !!userMembership && userMembership.status === 'PENDING'

  // Check if user has moderation privileges
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: { select: { name: true } },
    },
  })

  const canModerate = user?.roles.some(role => 
    ['admin', 'moderator'].includes(role.name)
  ) ?? false

  // If the group is private and user is not a member or moderator, restrict access
  if (group.isPrivate && !isMember && !canModerate) {
    throw new Response('You do not have permission to view this group', { status: 403 })
  }

  // Calculate the next meeting date based on frequency
  const meetingTime = new Date(group.meetingTime)
  const today = startOfDay(new Date())
  let nextMeetingDate = new Date(meetingTime)
  
  // If the original meeting time is in the past, calculate the next occurrence
  if (isBefore(nextMeetingDate, today)) {
    switch (group.frequency) {
      case 'ONCE':
        // For one-time meetings, keep the original date even if it's in the past
        break
      case 'DAILY':
        // Set to today with the same time
        nextMeetingDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          meetingTime.getHours(),
          meetingTime.getMinutes()
        )
        break
      case 'WEEKLY':
        // Find the next weekly occurrence
        while (isBefore(nextMeetingDate, today)) {
          nextMeetingDate = addWeeks(nextMeetingDate, 1)
        }
        break
      case 'BIWEEKLY':
        // Find the next biweekly occurrence
        while (isBefore(nextMeetingDate, today)) {
          nextMeetingDate = addWeeks(nextMeetingDate, 2)
        }
        break
      case 'MONTHLY':
        // Find the next monthly occurrence
        while (isBefore(nextMeetingDate, today)) {
          nextMeetingDate = addMonths(nextMeetingDate, 1)
        }
        break
      case 'CUSTOM':
        // For custom, we'd need additional data, but for now just use weekly
        while (isBefore(nextMeetingDate, today)) {
          nextMeetingDate = addWeeks(nextMeetingDate, 1)
        }
        break
    }
  }

  // Filter to only show active members to non-members
  const visibleMembers = isMember || canModerate || !group.isPrivate
    ? group.memberships
    : group.memberships.filter(m => m.role === 'LEADER' && m.status === 'ACTIVE')

  return data({
    group: {
      ...group,
      memberCount: group._count.memberships,
      isMember,
      isLeader,
      isPending,
      members: visibleMembers,
      nextMeetingDate: nextMeetingDate.toISOString(),
    },
    currentUserId: userId,
  })
}

export async function action({ request, params }: Route.ActionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  const action = formData.get('_action')
  
  if (action === 'join') {
    const groupId = params.groupId
    
    // Get the group to check if it's private
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { 
        isPrivate: true,
        capacity: true,
        _count: { select: { memberships: true } }
      },
    })
    
    if (!group) {
      throw new Response('Group not found', { status: 404 })
    }
    
    // Check capacity before joining
    if (group.capacity && group._count.memberships >= group.capacity) {
      return data({ error: 'Group is at capacity' }, { status: 400 })
    }
    
    // Check if user already has a membership
    const existingMembership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        }
      }
    })
    
    // If user already has a pending or active membership, don't create a new one
    if (existingMembership) {
      return data({ 
        success: true, 
        message: existingMembership.status === 'PENDING' 
          ? 'Your request to join is already pending approval.' 
          : 'You are already a member of this group.'
      })
    }
    
    // For private groups, create a pending membership
    // For public groups, create an active membership
    await prisma.groupMembership.create({
      data: {
        userId,
        groupId,
        role: 'MEMBER',
        status: group.isPrivate ? 'PENDING' : 'ACTIVE',
      },
    })
    
    // If private group, notify leaders about the join request
    if (group.isPrivate) {
      // Get group leaders
      const leaders = await prisma.groupMembership.findMany({
        where: { groupId, role: 'LEADER' },
        select: { userId: true },
      })
      
      // TODO: Create notifications for leaders
      
      return data({ 
        success: true, 
        message: 'Your request to join has been submitted and is pending approval.' 
      })
    }
    
    return data({ success: true })
  }
  
  if (action === 'leave') {
    const groupId = params.groupId
    
    await prisma.groupMembership.delete({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    })
    
    return data({ success: true })
  }
  
  return null
}

export default function GroupDetailPage({loaderData}: Route.ComponentProps) {
	const { group, currentUserId } = loaderData

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/groups/board">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Link>
        </Button>
      </div>

      <GroupDetailView group={group} currentUserId={currentUserId} />
    </div>
  )
}
import { ArrowLeft, Check, X } from 'lucide-react'
import { data, Link, redirect } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar'
import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#app/components/ui/tabs'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { getUserImgSrc } from '#app/utils/misc'
import { type Route } from './+types/groups.manage.$groupId'

export async function loader({ params, request }: Route.LoaderArgs) {
  const userId = await requireUserId(request)
  const groupId = params.groupId

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      isPrivate: true,
      memberships: {
        select: {
          // id: true,
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

  // Check if user is a leader of this group
  const userMembership = group.memberships.find(m => m.userId === userId)
  const isLeader = userMembership?.role === 'LEADER'

  if (!isLeader) {
    return redirect(`/groups/${groupId}`)
  }

  const members = group.memberships.filter(m => m.status === 'ACTIVE')
  const pendingRequests = group.isPrivate 
    ? group.memberships.filter(m => m.status === 'PENDING')
    : []

  return data({
    group: {
      id: group.id,
      name: group.name,
      isPrivate: group.isPrivate,
    },
    members,
    pendingRequests,
  })
}

export async function action({ request, params }: Route.ActionArgs) {
  const userId = await requireUserId(request)
  const groupId = params.groupId
  const formData = await request.formData()
  const action = formData.get('_action')
  const membershipId = formData.get('membershipId')
  
  // Verify user is a leader
  const userMembership = await prisma.groupMembership.findFirst({
    where: {
      groupId,
      userId,
      role: 'LEADER',
    },
  })
  
  if (!userMembership) {
    return data({ error: 'Unauthorized' }, { status: 403 })
  }
  
  if (action === 'approve' && membershipId) {
    await prisma.groupMembership.update({
      where: { id: membershipId as string },
      data: { status: 'ACTIVE' },
    })
    
    // TODO: Create notification for approved user
    
    return data({ success: true })
  }
  
  if (action === 'reject' && membershipId) {
    await prisma.groupMembership.delete({
      where: { id: membershipId as string },
    })
    
    // TODO: Create notification for rejected user
    
    return data({ success: true })
  }
  
  if (action === 'promote' && membershipId) {
    await prisma.groupMembership.update({
      where: { id: membershipId as string },
      data: { role: 'LEADER' },
    })
    
    return data({ success: true })
  }
  
  if (action === 'demote' && membershipId) {
    await prisma.groupMembership.update({
      where: { id: membershipId as string },
      data: { role: 'MEMBER' },
    })
    
    return data({ success: true })
  }
  
  if (action === 'remove' && membershipId) {
    await prisma.groupMembership.delete({
      where: { id: membershipId as string },
    })
    
    return data({ success: true })
  }
  
  return data({ error: 'Invalid action' }, { status: 400 })
}

export default function GroupManagePage({ loaderData }: Route.ComponentProps) {
  const { group, members, pendingRequests } = loaderData
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/groups/${group.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Group
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Manage {group.name}</h1>
      </div>
      
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            Members ({members.length})
          </TabsTrigger>
          {group.isPrivate && (
            <TabsTrigger value="requests">
              Join Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="members" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
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
                      <div>
                        <Link 
                          to={`/users/${member.user.username}`}
                          className="font-medium hover:underline"
                        >
                          {member.user.name || member.user.username}
                        </Link>
                        {member.role === 'LEADER' && (
                          <Badge variant="secondary" className="ml-2">Leader</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {member.role === 'MEMBER' ? (
                        <form method="post">
                          <input type="hidden" name="membershipId" value={member.id} />
                          <input type="hidden" name="_action" value="promote" />
                          <Button size="sm" variant="outline" type="submit">
                            Make Leader
                          </Button>
                        </form>
                      ) : (
                        <form method="post">
                          <input type="hidden" name="membershipId" value={member.id} />
                          <input type="hidden" name="_action" value="demote" />
                          <Button size="sm" variant="outline" type="submit">
                            Remove as Leader
                          </Button>
                        </form>
                      )}
                      
                      <form method="post">
                        <input type="hidden" name="membershipId" value={member.id} />
                        <input type="hidden" name="_action" value="remove" />
                        <Button size="sm" variant="destructive" type="submit">
                          Remove
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
                
                {members.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No members found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {group.isPrivate && (
          <TabsContent value="requests" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Join Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {request.user.image?.id ? (
                            <AvatarImage
                              src={getUserImgSrc(request.user.image.id)}
                              alt={request.user.name || request.user.username}
                            />
                          ) : (
                            <AvatarFallback>
                              {(request.user.name || request.user.username)[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <Link 
                          to={`/users/${request.user.username}`}
                          className="font-medium hover:underline"
                        >
                          {request.user.name || request.user.username}
                        </Link>
                      </div>
                      
                      <div className="flex gap-2">
                        <form method="post">
                          <input type="hidden" name="membershipId" value={request.id} />
                          <input type="hidden" name="_action" value="approve" />
                          <Button size="sm" variant="default" type="submit">
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </form>
                        
                        <form method="post">
                          <input type="hidden" name="membershipId" value={request.id} />
                          <input type="hidden" name="_action" value="reject" />
                          <Button size="sm" variant="destructive" type="submit">
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                  
                  {pendingRequests.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No pending requests</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
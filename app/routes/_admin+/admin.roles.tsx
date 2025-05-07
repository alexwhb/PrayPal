import { data, useFetcher, useLoaderData } from 'react-router'
import { UserRoleSelector } from '#app/components/admin/user-role-selector.tsx'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { prisma } from '#app/utils/db.server.ts'

import { type Route } from './+types/admin.roles.ts'
import { useToast } from '#app/components/toaster.tsx'
import { useState } from 'react'
import { Toast } from '#app/utils/toast.server.ts'

export async function loader({ request }: Route.LoaderArgs) {
  // Ensure only admins can access this page
  await requireUserWithRole(request, 'admin')

  // Get all admin and moderator users
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
    select: { id: true },
  })

  const moderatorRole = await prisma.role.findUnique({
    where: { name: 'moderator' },
    select: { id: true },
  })

  const adminUsers = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          id: adminRole?.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: { select: { id: true } },
      roles: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  const moderatorUsers = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          id: moderatorRole?.id,
        },
      },
      // Exclude users who are also admins
      NOT: {
        roles: {
          some: {
            id: adminRole?.id,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: { select: { id: true } },
      roles: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return data({
    adminUsers: adminUsers.map(user => ({
      ...user,
      imageId: user.image?.id,
    })),
    moderatorUsers: moderatorUsers.map(user => ({
      ...user,
      imageId: user.image?.id,
    })),
  })
}

export async function action({ request }: Route.ActionArgs) {
  // Ensure only admins can access this endpoint
  await requireUserWithRole(request, 'admin')
  
  const formData = await request.formData()
  const userId = formData.get('userId') as string
  const role = formData.get('role') as string
  
  if (!userId || !role) {
    return data({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    if (role.startsWith('remove-')) {
      const roleToRemove = role.replace('remove-', '')
      
      // Find the role ID
      const roleRecord = await prisma.role.findUnique({
        where: { name: roleToRemove },
        select: { id: true },
      })
      
      if (!roleRecord) {
        return data({ error: 'Role not found' }, { status: 404 })
      }
      
      // Remove the role from the user
      await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            disconnect: {
              id: roleRecord.id,
            },
          },
        },
      })
      
      return data({ success: true, message: `Removed ${roleToRemove} role` })
    } else {
      // Find the role ID
      const roleRecord = await prisma.role.findUnique({
        where: { name: role },
        select: { id: true },
      })
      
      if (!roleRecord) {
        return data({ error: 'Role not found' }, { status: 404 })
      }
      
      // Add the role to the user
      await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            connect: {
              id: roleRecord.id,
            },
          },
        },
      })
      
      return data({ success: true, message: `Added ${role} role` })
    }
  } catch (error) {
    console.error('Error updating user role:', error)
    return data({ error: 'Failed to update user role' }, { status: 500 })
  }
}

export default function AdminRolesPage() {
  const { adminUsers, moderatorUsers } = useLoaderData<typeof loader>()
	const [toast, setToast] = useState<Toast | null>(null)
  useToast(toast)
  const fetcher = useFetcher()
  
  const handleRoleAssignment = (userId: string, role: string) => {
    void fetcher.submit(
      { userId, role },
      { method: 'post' }
    )
    
    // Show toast notification
    const isRemoval = role.startsWith('remove-')
    const roleDisplay = isRemoval 
      ? role.replace('remove-', '') 
      : role

    setToast({
			id: 'role-assignment',
      title: isRemoval ? 'Role Removed' : 'Role Assigned',
      description: isRemoval
        ? `User has been removed from the ${roleDisplay} role.`
        : `User has been assigned the ${roleDisplay} role.`,
      type: 'success',
    })
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">User Role Management</h1>
      
      <UserRoleSelector
        onSubmit={handleRoleAssignment}
        existingAdmins={adminUsers}
        existingModerators={moderatorUsers}
      />
    </div>
  )
}
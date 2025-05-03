import { type NotificationType } from '@prisma/client'
import { prisma } from './db.server.ts'

type CreateNotificationOptions = {
  userId: string
  type: NotificationType
  title: string
  description?: string
  actionUrl?: string
}

/**
 * Creates a notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  description,
  actionUrl
}: CreateNotificationOptions) {
  return prisma.notification.create({
    data: {
      type,
      title,
      description,
      actionUrl,
      user: {
        connect: { id: userId }
      }
    }
  })
}

/**
 * Creates notifications for multiple users
 */
export async function createNotifications(
  userIds: string[],
  options: Omit<CreateNotificationOptions, 'userId'>
) {
  const { type, title, description, actionUrl } = options
  
  return prisma.notification.createMany({
    data: userIds.map(userId => ({
      userId,
      type,
      title,
      description,
      actionUrl
    }))
  })
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date()
    }
  })
}

/**
 * Marks all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false
    },
    data: {
      read: true,
      readAt: new Date()
    }
  })
}

/**
 * Gets unread notifications for a user
 */
export async function getUnreadNotifications(userId: string, limit = 10) {
  return prisma.notification.findMany({
    where: {
      userId,
      read: false
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  })
}

/**
 * Gets all notifications for a user with pagination
 */
export async function getUserNotifications(
  userId: string,
  { page = 1, perPage = 20 }: { page?: number; perPage?: number } = {}
) {
  const skip = (page - 1) * perPage
  
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage
    }),
    prisma.notification.count({
      where: { userId }
    })
  ])
  
  return {
    notifications,
    pagination: {
      total,
      pages: Math.ceil(total / perPage),
      page,
      perPage
    }
  }
}

/**
 * Deletes a notification
 */
export async function deleteNotification(notificationId: string) {
  return prisma.notification.delete({
    where: { id: notificationId }
  })
}

/**
 * Deletes all notifications for a user
 */
export async function deleteAllNotifications(userId: string) {
  return prisma.notification.deleteMany({
    where: { userId }
  })
}

/**
 * Gets the count of unread notifications for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      read: false
    }
  })
}
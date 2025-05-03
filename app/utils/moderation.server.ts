import { type ReportReason, type ReportableType, type ModerationType, type ModeratorAction } from '@prisma/client'
import { prisma } from './db.server.ts'

type CreateReportOptions = {
  itemId: string
  itemType: ReportableType
  reason: ReportReason
  description?: string | null
  reporterId: string
}

export async function createModerationReport({
  itemId,
  itemType,
  reason,
  description,
  reporterId,
}: CreateReportOptions) {
  return prisma.report.create({
    data: {
      itemId,
      itemType,
      reason,
      description,
      reportedBy: {
        connect: { id: reporterId }
      },
      status: 'PENDING'
    }
  })
}

export async function resolveModerationReport({
  reportId,
  moderatorId,
  resolution,
  moderationLogId,
}: {
  reportId: string
  moderatorId: string
  resolution: string
  moderationLogId?: string
}) {
  return prisma.report.update({
    where: { id: reportId },
    data: {
      status: 'RESOLVED',
      resolvedBy: {
        connect: { id: moderatorId }
      },
      resolution,
      resolvedAt: new Date(),
      ...(moderationLogId ? {
        moderationLog: {
          connect: { id: moderationLogId }
        }
      } : {})
    }
  })
}

export async function dismissModerationReport({
  reportId,
  moderatorId,
  resolution,
}: {
  reportId: string
  moderatorId: string
  resolution: string
}) {
  return prisma.report.update({
    where: { id: reportId },
    data: {
      status: 'DISMISSED',
      resolvedBy: {
        connect: { id: moderatorId }
      },
      resolution,
      resolvedAt: new Date()
    }
  })
}

type ModerateItemOptions = {
  userId: string
  itemId: string
  itemType: ModerationType
  action: 'delete' | 'pending' | 'removed' | ModeratorAction
  reason?: string
  isModerator: boolean
}

export async function moderateItem({
  userId,
  itemId,
  itemType,
  action,
  reason = '',
  isModerator
}: ModerateItemOptions) {
  // Create a moderation log if this is a moderator action
  if (isModerator) {
    let moderatorAction: ModeratorAction = 'DELETE'
    
    if (action === 'pending') {
      moderatorAction = 'FLAG'
    } else if (action === 'removed') {
      moderatorAction = 'HIDE'
    } else if (action === 'delete') {
      moderatorAction = 'DELETE'
    } else {
      moderatorAction = action as ModeratorAction
    }
    
    await prisma.moderationLog.create({
      data: {
        moderatorId: userId,
        itemId,
        itemType,
        action: moderatorAction,
        reason: reason || 'Moderation action',
      },
    })
  }

  // Perform the actual action on the item
  if (action === 'delete') {
    if (itemType === 'PRAYER' || itemType === 'NEED') {
      await prisma.request.delete({ where: { id: itemId } })
    } else if (itemType === 'GROUP') {
      await prisma.group.update({
        where: { id: itemId },
        data: { active: false }
      })
    } else if (itemType === 'SHARE_ITEM') {
      await prisma.shareItem.delete({ where: { id: itemId } })
    } else if (itemType === 'USER') {
      await prisma.user.delete({ where: { id: itemId } })
    }
  } else if (action === 'pending' || action === 'removed') {
    const status = action === 'pending' ? 'PENDING' : 'REMOVED'
    
    if (itemType === 'PRAYER' || itemType === 'NEED') {
      await prisma.request.update({
        where: { id: itemId },
        data: {
          status,
          flagged: action === 'pending'
        }
      })
    } else if (itemType === 'SHARE_ITEM') {
      await prisma.shareItem.update({
        where: { id: itemId },
        data: {
          status,
          flagged: action === 'pending'
        }
      })
    }
  }

  return { success: true }
}

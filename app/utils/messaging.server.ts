
import { redirect } from 'react-router'
import { prisma } from '#app/utils/db.server.ts'

type ParticipantId = string
type GroupData = { name: string } | null

interface CreateConversationOptions {
  initiatorId: ParticipantId
  participantIds: ParticipantId[]
  groupData?: GroupData
  checkExisting?: boolean
}

export async function createOrGetConversation({
  initiatorId,
  participantIds,
  groupData = null,
  checkExisting = true,
}: CreateConversationOptions) {
  // For direct messages, check if conversation already exists
  if (checkExisting && !groupData && participantIds.length === 1) {
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { every: { id: { in: [initiatorId, participantIds[0]] } } } },
          { group: null },
        ],
      },
    })

    if (existingConversation) {
      return { conversation: existingConversation, isNew: false }
    }
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        connect: [
          { id: initiatorId },
          ...participantIds.map(id => ({ id })),
        ],
      },
      group: groupData ? {
        create: groupData
      } : undefined,
    },
  })

  return { conversation, isNew: true }
}

export async function initiateConversation(options: CreateConversationOptions) {
  const { conversation } = await createOrGetConversation(options)
  return redirect(`/messages/${conversation.id}`)
}
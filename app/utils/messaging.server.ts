import { redirect } from 'react-router'
import { prisma } from '#app/utils/db.server.ts'

type ParticipantId = string

interface CreateConversationOptions {
	initiatorId: ParticipantId
	participantIds: ParticipantId[]
	conversationName?: string | null
	checkExisting?: boolean
}

export async function createOrGetConversation({
	initiatorId,
	participantIds,
	conversationName = null,
	checkExisting = true,
}: CreateConversationOptions) {
	// For direct messages, check if conversation already exists
	if (checkExisting && !conversationName && participantIds.length === 1) {

		const candidateConversations = await prisma.conversation.findMany({
			where: {
				participants: {
					every: { id: { in: [initiatorId, participantIds[0]] } },
				},
			},
			include: { participants: true },
		})

		function isDirectConversationBetween(
			conversation: { participants: { id: ParticipantId }[] },
			initiatorId: ParticipantId,
			participantId: ParticipantId
		): boolean {
			return (
				conversation.participants.length === 2 &&
				conversation.participants.some(p => p.id === initiatorId) &&
				conversation.participants.some(p => p.id === participantId)
			)
		}

		// Usage:
		const existingConversation = candidateConversations.find(c =>
			isDirectConversationBetween(c, initiatorId, participantIds[0])
		)

		if (existingConversation) {
			return { conversation: existingConversation, isNew: false }
		}
	}

	// Create new conversation with the name field
	const conversation = await prisma.conversation.create({
		data: {
			name: conversationName, // Now we can directly set the name
			participants: {
				connect: [{ id: initiatorId }, ...participantIds.map((id) => ({ id }))],
			},
		},
	})

	return { conversation, isNew: true }
}

export async function initiateConversation({
	initiatorId,
	participantIds,
	conversationName = null,
	checkExisting = false,
	initialMessage = '',
	attachmentId = null,
}: {
	initiatorId: string
	participantIds: string[]
	conversationName?: string | null
	checkExisting?: boolean
	initialMessage?: string
	attachmentId?: string | null
}) {
	const { conversation } = await createOrGetConversation({
		initiatorId,
		participantIds,
		conversationName,
		checkExisting,
	})

	if (initialMessage != '') {
		const message = await prisma.message.create({
			data: {
				content: initialMessage,
				senderId: initiatorId,
				conversationId: conversation.id,
				attachmentId,
			},
		})

		await prisma.conversation.update({
			where: { id: conversation.id },
			data: { lastMessageId: message.id },
		})
	}

	return redirect(`/messages/${conversation.id}`)
}
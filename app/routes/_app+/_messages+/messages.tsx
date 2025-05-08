import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Outlet, useLoaderData, useRevalidator } from 'react-router' // Assuming Epic Stack provides a socket hook
import { ConversationList } from '#app/components/messages/conversation-list.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { useMediaQuery } from '#app/hooks/use-media-query.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useSocket } from '#app/utils/socket.tsx'
import { type Route } from './+types/messages.ts'

export async function loader({ request, params}: Route.LoaderArgs) {
	const userId = await requireUserId(request)

	const activeConversationId: string | null = params.conversationId || null

	const conversations = await prisma.conversation.findMany({
		where: {
			participants: { some: { id: userId } },
		},
		select: {
			id: true,
			name: true, // Include the name field
			participants: {
				select: { id: true, name: true, username: true, image: { select: { id: true } } },
				where: { id: { not: userId } },
			},
			lastMessage: {
				select: { id: true, content: true, createdAt: true, senderId: true },
			},
			updatedAt: true,
		},
		orderBy: { updatedAt: 'desc' },
	})

	const lastMessageIds = conversations.map(conv => conv.lastMessage?.id).filter(Boolean) as string[]
	const seenMessages = await prisma.messageSeen.findMany({
		where: { messageId: { in: lastMessageIds }, userId },
		select: { messageId: true },
	})
	const seenMessageIds = new Set(seenMessages.map(m => m.messageId))

	const formattedConversations = conversations.map(conv => {
		const isGroup = !!conv.group || conv.participants.length > 1
		const lastMessage = conv.lastMessage
		const unread = lastMessage && lastMessage.senderId !== userId && !seenMessageIds.has(lastMessage.id)

		let name, image
		// Use conversation name if available
		if (conv.name) {
			name = conv.name
			image = '' // Default image for named conversations
		} else if (conv.group) {
			name = conv.group.name
			image = '' // Default group image
		} else if (conv.participants.length === 1) {
			const otherUser = conv.participants[0]
			name = otherUser?.name || otherUser?.username
			image = otherUser?.image?.id || ''
		} else {
			const otherParticipants = conv.participants
			name = otherParticipants.slice(0, 3).map(p => p.name || p.username).join(', ') + (otherParticipants.length > 3 ? '...' : '')
			image = '' // Default group image
		}

		return {
			id: conv.id,
			name,
			image,
			lastMessage: lastMessage?.content || '',
			timestamp: lastMessage?.createdAt.toISOString() || conv.updatedAt.toISOString(),
			unread,
		}
	})

	return { conversations: formattedConversations, userId, activeConversationId }
}

export default function MessagesPage() {
	const { conversations, userId, activeConversationId } = useLoaderData<typeof loader>()
	const socket = useSocket()
	const isMobile = useMediaQuery('(max-width: 768px)')
	const revalidator = useRevalidator()

	useEffect(() => {
		if (socket) {
			socket.emit('set-user-id', userId)
			socket.on('new-message', async () => {
				await revalidator.revalidate()
			})
			return () => {
				socket.off('new-message')
			}
		}
	}, [socket, userId, revalidator])

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold">Messages</h1>
				<Link to="/messages/new" prefetch="intent">
					<Button>New Conversation</Button>
				</Link>
			</div>

			<div className="overflow-hidden rounded-lg border shadow-sm">
				<div className="flex h-[calc(80vh-8rem)]">
					{!isMobile && (
						<div className={`${isMobile ? 'w-full' : 'w-1/3 border-r'}`}>
							<ConversationList conversations={conversations} activeConversationId={activeConversationId} />
						</div>
					)}
					{!isMobile && (
						<div className={`${isMobile ? 'w-full' : 'w-2/3'} flex flex-col`}>
							{isMobile && (
								<div className="border-b p-2">
									<Link to="../">
										<Button variant="ghost" size="sm">
											<ArrowLeft className="mr-2 h-4 w-4" />
											Back to conversations
										</Button>
									</Link>
								</div>
							)}
							<Outlet />
						</div>
					)}
				</div>
			</div>
		</main>
	)
}
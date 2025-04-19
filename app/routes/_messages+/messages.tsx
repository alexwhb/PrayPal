import { ArrowLeft } from 'lucide-react'
import { Link, Outlet } from 'react-router'
import { ConversationList } from '#app/components/messages/conversation-list.tsx'
import { EmptyConversation } from '#app/components/messages/empty-conversation.tsx'
import { type Conversation } from '#app/components/messages/messages-view.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { useMediaQuery } from '#app/hooks/use-media-query.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/messages.ts'

export async function loader({ request, params }: Route.LoaderArgs) {
	const userId = await requireUserId(request)

	const recipientUserId = params.recipientUserId

	// Fetch all messages involving the current user
	const messages = await prisma.message.findMany({
		where: {
			OR: [{ senderId: userId }, { recipientId: userId }],
		},
		select: {
			id: true,
			content: true,
			createdAt: true,
			senderId: true,
			recipientId: true,
			seen: true,
			sender: {
				select: {
					id: true,
					username: true,
					name: true,
					image: {
						select: { id: true },
					},
				},
			},
			recipient: {
				select: {
					id: true,
					username: true,
					name: true,
					image: {
						select: { id: true },
					},
				},
			},
		},
		orderBy: { createdAt: 'desc' },
	})

	// Process messages into conversations
	const conversationsMap = new Map<string, Conversation>()
	messages.forEach((msg) => {
		const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId
		const otherUser = msg.senderId === userId ? msg.recipient : msg.sender
		if (!conversationsMap.has(otherUserId)) {
			conversationsMap.set(otherUserId, {
				id: otherUserId,
				userId: otherUserId,
				userName: otherUser?.name || otherUser?.username,
				userImage: otherUser?.image?.id || '',
				lastMessage: msg.content,
				timestamp: msg.createdAt.toISOString(),
				unread: msg.senderId === otherUserId && !msg.seen,
			})
		} else if (msg.senderId === otherUserId && !msg.seen) {
			conversationsMap.get(otherUserId)!.unread = true
		}
	})
	const conversations = Array.from(conversationsMap.values())

	return { conversations, recipientUserId }
}

export default function MessagesPage({
	// actionData,
	loaderData,
}: Route.ComponentProps) {
	const { conversations, recipientUserId } = loaderData

	const isMobile = useMediaQuery('(max-width: 768px)')

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="mb-8 text-3xl font-bold">Messages</h1>

			<div className="overflow-hidden rounded-lg border shadow-sm">
				<div className="flex h-[calc(80vh-8rem)]">
					{/* Conversation List */}
					{!isMobile && (
						<div className={`${isMobile ? 'w-full' : 'w-1/3 border-r'}`}>
							<ConversationList
								conversations={conversations}
								activeConversationId={recipientUserId}
							/>
						</div>
					)}

					{/* Conversation View */}
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

							{recipientUserId ? <Outlet /> : <EmptyConversation />}
						</div>
					)}
				</div>
			</div>
		</main>
	)
}

import { formatDistanceToNow } from 'date-fns'
import { Send } from 'lucide-react'
import { useRef } from 'react'
import { Form } from 'react-router'
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '#app/components/ui/avatar.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { type Route } from './+types/messages.$recipientUserId.ts'


export async function loader({ request, params }: Route.LoaderArgs) {
	const recipientUserId = params.recipientUserId
	const userId = await requireUserId(request)

	console.log(recipientUserId, userId)

	// fetch message data
	const conversation = await prisma.message.findMany({
		where: {
			OR: [
				{ senderId: userId, recipientId: recipientUserId },
				{ senderId: recipientUserId, recipientId: userId },
			],
		},
		select: {
			id: true,
			sender: {
				select: {
					id: true,
					username: true,
					name: true,
				},
			},
			recipient: {
				select: {
					id: true,
					username: true,
					name: true,
				},
			},
			content: true,
			createdAt: true,
			seen: true,
		},
		orderBy: { createdAt: 'asc' },
	})

	const recipientUser = await prisma.user.findUnique({
		where: { id: recipientUserId },
		select: {
			id: true,
			name: true,
			username: true,
			image: { select: { id: true } },
		},
	})

	console.log(JSON.stringify(conversation))
	return { conversation, recipientUser, userId }
}

export default function MessagesPage({ loaderData }: Route.ComponentProps) {
	const { conversation, recipientUser, userId } = loaderData

	const messagesEndRef = useRef(null)

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center gap-3 border-b p-4">
				<Avatar>
					<AvatarImage
						src={getUserImgSrc(recipientUser?.image?.id)}
						alt={recipientUser?.name ?? recipientUser?.username}
					/>
					<AvatarFallback>{recipientUser?.username.charAt(0)}</AvatarFallback>
				</Avatar>
				<div>
					<h3 className="font-medium">{recipientUser?.name ?? recipientUser?.username}</h3>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 space-y-4 overflow-y-auto p-4">
				{conversation.map((message) => (
					<div
						key={message.id}
						className={`flex ${message.sender.id === userId ? 'justify-end' : 'justify-start'}`}
					>
						<div
							className={`max-w-[80%] rounded-lg p-3 ${
								message.sender.id === userId
									? 'bg-primary text-primary-foreground'
									: 'bg-muted'
							}`}
						>
							<p className="text-sm">{message.content}</p>
							<p className="mt-1 text-xs opacity-70">
								{formatDistanceToNow(message.createdAt, { addSuffix: true })}
							</p>
						</div>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>

			{/* Message Input */}
			<div className="border-t p-4">
				<Form  className="flex gap-2">
					<Input
						placeholder="Type a message..."
						className="flex-1"
					/>
					<Button type="submit" size="icon">
						<Send className="h-4 w-4" />
						<span className="sr-only">Send</span>
					</Button>
				</Form>
			</div>
		</div>
	)
}
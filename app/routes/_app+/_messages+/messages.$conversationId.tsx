import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Img } from 'openimg/react'
import { useEffect, useRef, useState } from 'react'
import { data, useFetcher, useRevalidator } from 'react-router'
import io from 'socket.io-client'
import { z } from 'zod'
import { TextareaField } from '#app/components/forms.tsx'
import { MessageBubble } from '#app/components/messages/message-bubble.tsx'
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '#app/components/ui/avatar.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { useSocket } from '#app/utils/socket.tsx'
import { type Route } from './+types/messages.$conversationId.ts'

const MESSAGES_PER_PAGE = 50

export async function loader({ request, params }: Route.LoaderArgs) {
	const conversationId = params.conversationId
	const userId = await requireUserId(request)
	const url = new URL(request.url)
	const page = Number(url.searchParams.get('page') || '1')

	const conversation = await prisma.conversation.findUnique({
		where: { id: conversationId },
		include: {
			participants: {
				select: {
					id: true,
					name: true,
					username: true,
					image: { select: { id: true } },
				},
			},
			messages: {
				orderBy: { createdAt: 'desc' },
				take: MESSAGES_PER_PAGE,
				skip: (page - 1) * MESSAGES_PER_PAGE,
				select: {
					id: true,
					content: true,
					createdAt: true,
					sender: {
						select: {
							id: true,
							username: true,
							name: true,
							image: { select: { object: true } },
						},
					},
					attachment: {
						select: {
							id: true,
							type: true,
							referenceId: true,
							metadata: true,
						},
					},
				},
			},
		},
	})

	if (!conversation)
		throw new Response('Conversation not found', { status: 404 })

	// Get total message count for pagination
	const totalMessages = await prisma.message.count({
		where: { conversationId },
	})

	// Use conversation name if available, otherwise generate from participants
	let name, image
	if (conversation.name) {
		name = conversation.name
		image = ''
	} else if (conversation.group) {
		name = conversation.group.name
		image = ''
	} else if (conversation.participants.length === 1) {
		const otherUser = conversation.participants.find((p) => p.id !== userId)
		name = otherUser?.name || otherUser?.username
		image = otherUser?.image?.objectKey || ''
	} else {
		const otherParticipants = conversation.participants.filter(
			(p) => p.id !== userId,
		)
		name =
			otherParticipants
				.slice(0, 3)
				.map((p) => p.name || p.username)
				.join(', ') + (otherParticipants.length > 3 ? '...' : '')
		image = ''
	}

	// Reverse messages to display in ascending order
	const messages = [...conversation.messages].reverse()

	return data({
		conversation,
		messages,
		name,
		image,
		userId,
		conversationId,
		pagination: {
			page,
			totalMessages,
			hasMore: page * MESSAGES_PER_PAGE < totalMessages,
		},
	})
}

export const MessageSchema = z.object({
	message: z.string().max(1000),
	conversationId: z.string(),
})

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'mark-seen') {
		const conversationId = formData.get('conversationId')
		if (typeof conversationId !== 'string') return null

		const unseenMessages = await prisma.message.findMany({
			where: {
				conversationId,
				messageSeen: { none: { userId } },
			},
			select: { id: true },
		})
		const messageIds = unseenMessages.map((m) => m.id)
		await prisma.messageSeen.createMany({
			data: messageIds.map((messageId) => ({ messageId, userId })),
		})
		return null
	}

	const submission = parseWithZod(formData, { schema: MessageSchema })
	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { message, conversationId } = submission.value
	const newMessage = await prisma.message.create({
		data: { senderId: userId, conversationId, content: message },
		include: {
			sender: {
				select: {
					id: true,
					username: true,
					name: true,
					image: { select: { id: true } },
				},
			},
		},
	})

	await prisma.conversation.update({
		where: { id: conversationId },
		data: { lastMessageId: newMessage.id },
	})

	const conversation = await prisma.conversation.findUnique({
		where: { id: conversationId },
		include: { participants: { select: { id: true } } },
	})

	if (!conversation) return null

	// Get recipient IDs (everyone except sender)
	const recipientIds = conversation.participants
		.map((p) => p.id)
		.filter((id) => id !== userId)

	// Emit socket event directly
	const socket = io(
		process.env.NODE_ENV === 'production'
			? 'https://your-app.fly.dev'
			: 'http://localhost:3000',
		{ withCredentials: true },
	)

	socket.emit('new-message', {
		conversationId,
		message: newMessage,
		recipientIds,
	})

	return data({ success: true })
}

export default function ConversationPage({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { messages, name, userId, conversationId, conversation } = loaderData
	const formRef = useRef<HTMLFormElement>(null)
	const fetcher = useFetcher<typeof action>()
	const socket = useSocket()
	const messagesEndRef = useRef(null)
	const revalidator = useRevalidator()
	const [hasMarkedSeen, setHasMarkedSeen] = useState(false)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const [form, fields] = useForm({
		id: 'message-form',
		constraint: getZodConstraint(MessageSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: MessageSchema })
		},
		defaultValue: { message: '', conversationId },
	})

	useEffect(
		function resetFormOnSuccess() {
			if (fetcher.state === 'idle' && fetcher.data?.success) {
				formRef.current?.reset()
				// Maintain focus after form reset
				textareaRef.current?.focus()
			}
		},
		[fetcher.state, fetcher.data],
	)

	useEffect(() => {
		if (!hasMarkedSeen && fetcher.state === 'idle' && !fetcher.data) {
			setHasMarkedSeen(true)
			void fetcher.submit(
				{ intent: 'mark-seen', conversationId },
				{ method: 'post' },
			)
		}
	}, [fetcher, conversationId, hasMarkedSeen])

	useEffect(() => {
		if (!socket || !userId) return

		const handleMessageReceived = (data: {
			conversationId: string
			message: any
		}) => {
			console.log('Received message:', data)
			if (data.conversationId === conversationId) {
				console.log('Revalidating conversation:', conversationId)
				void revalidator.revalidate()
			}
		}

		const handleConnectionAck = (data: {
			userId: string
			socketId: string
		}) => {
			console.log('Connection acknowledged:', data)
		}

		console.log('Setting up socket listeners for user:', userId)
		socket.emit('set-user-id', userId)

		socket.on('user-connected-ack', handleConnectionAck)
		socket.on('message-received', handleMessageReceived)

		return () => {
			console.log('Cleaning up socket listeners for user:', userId)
			socket.off('user-connected-ack', handleConnectionAck)
			socket.off('message-received', handleMessageReceived)
		}
	}, [socket, userId, conversationId, revalidator])

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	const getGroupAvatars = () => {
		const otherParticipants = conversation.participants
			.filter((p) => p.id !== userId)
			.slice(0, 3)

		return (
			<div className="relative flex">
				{otherParticipants.map((participant, index) => (
					<div
						key={participant.id}
						className="border-background relative rounded-full border-2"
						style={{
							marginLeft: index > 0 ? '-0.75rem' : '0',
							zIndex: 3 - index,
						}}
					>
						<Avatar className="h-8 w-8">
							<AvatarImage
								src={getUserImgSrc(participant.image.objectKey)}
								asChild
							>
							<Img
								src={getUserImgSrc(participant.image.objectKey)}
								alt={participant.name || participant.username}
								className="h-full w-full object-cover"
								width={64}
								height={64}
							/>
							</AvatarImage>
							<AvatarFallback>
								{(participant.name || participant.username)[0]}
							</AvatarFallback>
						</Avatar>
					</div>
				))}
			</div>
		)
	}

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			formRef.current?.requestSubmit()
		}
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center gap-3 border-b p-4">
				{/*{conversation.group || conversation.participants.length > 1 ? (*/}
				{/*	getGroupAvatars()*/}
				{/*) : (*/}
				{/*	<Avatar>*/}
				{/*		{image ? (*/}
				{/*			<AvatarImage src={getUserImgSrc(image)} alt={name} />*/}
				{/*		) : (*/}
				{/*			<AvatarFallback>{name[0]}</AvatarFallback>*/}
				{/*		)}*/}
				{/*	</Avatar>*/}
				{/*)}*/}
				<div>
					<h3 className="font-medium">{name}</h3>
				</div>
			</div>

			<div className="flex-1 space-y-4 overflow-y-auto p-4">
				{messages.map((message) => (
					<MessageBubble key={message.id} message={message} userId={userId} />
				))}
				<div ref={messagesEndRef} />
			</div>

			<div className="border-t p-4">
				<fetcher.Form
					ref={formRef}
					method="POST"
					{...getFormProps(form)}
					className="flex items-center gap-2"
				>
					<input type="hidden" name="conversationId" value={conversationId} />
					<TextareaField
						labelProps={{ htmlFor: 'message' }}
						textareaProps={{
							...getInputProps(fields.message, { type: 'text' }),
							maxLength: 1000,
							rows: 1,
							className: 'flex-1 resize-none overflow-hidden',
							onKeyDown: handleKeyDown,
							ref: textareaRef, // Add ref to maintain focus
						}}
						errors={fields?.message?.errors}
						className="flex-1"
					>
						<div className="text-muted-foreground absolute right-4 bottom-4 text-xs">
							{fields.message.value?.length ?? 0} / 1000
						</div>
					</TextareaField>
					<Button type="submit" size="icon" className="h-10">
						<Icon name="paper-plane" />
						<span className="sr-only">Send</span>
					</Button>
				</fetcher.Form>
			</div>
		</div>
	)
}

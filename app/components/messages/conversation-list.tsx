import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router'

import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar'
import { Badge } from '#app/components/ui/badge'
import  { type loader } from '#app/routes/_messages+/messages.tsx'
import { getUserImgSrc } from '#app/utils/misc.tsx'


export type Conversation = Awaited<ReturnType<typeof loader>>['conversations'][number]


export function ConversationList({
																	 conversations,
																	 activeConversationId,
																 }: {
	conversations: Conversation[]
	activeConversationId: string | null
}) {
	return (
		<div className="flex h-full flex-col">
			<div className="border-b p-4">
				<h2 className="font-semibold">Conversations</h2>
			</div>
			<div className="flex-1 overflow-y-auto">
				{conversations.length > 0 ? (
					<div className="divide-y">
						{conversations.map((conversation) => (
							<Link
								key={conversation.id}
								to={`/messages/${conversation.id}`}
								prefetch="intent"
							>
								<div
									className={`cursor-pointer p-4 hover:bg-muted/50 ${
										activeConversationId === conversation.id ? 'bg-muted' : ''
									}`}
								>
									<div className="flex items-start gap-3">
										<Avatar>
											{conversation.image ? (
												<AvatarImage
													src={getUserImgSrc(conversation.image)}
													alt={conversation.name}
												/>
											) : (
												<AvatarFallback>
													{conversation.name.charAt(0)}
												</AvatarFallback>
											)}
										</Avatar>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between">
												<h3 className="truncate font-medium">
													{conversation.name}
												</h3>
												<span className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.timestamp), {
														addSuffix: true,
													})}
                        </span>
											</div>
											<div className="mt-1 flex items-center justify-between">
												<p className="truncate text-sm text-muted-foreground">
													{conversation.lastMessage}
												</p>
												{conversation.unread && (
													<Badge
														variant="default"
														className="ml-2 h-2 w-2 rounded-full p-0"
													/>
												)}
											</div>
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				) : (
					<div className="p-4 text-center text-muted-foreground">
						No conversations yet
					</div>
				)}
			</div>
		</div>
	)
}
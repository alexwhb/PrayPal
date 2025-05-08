
import { X } from "lucide-react"
import { useState, useEffect } from "react"
import { Form, useSearchParams } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from "#app/components/ui/avatar"
import { Badge } from "#app/components/ui/badge"
import { Button } from "#app/components/ui/button"
import { Input } from "#app/components/ui/input"
import { Label } from "#app/components/ui/label"
import { requireUserId } from "#app/utils/auth.server"
import { prisma } from "#app/utils/db.server"
import { initiateConversation } from '#app/utils/messaging.server.ts'
import { getUserImgSrc } from "#app/utils/misc"
import { type Route } from './+types/messages.new.ts'

export async function loader({ request } :Route.LoaderArgs) {
	const url = new URL(request.url)
	const searchQuery = url.searchParams.get('search')?.toLowerCase() || ''

	const users = await prisma.$queryRaw`
		SELECT 
			"User".id,
			"User".name,
			"User".username,
			"UserImage".id as "imageId"
		FROM "User"
		LEFT JOIN "UserImage" ON "User".id = "UserImage"."userId"
		WHERE LOWER("User".name) LIKE ${`%${searchQuery}%`}
		OR LOWER("User".username) LIKE ${`%${searchQuery}%`}
		LIMIT 10
	`
	
	return { users }
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const selectedUserIds = formData.getAll('participants') as string[]
	const conversationName = formData.get('conversationName') as string

	const isMultiUser = selectedUserIds.length > 1
	
	// Create a default conversation name if none provided for multi-user chats
	let finalConversationName = conversationName || null
	if (isMultiUser && !finalConversationName) {
		// Get user details to create a default conversation name
		const participants = await prisma.user.findMany({
			where: { id: { in: [...selectedUserIds, userId] } },
			select: { id: true, name: true, username: true }
		})
		
		// Create a conversation name from participant names (up to 3)
		const names = participants.map(p => p.name || p.username)
		finalConversationName = names.slice(0, 3).join(', ') + (names.length > 3 ? '...' : '')
	}
  
	return initiateConversation({
		initiatorId: userId,
		participantIds: selectedUserIds,
		conversationName: isMultiUser ? finalConversationName : null, // Only set name for multi-user conversations
		checkExisting: !isMultiUser, // Only check existing for direct messages
	})
}

type User = Awaited<ReturnType<typeof loader>>['users'][number]

export default function NewConversation({loaderData}: Route.ComponentProps) {
	const { users } = loaderData
	const [searchParams, setSearchParams] = useSearchParams()
	const [selectedUsers, setSelectedUsers] = useState([])
	const [conversationName, setConversationName] = useState('')
	const [isMultiUser, setIsMultiUser] = useState(false)

	// Update isMultiUser state when selectedUsers changes
	useEffect(() => {
		setIsMultiUser(selectedUsers.length > 1)
	}, [selectedUsers])

	const handleSearch = (value) => {
		setSearchParams({ search: value })
	}

	const handleUserSelect = (user: User) => {
		setSelectedUsers(prev => [...prev, user])
		setSearchParams({}) // Clear search when user is selected
	}

	const handleUserRemove = (userId : string) => {
		setSelectedUsers(prev => prev.filter(u => u.id !== userId))
	}

	const availableUsers = users.filter((user : User) =>
		!selectedUsers.some((selected: User) => selected.id === user.id)
	)

	// Generate default conversation name from selected users
	const generateDefaultConversationName = () => {
		if (selectedUsers.length === 0) return ''
		const names = selectedUsers.map(user => user.name || user.username)
		return names.slice(0, 3).join(', ') + (names.length > 3 ? '...' : '')
	}

	return (
		<div className="flex flex-col h-full">
			<div className="p-4 border-b border-border">
				<h2 className="text-xl font-medium mb-4">New Message</h2>

				<Form method="post">
					<div className="flex flex-wrap items-center gap-2 p-2 border rounded-md focus-within:ring-1 focus-within:ring-ring mb-4">
						<span className="text-sm font-medium">To:</span>

						{selectedUsers.map((user) => (
							<Badge key={user.id} variant="secondary" className="flex items-center gap-1 py-1">
								{user.name || user.username}
								<button type="button" onClick={() => handleUserRemove(user.id)}>
									<X className="h-3 w-3" />
								</button>
								<input type="hidden" name="participants" value={user.id} />
							</Badge>
						))}

						<input
							type="text"
							className="flex-1 bg-transparent border-none outline-none text-sm min-w-[120px]"
							placeholder={selectedUsers.length > 0 ? "" : "Search users..."}
							value={searchParams.get('search') || ''}
							onChange={(e) => handleSearch(e.target.value)}
						/>
					</div>

					{isMultiUser && (
						<div className="mb-4">
							<Label htmlFor="conversationName" className="block text-sm font-medium mb-1">
								Conversation Name
							</Label>
							<Input
								id="conversationName"
								name="conversationName"
								value={conversationName}
								onChange={(e) => setConversationName(e.target.value)}
								placeholder={generateDefaultConversationName()}
								className="w-full"
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Leave blank to use participants' names
							</p>
						</div>
					)}

					{searchParams.get('search') && availableUsers.length > 0 && (
						<div className="mt-1 border rounded-md shadow-sm">
							{availableUsers.map((user) => (
								<div
									key={user.id}
									className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
									onClick={() => handleUserSelect(user)}
								>
									<Avatar className="h-6 w-6">
										{user.imageId ? (
											<AvatarImage src={getUserImgSrc(user.imageId)} alt={user.name || user.username} />
										) : (
											<AvatarFallback>{(user.name || user.username)[0]}</AvatarFallback>
										)}
									</Avatar>
									<span className="text-sm">{user.name || user.username}</span>
								</div>
							))}
						</div>
					)}

					<div className="flex justify-between mt-4">
						<Button variant="outline" type="button" onClick={() => history.back()}>
							Cancel
						</Button>
						<Button type="submit" disabled={selectedUsers.length === 0}>
							Start Conversation
						</Button>
					</div>
				</Form>
			</div>

			<div className="flex-1 flex items-center justify-center text-muted-foreground">
				<p>Select recipients to start a conversation</p>
			</div>
		</div>
	)
}

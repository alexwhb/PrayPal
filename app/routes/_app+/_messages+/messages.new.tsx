
import { X } from "lucide-react"
import { useState } from "react"
import { Form, useSearchParams } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from "#app/components/ui/avatar"
import { Badge } from "#app/components/ui/badge"
import { Button } from "#app/components/ui/button"
import { requireUserId } from "#app/utils/auth.server"
import { prisma } from "#app/utils/db.server"
import { initiateConversation } from '#app/utils/messaging.server.ts'
import { getUserImgSrc } from "#app/utils/misc"
import  { type Route } from './+types/messages.new.ts'

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

	const isGroup = selectedUserIds.length > 1
  
	return initiateConversation({
		initiatorId: userId,
		participantIds: selectedUserIds,
		groupData: isGroup ? { name: '' } : null, // You might want to add group name handling
		checkExisting: !isGroup, // Only check existing for direct messages
	})
}

type User = Awaited<ReturnType<typeof loader>>['users'][number]

export default function NewConversation({loaderData}: Route.ComponentProps) {
	const { users } = loaderData
	const [searchParams, setSearchParams] = useSearchParams()
	const [selectedUsers, setSelectedUsers] = useState([])

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

	return (
		<div className="flex flex-col h-full">
			<div className="p-4 border-b border-border">
				<h2 className="text-xl font-medium mb-4">New Message</h2>

				<Form method="post">
					<div className="flex flex-wrap items-center gap-2 p-2 border rounded-md focus-within:ring-1 focus-within:ring-ring">
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

					{searchParams.get('search') && availableUsers.length > 0 && (
						<div className="mt-1 border rounded-md shadow-sm">
							{availableUsers.map((user) => (
								<div
									key={user.id}
									className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
									onClick={() => handleUserSelect(user)}
								>
									<Avatar className="h-6 w-6">
										{user.image?.id ? (
											<AvatarImage src={getUserImgSrc(user.image.id)} alt={user.name || user.username} />
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
import { Img } from 'openimg/react'
import { useCallback, useState } from 'react'
import { useFetcher } from 'react-router'
import { UserAutocomplete } from '#app/components/groups/user-autocomplet.tsx'
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '#app/components/ui/avatar.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Label } from '#app/components/ui/label.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#app/components/ui/select.tsx'
import { type UserSearchResult } from '#app/routes/resources+/users.search.tsx'
import { getUserImgSrc } from '#app/utils/misc.tsx'

interface UserRoleSelectorProps {
	onSubmit: (userId: string, role: string) => void
	existingAdmins?: Array<{
		id: string
		name: string | null
		username: string
		imageId?: string | null
		roles: Array<{ name: string }>
	}>
	existingModerators?: Array<{
		id: string
		name: string | null
		username: string
		imageId?: string | null
		roles: Array<{ name: string }>
	}>
}

export function UserRoleSelector({
	onSubmit,
	existingAdmins = [],
	existingModerators = [],
}: UserRoleSelectorProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
		null,
	)
	const [selectedRole, setSelectedRole] = useState<string>('moderator')

	const userFetcher = useFetcher<UserSearchResult[]>()

	const fetchUsers = useCallback(
		async (newQuery: string) => {
			if (query === newQuery) return
			setQuery(newQuery)
			await userFetcher.load(`/resources/users/search?q=${newQuery}`)
		},
		[userFetcher, query],
	)

	const onSelect = useCallback((user: UserSearchResult) => {
		setSelectedUser(user)
		setIsOpen(false)
	}, [])

	const handleSubmit = () => {
		if (selectedUser) {
			onSubmit(selectedUser.id, selectedRole)
			setSelectedUser(null)
			setSelectedRole('moderator')
		}
	}

	const handleRemoveRole = (userId: string, role: string) => {
		onSubmit(userId, `remove-${role}`)
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Assign User Role</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="user-search">Search User</Label>
							<UserAutocomplete
								isLoading={userFetcher.state === 'loading'}
								isOpen={isOpen}
								setIsOpen={setIsOpen}
								onSelect={onSelect}
								users={userFetcher.data ?? []}
								onQueryChange={fetchUsers}
								className="w-full"
							/>
						</div>

						{selectedUser && (
							<div className="flex items-center gap-2 rounded-md border p-2">
								<Avatar className="h-8 w-8">
									<AvatarImage
										src={getUserImgSrc(selectedUser.objectKey)}
										asChild
									/>
									<Img
										src={getUserImgSrc(selectedUser.objectKey)}
										alt={selectedUser.name || selectedUser.username}
										className="h-full w-full object-cover"
										width={64}
										height={64}
									/>
									<AvatarFallback>
										{(selectedUser.name || selectedUser.username)[0]}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<p className="text-sm font-medium">
										{selectedUser.name || selectedUser.username}
									</p>
									<p className="text-muted-foreground text-xs">
										{selectedUser.email}
									</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setSelectedUser(null)}
								>
									<Icon name="x" size="sm" />
								</Button>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="role">Role</Label>
							<Select value={selectedRole} onValueChange={setSelectedRole}>
								<SelectTrigger id="role">
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="moderator">Moderator</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Button
							onClick={handleSubmit}
							disabled={!selectedUser}
							className="w-full"
						>
							<Icon name="user-plus" size="sm" className="mr-2" />
							Assign Role
						</Button>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Administrators</CardTitle>
					</CardHeader>
					<CardContent>
						{existingAdmins.length > 0 ? (
							<div className="space-y-2">
								{existingAdmins.map((admin) => (
									<div
										key={admin.id}
										className="flex items-center justify-between rounded-md border p-2"
									>
										<div className="flex items-center gap-2">
											<Avatar className="h-8 w-8">
												<AvatarImage
													src={getUserImgSrc(admin.imageId)}
													asChild
												/>
												<Img
													src={getUserImgSrc(admin.imageId)}
													alt={admin.name || admin.username}
													className="h-full w-full object-cover"
													width={64}
													height={64}
												/>
												<AvatarFallback>
													{(admin.name || admin.username)[0]}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="text-sm font-medium">
													{admin.name || admin.username}
												</p>
											</div>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleRemoveRole(admin.id, 'admin')}
										>
											Remove
										</Button>
									</div>
								))}
							</div>
						) : (
							<p className="text-muted-foreground py-4 text-center">
								No administrators found
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Moderators</CardTitle>
					</CardHeader>
					<CardContent>
						{existingModerators.length > 0 ? (
							<div className="space-y-2">
								{existingModerators.map((moderator) => (
									<div
										key={moderator.id}
										className="flex items-center justify-between rounded-md border p-2"
									>
										<div className="flex items-center gap-2">
											<Avatar className="h-8 w-8">
												<AvatarImage
													src={getUserImgSrc(moderator.imageId)}
													asChild
												/>
												<Img
													src={getUserImgSrc(moderator.imageId)}
													alt={moderator.name || moderator.username}
													className="h-full w-full object-cover"
													width={64}
													height={64}
												/>

												<AvatarFallback>
													{(moderator.name || moderator.username)[0]}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="text-sm font-medium">
													{moderator.name || moderator.username}
												</p>
											</div>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handleRemoveRole(moderator.id, 'moderator')
											}
										>
											Remove
										</Button>
									</div>
								))}
							</div>
						) : (
							<p className="text-muted-foreground py-4 text-center">
								No moderators found
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

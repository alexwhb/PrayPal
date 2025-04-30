import { invariantResponse } from '@epic-web/invariant'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, CalendarDays, MessageCircle, Trash, Users } from 'lucide-react'
import { useState } from 'react'
import {
	data,
	Form,
	Link,
	type LoaderFunctionArgs, redirect, useLoaderData,
} from 'react-router'

import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { DeleteDialog } from '#app/components/shared/delete-dialog.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Card, CardContent, CardHeader } from '#app/components/ui/card.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '#app/components/ui/tabs.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { formatDate } from '#app/utils/formatter.ts'
import { createOrGetConversation } from '#app/utils/messaging.server.ts'
import { getUserImgSrc  } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { useOptionalUser, userHasRole } from '#app/utils/user.ts'
import { type Route } from './+types/$username.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

type UserRequest = {
	id: string
	type: string
	description: string
	category: { name: string }
	createdAt: Date
	fulfilled: boolean
	response?: { message: string } | null
}

function ActivityTab() {
	return (
		<Card>
			<CardContent className="p-6 text-center text-muted-foreground">
				Activity feed will be shown here in a future update.
			</CardContent>
		</Card>
	)
}

function NeedsTab({ requests, userDisplayName }: { requests: UserRequest[], userDisplayName: string }) {
	const needs = requests.filter(r => r.type === 'NEED')
	
	if (needs.length === 0) {
		return (
			<Card>
				<CardContent className="p-6 text-center text-muted-foreground">
					{userDisplayName} hasn't posted any needs yet.
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-4">
			{needs.map(need => (
				<Card key={need.id}>
					<CardHeader className="pb-2">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-2">
								<MessageCircle className="h-4 w-4 text-rose-500" />
								<Badge variant="secondary">{need.category.name}</Badge>
							</div>
							<div className="text-xs text-muted-foreground">
								{formatDistanceToNow(need.createdAt, { addSuffix: true })}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-sm">{need.description}</p>
						{need.fulfilled && (
							<div className="mt-2 text-sm font-medium text-green-600">
								This need has been fulfilled
							</div>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	)
}

function PrayersTab({ requests, userDisplayName }: { requests: UserRequest[], userDisplayName: string }) {
	if (requests.length === 0) {
		return (
			<Card>
				<CardContent className="p-6 text-center text-muted-foreground">
					{userDisplayName} hasn't posted any prayer requests yet.
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-4">
			{requests.map(prayer => (
				<Card key={prayer.id}>
					<CardHeader className="pb-2">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-2">
								<MessageCircle className="h-4 w-4 text-blue-500" />
								<Badge variant="secondary">{prayer.category.name}</Badge>
							</div>
							<div className="text-xs text-muted-foreground">
								{formatDistanceToNow(prayer.createdAt, { addSuffix: true })}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-sm">{prayer.description}</p>
						{prayer.fulfilled && prayer.response?.message && (
							<div className="mt-2 rounded-md border border-green-100 bg-green-50 p-3">
								<p className="mb-1 text-sm font-medium text-green-800">
									Prayer Answered:
								</p>
								<p className="text-sm text-green-700">
									{prayer.response.message}
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	)
}

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)

	const loggedInUser = await prisma.user.findFirst({
		select: {
			roles: true,
		},
		where: {
			id: userId,
		},
	})

	console.log('loggedInUser', loggedInUser)
	const roles =  ['admin', 'moderator']
	const canModerate =  loggedInUser?.roles.some((r) => roles.includes(r.name) ) ?? false


	const user = await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			username: true,
			createdAt: true,
			image: { select: { id: true } },
			roles: true,
			requests: {
				where: {
					status: 'ACTIVE'
				},
				select: {
					id: true,
					type: true,
					description: true,
					category: { select: { name: true } },
					createdAt: true,
					fulfilled: true,
					fulfilledAt: true,
					response: true
				},
				orderBy: { createdAt: 'desc' },
			},
			groupMemberships: {
				select: {
					group: {
						select: {
							id: true,
							name: true
						}
					}
				}
			}
		},
		where: {
			username: params.username,
		},
	})

	if (!user) {
		throw new Response('Not Found', { status: 404 })
	}


console.log('canModerate', canModerate)

	return data({
		user,
		userJoinedDisplay: formatDate(user.createdAt),
		canModerate: canModerate , // todo userHasRole(user, ['admin', 'moderator'])
	})
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const _action = formData.get('_action')

	if (_action === 'generateReferral') {
		const userId = await requireUserId(request)
		const referralLink = await prisma.referralLink.create({
			data: {
				createdById: userId,
				expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
			},
		})
		return data({ referralLink })
	}

	if (_action === 'startConversation') {
		const participantId = formData.get('participantId') as string
		const { conversation } = await createOrGetConversation({
			initiatorId: await requireUserId(request),
			participantIds: [participantId],
			checkExisting: true,
		})

		return redirect(`/messages/${conversation.id}`)
	}

	if (_action === 'deleteUser') {
		const targetUserId = formData.get('userId') as string
		const reason = formData.get('reason') as string

		// Verify moderator status
		const user = await prisma.user.findUnique({
			where: { id: await requireUserId(request) },
			include: { roles: true },
		})

		invariantResponse(
			user?.roles.some((role) => ['admin', 'moderator'].includes(role.name)),
			'Unauthorized',
			{ status: 403 },
		)

		// Log moderation action
		await prisma.moderationLog.create({
			data: {
				moderatorId: await requireUserId(request),
				itemId: targetUserId,
				itemType: 'USER',
				action: 'DELETE',
				reason: reason || 'User moderation action',
			},
		})

		// Delete user and all related data
		await prisma.user.delete({
			where: { id: targetUserId },
		})

		return redirectWithToast('/', {
			title: 'User Deleted',
			description: 'User account has been permanently deleted',
			type: 'success',
		})
	}
}

export default function ProfileRoute() {
	const data = useLoaderData<typeof loader>()
	const user = data.user
	const userDisplayName = user.name ?? user.username
	const loggedInUser = useOptionalUser()
	const isLoggedInUser = user.id === loggedInUser?.id
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	// const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
	// const referralFetcher = useFetcher()

	return (
		<div className="mx-auto max-w-3xl px-4">
			<div className="mb-6">
				<Link
					to="/users"
					className="flex items-center text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Users
				</Link>
			</div>

			<div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:items-start">
				<div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-background shadow-md">
					<img
						src={getUserImgSrc(user.image?.id)}
						alt={userDisplayName}
						className="h-full w-full object-cover"
					/>
				</div>

				<div className="flex-1 text-center md:text-left">
					<h1 className="mb-2 text-3xl font-bold">{userDisplayName}</h1>

					<div className="mb-4 flex items-center justify-center text-muted-foreground md:justify-start">
						<CalendarDays className="mr-2 h-4 w-4" />
						<span>Member since {data.userJoinedDisplay}</span>
					</div>

					{user.groupMemberships.length > 0 && (
						<div className="mb-6">
							<div className="mb-2 flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">Groups</span>
							</div>
							<div className="flex flex-wrap gap-2">
								{user.groupMemberships.map((membership) => (
									<Badge 
										key={membership.group.id} 
										variant="secondary"
									>
										{membership.group.name}
									</Badge>
								))}
							</div>
						</div>
					)}

					<div className="flex flex-wrap justify-center gap-4 md:justify-start">
						{isLoggedInUser ? (
							<>
								<Button asChild>
									<Link to="/settings/profile">Edit Profile</Link>
								</Button>
								<Form action="/logout" method="POST">
									<Button type="submit" variant="outline">
										<Icon name="exit" className="mr-2 h-4 w-4" />
										Logout
									</Button>
								</Form>
							</>
						) : (
							<>
								{loggedInUser && (
									<>
										<Form method="POST">
											<input type="hidden" name="_action" value="startConversation" />
											<input type="hidden" name="participantId" value={user.id} />
											<Button type="submit" variant="secondary">
												<MessageCircle className="mr-2 h-4 w-4" />
												Message
											</Button>
										</Form>
										{data.canModerate && (
											<Button
												variant="destructive"
												onClick={() => setIsDeleteDialogOpen(true)}
											>
												<Trash className="mr-2 h-4 w-4" />
												Delete User
											</Button>
										)}
									</>
								)}
							</>
						)}
					</div>
				</div>
			</div>

			<Tabs defaultValue="activity">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="activity">Activity</TabsTrigger>
					<TabsTrigger value="needs">Needs</TabsTrigger>
					<TabsTrigger value="prayers">Prayer Requests</TabsTrigger>
				</TabsList>

				<TabsContent value="activity">
					<ActivityTab />
				</TabsContent>

				<TabsContent value="needs">
					<NeedsTab 
						requests={user.requests}
						userDisplayName={userDisplayName}
					/>
				</TabsContent>

				<TabsContent value="prayers">
					<PrayersTab 
						requests={user.requests}
						userDisplayName={userDisplayName}
					/>
				</TabsContent>
			</Tabs>

			<DeleteDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				additionalFormData={{
					userId: user.id,
					_action: 'deleteUser',
				}}
				isModerate={true}
			/>
		</div>
	)
}


export const meta: Route.MetaFunction = ({ data, params }) => {
	const displayName = data?.user.name ?? params.username
	return [
		{ title: `${displayName} | Podcasty` },
		{
			name: 'description',
			content: `Profile of ${displayName} on Podcasty`,
		},
	]
}


export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No user with the username "{params.username}" exists</p>
				),
			}}
		/>
	)
}

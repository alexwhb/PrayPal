import { invariantResponse } from '@epic-web/invariant'
import { useState } from 'react'
import { data, Form, Link, Outlet, redirect } from 'react-router'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { DeleteDialog } from '#app/components/shared/delete-dialog.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Img } from 'openimg/react'
import {
	Tabs,
	TabsList,
	TabsTrigger,
} from '#app/components/ui/tabs.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { formatDate } from '#app/utils/formatter.ts'
import { createOrGetConversation } from '#app/utils/messaging.server.ts'
import { getUserImgSrc  } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'
import { type Route } from './+types/$username.ts'


export async function loader({ params, request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)

	// redirect to the payer tab if we are just at /users/:username
	const url = new URL(request.url)
	if (url.pathname === `/users/${params.username}`) {
		return redirect(`/users/${params.username}/prayers`)
	}

	const idx = url.pathname.lastIndexOf('/')
	const tab = url.pathname.slice(idx + 1)

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
			image: { select: { objectKey: true } },
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

	return data({
		user,
		userJoinedDisplay: formatDate(user.createdAt),
		canModerate: canModerate , // todo userHasRole(user, ['admin', 'moderator']),
		tab,
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

export default function ProfileRoute({loaderData}: Route.ComponentProps) {
	const { user, userJoinedDisplay, canModerate, tab }  = loaderData
	// const user = data.user
	const userDisplayName = user.name ?? user.username
	const loggedInUser = useOptionalUser()
	const isLoggedInUser = user.id === loggedInUser?.id
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	return (
		<div className="mx-auto px-4">
			<div className="mb-6">
				<Link
					to="/users"
					className="flex items-center text-muted-foreground hover:text-foreground"
				>
					<Icon name="arrow-left" className="mr-2 h-4 w-4" />
					Back to Users
				</Link>
			</div>

			<div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:items-start">
				<div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-background shadow-md">
					<Img
						src={getUserImgSrc(user.image?.objectKey)}
						alt={userDisplayName}
						className="h-full w-full object-cover"
						width={360}
						height={360}
					/>
				</div>

				<div className="flex-1 text-center md:text-left">
					<h1 className="mb-2 text-3xl font-bold">{userDisplayName}</h1>

					<div className="mb-4 flex items-center justify-center text-muted-foreground md:justify-start">
						<Icon name="calendar-days" className="mr-2 h-4 w-4" />
						<span>Member since {userJoinedDisplay}</span>
					</div>

					{user.groupMemberships.length > 0 && (
						<div className="mb-6">
							<div className="mb-2 flex items-center gap-2">
								<Icon name="users" className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">Groups</span>
							</div>
							<div className="flex flex-wrap gap-2">
								{user.groupMemberships.map((membership) => (
									<Link 
										key={membership.group.id} 
										to={`/groups/${membership.group.id}`}
									>
										<Badge 
											variant="secondary"
											className="hover:bg-secondary/80 cursor-pointer"
										>
											{membership.group.name}
										</Badge>
									</Link>
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
												<Icon name="message-circle" className="mr-2 h-4 w-4" />
												Message
											</Button>
										</Form>
										{canModerate && (
											<Button
												variant="destructive"
												onClick={() => setIsDeleteDialogOpen(true)}
											>
												<Icon name="trash" className="mr-2 h-4 w-4" />
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

			<Tabs defaultValue={tab}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="prayers" asChild>
						<Link to={`/users/${user.username}/prayers`}>Prayer Requests</Link>
					</TabsTrigger>
					<TabsTrigger value="needs" asChild>
						<Link to={`/users/${user.username}/needs`}>Needs</Link>
					</TabsTrigger>
					<TabsTrigger value="shares" asChild>
						<Link to={`/users/${user.username}/shares`}>Shared Items</Link>
					</TabsTrigger>

				</TabsList>

				<div className="mt-6">
					<Outlet />
				</div>
			</Tabs>

			<DeleteDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				additionalFormData={{
					userId: user.id,
					_action: 'deleteUser',
				}}
				isModerate={canModerate}
			/>
		</div>
	)
}


export const meta: Route.MetaFunction = ({ data, params }) => {
	const displayName = data?.user.name ?? params.username
	return [
		{ title: `${displayName} | PrayPal` },
		{
			name: 'description',
			content: `Profile of ${displayName} on PrayPal`,
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

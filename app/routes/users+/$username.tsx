import { invariantResponse } from '@epic-web/invariant'
import { Trash } from 'lucide-react'
import { useState } from 'react'
import {
	Form,
	Link,
	type LoaderFunctionArgs,
	useLoaderData,
} from 'react-router'

import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { DeleteDialog } from '#app/components/shared/delete-dialog.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'
import { type Route } from './+types/$username.ts'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const user = await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			username: true,
			createdAt: true,
			image: { select: { id: true } },
		},
		where: {
			username: params.username,
		},
	})

	invariantResponse(user, 'User not found', { status: 404 })

	// Get logged in user's roles to check for moderator status
	const loggedInUserId = await requireUserId(request).catch(() => null)
	const loggedInUser = loggedInUserId
		? await prisma.user.findUnique({
				where: { id: loggedInUserId },
				include: { roles: true },
			})
		: null

	const canModerate =
		loggedInUser?.roles.some((role) =>
			['admin', 'moderator'].includes(role.name),
		) ?? false

	return {
		user,
		userJoinedDisplay: user.createdAt.toLocaleDateString(),
		canModerate,
	}
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const userId = await requireUserId(request)

	if (formData.get('_action') === 'deleteUser') {
		const targetUserId = formData.get('userId') as string
		const reason = formData.get('reason') as string

		// Verify moderator status
		const user = await prisma.user.findUnique({
			where: { id: userId },
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
				moderatorId: userId,
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

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center">
			<Spacer size="4xs" />

			<div className="container flex flex-col items-center rounded-3xl p-12">
				<div className="relative w-52">
					<div className="absolute -top-40">
						<div className="relative">
							<img
								src={getUserImgSrc(data.user.image?.id)}
								alt={userDisplayName}
								className="h-52 w-52 rounded-full object-cover"
							/>
						</div>
					</div>
				</div>

				<Spacer size="sm" />

				<div className="flex flex-col items-center">
					<div className="flex flex-wrap items-center justify-center gap-4">
						<h1 className="text-h2 text-center">{userDisplayName}</h1>
					</div>
					<p className="mt-2 text-center text-muted-foreground">
						Joined {data.userJoinedDisplay}
					</p>
					{isLoggedInUser ? (
						<Form action="/logout" method="POST" className="mt-3">
							<Button type="submit" variant="link" >
								<Icon name="exit" className="scale-125 max-md:scale-150">
									Logout
								</Icon>
							</Button>
						</Form>
					) : null}
					<div className="mt-10 flex gap-4">
						{isLoggedInUser ? (
							<>
								<Button asChild>
									<Link to="/settings/profile" prefetch="intent">
										Edit profile
									</Link>
								</Button>
							</>
						) : (
							<>
								<Button asChild>
									<Link to="notes" prefetch="intent">
										{userDisplayName}'s notes
									</Link>
								</Button>

								{data.canModerate && (
									<>
										<Button
											variant="destructive"
											onClick={() => setIsDeleteDialogOpen(true)}
										>
											<Trash /> Delete User
										</Button>

										<DeleteDialog
											open={isDeleteDialogOpen}
											onOpenChange={setIsDeleteDialogOpen}
											additionalFormData={{
												userId: user.id,
												_action: 'deleteUser',
											}}
											isModerator={true}
										/>
									</>
								)}
							</>
						)}
					</div>
				</div>
			</div>
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

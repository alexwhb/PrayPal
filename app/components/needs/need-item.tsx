import { useState } from 'react'
import { Form, Link } from 'react-router'
import ContentModeration from '#app/components/content-moderation.tsx'
import DeleteDialog from '#app/components/delete-dialog.tsx'
import { type Need } from '#app/components/needs/type.ts'
import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar'
import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '#app/components/ui/card'
import { Icon } from '#app/components/ui/icon.tsx'
import { formatDate } from '#app/utils/formatter.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { Img } from 'openimg/react'

function OwnerActions({ need }: { need: Need }) {
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	return (
		<>
			<Form method="post">
				<input type="hidden" name="_action" value="markFulfilled" />
				<input type="hidden" name="needId" value={need.id} />
				<input
					type="hidden"
					name="fulfilled"
					value={need.fulfilled === false ? 1 : 0}
				/>
				<Button type="submit">
					{need.fulfilled ? 'Mark as Unfulfilled' : 'Mark as Fulfilled'}
				</Button>
			</Form>

			<DeleteDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				additionalFormData={{ needId: need.id }}
			/>
		</>
	)
}

function ContactAction({ needId }: { needId: string }) {
	return (
		<Form method="post">
			<input type="hidden" name="_action" value="contact" />
			<input type="hidden" name="needId" value={needId} />
			<Button type="submit">Contact</Button>
		</Form>
	)
}

export function NeedItem({
	need,
	isCurrentUser,
}: {
	need: Need
	isCurrentUser: boolean
}) {
	return (
		<Card className={need.fulfilled ? 'opacity-75' : ''}>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<Link to={`/users/${need.user.username}`} prefetch="intent">
							<Avatar>
								<AvatarImage
									src={getUserImgSrc(need.user.image?.objectKey)}
									asChild
								>
									<Img
										src={getUserImgSrc(need.user.image?.objectKey)}
										alt={need.user.name}
										className="h-full w-full object-cover"
										width={64}
										height={64}
									/>
								</AvatarImage>

								<AvatarFallback>{need.user.name.charAt(0)}</AvatarFallback>
							</Avatar>
						</Link>
						<div>
							<Link to={`/users/${need.user.username}`} prefetch="intent">
								<h3 className="font-medium">{need.user.name}</h3>
							</Link>
							<div className="text-muted-foreground flex items-center text-sm">
								<Icon name="calendar-days" className="mr-1" size="xs" />
								{formatDate(need.createdAt)}
							</div>
						</div>
					</div>
					<Badge variant={need.fulfilled ? 'outline' : 'secondary'}>
						{need.category.name}
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<p className="text-sm">{need.description}</p>
			</CardContent>
			<CardFooter className="flex justify-between pt-2">
				{need.fulfilled ? (
					<div className="flex items-center text-green-600">
						<Icon name="check-circle" className="mr-1" size="sm" />
						<span className="text-sm">Fulfilled</span>
					</div>
				) : isCurrentUser ? (
					<OwnerActions need={need} />
				) : (
					<>
						<ContactAction needId={need.id} />
						<ContentModeration
							itemId={need.id}
							itemType="need"
							canModerate={need.canModerate}
							isOwner={isCurrentUser}
						/>
					</>
				)}
			</CardFooter>
		</Card>
	)
}

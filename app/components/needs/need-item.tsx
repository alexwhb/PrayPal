import { CalendarDays, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Form, Link } from 'react-router'
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
import { formatDate } from '#app/utils/formatter.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx'

function OwnerActions({ need }: { need: Need }) {
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	
	return (
		<>
			<Form method="post">
				<input type="hidden" name="_action" value="markFulfilled" />
				<input type="hidden" name="needId" value={need.id} />
				<input type="hidden" name="fulfilled" value={need.fulfilled === false ? 1 : 0} />
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
			<Button type="submit">
				Contact
			</Button>
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
									src={getUserImgSrc(need.user.image?.id)}
									alt={need.user.username}
								/>
								<AvatarFallback>{need.user.username.charAt(0)}</AvatarFallback>
							</Avatar>
						</Link>
						<div>
							<Link to={`/users/${need.user.username}`} prefetch="intent">
								<h3 className="font-medium">{need.user.username}</h3>
							</Link>
							<div className="flex items-center text-sm text-muted-foreground">
								<CalendarDays className="mr-1 h-3 w-3" />
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
						<CheckCircle2 className="mr-1 h-4 w-4" />
						<span className="text-sm">Fulfilled</span>
					</div>
				) : isCurrentUser ? (
					<OwnerActions need={need} />
				) : (
					<ContactAction needId={need.id} />
				)}
			</CardFooter>
		</Card>
	)
}
import { Icon } from '#app/components/ui/icon.tsx'
import { Form, Link } from 'react-router'
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '#app/components/ui/avatar.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '#app/components/ui/card.tsx'
import { formatDate } from '#app/utils/formatter.ts'
import { Img } from 'openimg/react'

import { type ShareType } from './type.ts'
import ContentModeration from '#app/components/content-moderation.tsx'

type ItemCardProps = {
	item: ShareType
	isCurrentUser: boolean
	onOpenDialog: (
		itemId: string,
		action: 'delete' | 'pending' | 'removed',
		isModerator: boolean,
	) => void
}

export default function ShareItem({
	item,
	isCurrentUser,
	onOpenDialog,
}: ItemCardProps) {
	const isBorrowable = item.shareType === 'borrow'

	return (
		<Card
			className={`${item.claimed ? 'opacity-75' : ''} border-2 transition-shadow hover:shadow-md`}
		>
			<CardHeader className="p-0">
				<div className="relative h-58  overflow-hidden">
					<Img
						src={item.image}
						alt={item.title}
						width={600}
						height={400}
						className="h-full w-full rounded-t-lg object-cover"
					/>
					<div className="absolute top-2 right-2">
						<Badge
							variant="secondary"
							className="bg-green-500 hover:bg-green-400"
						>
							{item.category}
						</Badge>
					</div>
					<div className="absolute top-2 left-2">
						<Badge
							variant={isBorrowable ? 'outline' : 'default'}
							className={
								isBorrowable
									? 'bg-blue-500 text-white hover:bg-blue-600'
									: 'bg-green-500 hover:bg-green-600'
							}
						>
							{isBorrowable ? (
								<div className="flex items-center gap-1">
									<Icon name="share" size="xs" />
									<span>Borrow</span>
								</div>
							) : (
								<div className="flex items-center gap-1">
									<Icon name="gift" size="xs" />
									<span>Free</span>
								</div>
							)}
						</Badge>
					</div>
					{item.claimed && (
						<div className="absolute inset-0 flex items-center justify-center rounded-t-lg bg-black/50">
							<Badge
								variant="default"
								className="bg-red-200 py-2 text-lg text-red-900 hover:bg-red-300"
							>
								{isBorrowable ? 'Currently Borrowed' : 'Claimed'}
							</Badge>
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent className="pt-4">
				<h3 className="mb-1 text-lg font-semibold">{item.title}</h3>
				<p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
					{item.description}
				</p>
				<div className="text-muted-foreground mb-1 flex items-center text-sm">
					<Icon name="map-pin" className="mr-1" size="xs" />
					{item.location}
				</div>
				{isBorrowable && item.duration && (
					<div className="text-muted-foreground mb-1 flex items-center text-sm">
						<Icon name="clock" className="mr-1" size="xs" />
						{item.duration}
					</div>
				)}
				<div className="text-muted-foreground mb-3 flex items-center text-sm">
					<Icon name="calendar-days" className="mr-1" size="xs" />
					Posted {formatDate(item.postedDate)}
				</div>

				<div className="flex items-center gap-2">
					{/*TODO username is not the user name*/}
					<Link
						to={`/users/${item.userName}`}
						prefetch="intent"
						className="flex items-center gap-2"
					>
						<Avatar className="h-6 w-6">
							<AvatarImage src={item.userAvatar} asChild>
								<Img
									src={item.userAvatar}
									alt={item.userDisplayName}
									className="h-full w-full object-cover"
									width={64}
									height={64}
								/>
							</AvatarImage>
							<AvatarFallback>{item.userDisplayName.charAt(0)}</AvatarFallback>
						</Avatar>
						<span className="text-sm">{item.userDisplayName}</span>
					</Link>
				</div>
			</CardContent>

			<CardFooter className="flex justify-between pt-0">
				{isCurrentUser && (
					<Form method="post">
						<input type="hidden" name="itemId" value={item.id} />
						<input type="hidden" name="_action" value="toggleClaimed" />
						<Button type="submit">
							{item.claimed ? 'Mark as Available' : 'Mark as Claimed'}
						</Button>
					</Form>
				)}

				{/*TODO this should open the message view and crate a conversation with
				the owner and a basic message template. */}
				{!isCurrentUser && !item.claimed && (
					<Form method="post">
						<input type="hidden" name="itemId" value={item.id} />
						<input type="hidden" name="_action" value="requestItem" />
						<Button type="submit" variant="outline">
							Request Item
						</Button>
					</Form>
				)}

				<ContentModeration
					itemId={item.id}
					itemType="share-item"
					canModerate={item.canModerate}
					isOwner={isCurrentUser}
					onModerateAction={onOpenDialog}
				/>
			</CardFooter>
		</Card>
	)
}

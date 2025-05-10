import { invariantResponse } from '@epic-web/invariant'
import { data } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { initiateConversation } from '#app/utils/messaging.server.ts'
import { moderateItem } from '#app/utils/moderation.server.ts'
import  { type Route } from '../_sharable+/+types/share.board.ts'

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const itemId = formData.get('itemId')
	const action = formData.get('_action')

	if (action === 'delete' || action === 'pending' || action === 'removed') {
		const moderatorAction = formData.get('moderatorAction') === '1'
		const reason = (formData.get('reason') as string) || 'Moderation action'

		return moderateItem({
			userId,
			itemId: itemId as string,
			itemType: 'SHARE_ITEM',
			action: action as 'delete' | 'pending' | 'removed',
			reason,
			isModerator: moderatorAction,
		})
	}

	if (action === 'toggleClaimed') {
		const item = await prisma.shareItem.findUnique({
			where: { id: itemId as string },
			select: { userId: true, claimed: true },
		})

		// Verify ownership
		invariantResponse(item?.userId === userId, 'Not authorized', {
			status: 403,
		})

		await prisma.shareItem.update({
			where: { id: itemId as string },
			data: { claimed: !item.claimed },
		})

		return data({ success: true })
	}

	if (action === 'requestItem') {
		const item = await prisma.shareItem.findUnique({
			where: { id: itemId as string },
			select: {
				userId: true,
				title: true,
				imageId: true,
				category: { select: { name: true } },
				shareType: true,
			},
		})

		if (!item) return null

		// Create a message attachment record
		const attachment = await prisma.messageAttachment.create({
			data: {
				type: 'SHARE_ITEM',
				referenceId: itemId as string,
				metadata: {
					title: item.title,
					imageId: item.imageId,
					category: item.category.name,
					shareType: item.shareType,
				},
			},
		})

		return initiateConversation({
			initiatorId: userId,
			participantIds: [item.userId],
			checkExisting: true,
			initialMessage: `Hi! I'm interested in your shared item: "${item.title}"`,
			attachmentId: attachment.id,
		})
	}

	return null
}
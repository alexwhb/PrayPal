import { ModerationType } from '@prisma/client'
import { data } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { moderateItem } from '#app/utils/moderation.server.ts'
import  { type Route } from './+types/prayer.board.ts'

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const prayerId = formData.get('prayerId')
	const action = formData.get('_action')

	if (action === 'togglePraying') {
		// First fetch the current request
		const request = await prisma.request.findUnique({
			where: { id: prayerId as string },
			select: { response: true },
		})

		// Initialize or get current values
		const currentResponse = request?.response ?? {}
		const prayedBy = new Set(currentResponse.prayedBy ?? [])
		const currentCount = currentResponse.prayerCount ?? 0

		// Toggle user's prayer status
		const hasPrayed = prayedBy.has(userId)
		if (hasPrayed) {
			prayedBy.delete(userId)
		} else {
			prayedBy.add(userId)
		}

		// Update the request with new values
		await prisma.request.update({
			where: { id: prayerId as string },
			data: {
				response: {
					prayerCount: hasPrayed ? currentCount - 1 : currentCount + 1,
					prayedBy: Array.from(prayedBy),
					lastUpdatedAt: new Date().toISOString(),
				},
			},
		})

		return data({ success: true })
	} else if (action === 'delete') {
		const moderatorAction = formData.get('moderatorAction') === '1'
		const reason = (formData.get('reason') as string) || 'Moderation action'

		return moderateItem({
			userId,
			itemId: prayerId as string,
			itemType: ModerationType.PRAYER,
			action: 'delete',
			reason,
			isModerator: moderatorAction,
		})
	} else if (action === 'markAsAnswered') {
		await prisma.request.update({
			where: { id: prayerId as string },
			data: {
				fulfilled: true,
				response: {
					message: formData.get('testimony') as string,
				},
			},
		})

		return data({ success: true })
	} else if (action === 'pending' || action === 'removed') {
		const moderatorAction = formData.get('moderatorAction') === '1'
		const reason = (formData.get('reason') as string) || 'Moderation action'

		return moderateItem({
			userId,
			itemId: prayerId as string,
			itemType: 'PRAYER',
			action: action as 'pending' | 'removed',
			reason,
			isModerator: moderatorAction,
		})
	}

	return null
}
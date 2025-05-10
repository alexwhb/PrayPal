import { data } from 'react-router'; // Assuming this is used as in your original code for responses
import { requireUserId } from '#app/utils/auth.server.ts';
import { prisma } from '#app/utils/db.server.ts';
import { initiateConversation } from '#app/utils/messaging.server.ts';
import { moderateItem } from '#app/utils/moderation.server.ts';
import { type Route } from './+types/needs.board.ts';

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request);
	const formData = await request.formData();
	const needId = formData.get('needId');
	const actionType = formData.get('_action');

	console.log('actionType', actionType);

	if (actionType === 'delete') {
		const moderatorAction = formData.get('moderatorAction') === '1';
		const reason = (formData.get('reason') as string) || 'Moderation action';

		return moderateItem({
			userId,
			itemId: needId as string,
			itemType: 'NEED',
			action: 'delete',
			reason,
			isModerator: moderatorAction,
		});
	} else if (actionType === 'markFulfilled') {
		await prisma.request.update({
			where: { id: needId as string },
			data: {
				fulfilled: formData.get('fulfilled') === '1',
			},
		});

		return data({ success: true }); // Using 'data' as in your original file
	} else if (actionType === 'pending' || actionType === 'removed') {
		const moderatorAction = formData.get('moderatorAction') === '1';
		const reason = (formData.get('reason') as string) || 'Moderation action';

		return moderateItem({
			userId,
			itemId: needId as string,
			itemType: 'NEED',
			action: actionType as 'pending' | 'removed',
			reason,
			isModerator: moderatorAction,
		});
	} else if (actionType === 'contact') {
		const need = await prisma.request.findUnique({
			where: { id: needId as string },
			select: { userId: true },
		});

		if (!need) return null; // Consider returning a Response, e.g., json({ error: 'Need not found' }, { status: 404 })

		return initiateConversation({
			initiatorId: userId,
			participantIds: [need.userId],
			checkExisting: true,
		});
	}

	return null; // Consider returning a Response, e.g., json({ error: 'Invalid action' }, { status: 400 })
}
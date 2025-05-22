import { parseWithZod } from '@conform-to/zod'
import { parseFormData } from '@mjackson/form-data-parser'
import { createId as cuid } from '@paralleldrive/cuid2'
import { type ActionFunctionArgs, data } from 'react-router'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { uploadGeneralImage } from '#app/utils/storage.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import {
	type ImageFieldset,
	MAX_UPLOAD_SIZE,
	ShareItemSchema,
} from './__share.new.editor'

function imageHasFile(
	image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
	return Boolean(image.file?.size && image.file?.size > 0)
}

function imageHasId(
	image: ImageFieldset,
): image is ImageFieldset & { id: string } {
	return Boolean(image.id)
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	let isUpdate = false

	const formData = await parseFormData(request, {
		maxFileSize: MAX_UPLOAD_SIZE,
	})

	const submission = await parseWithZod(formData, {
		schema: ShareItemSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const shareItem = await prisma.shareItem.findUnique({
				select: { id: true },
				where: { id: data.id, userId: userId },
			})
			if (!shareItem) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Share item not found',
				})
			}
		}).transform(async ({ images = [], ...data }) => {
			if (data.id) {
				isUpdate = true
			}
			const shareItemId = data.id ?? cuid()
			return {
				...data,
				id: shareItemId,
				imageUpdates: await Promise.all(
					images.filter(imageHasId).map(async (i) => {
						// i is ImageFieldset, i.id is Image.id
						if (imageHasFile(i)) {
							return {
								id: i.id!, // Image.id
								altText: i.altText,
								objectKey: await uploadGeneralImage(
									userId,
									shareItemId,
									i.file,
								), // New objectKey
							}
						} else {
							return {
								id: i.id!, // Image.id
								altText: i.altText,
								objectKey: null, // Or undefined, to indicate no new file/objectKey
							}
						}
					}),
				),
				newImages: await Promise.all(
					images
						.filter(imageHasFile)
						.filter((i) => !i.id) // Filter for images that don't have an ID (new images)
						.map(async (image, index) => {
							// image is of type ImageFieldset
							const objectKey = await uploadGeneralImage(
								userId,
								shareItemId, // shareItemId is available here
								image.file,
							)
							return {
								// This structure is for ShareItemImageCreateWithoutShareItemInput
								// order: index, // Optional: if you want to maintain an order
								image: {
									// This creates the related Image record
									create: {
										altText: image.altText,
										objectKey: objectKey,
										userId: userId, // Assign the current user as the image owner
										purpose: 'SHARE_ITEM_GALLERY', // Provide a purpose string, e.g., "SHARE_ITEM_GALLERY" or "SHARE_IMAGE"
									},
								},
							}
						}),
				),
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const {
		id: shareItemId,
		title,
		description,
		location,
		category,
		shareType,
		duration,
		imageUpdates = [],
		newImages = [],
	} = submission.value

	const updateShareItem = await prisma.shareItem.upsert({
		select: { id: true },
		where: { id: shareItemId },
		create: {
			id: shareItemId,
			userId: userId, // CORRECTED: Use 'userId' which is the field in your Prisma schema
			status: 'ACTIVE',
			title,
			description,
			location,
			categoryId: category, // CORRECTED: Use 'categoryId' and assign the 'category' variable (which holds the ID)
			shareType,
			duration,
			images: {
				create: newImages, // Assuming newImages is structured correctly as per previous advice
			},
		},
		update: {
			title,
			description,
			location,
			categoryId: category, // CORRECTED: Also use 'categoryId' here
			shareType,
			duration,
			images: {
				// Ensure this logic is also robust as discussed before
				deleteMany: {
					imageId: {
						notIn: imageUpdates
							.map((img) => img.id)
							.filter(Boolean) as string[],
					},
				},
				upsert: imageUpdates
					.filter((img) => img.id)
					.map((imgUpdate) => ({
						where: {
							shareItemId_imageId: {
								shareItemId: shareItemId,
								imageId: imgUpdate.id!,
							},
						},
						create: {
							image: { connect: { id: imgUpdate.id! } },
						},
						update: {
							image: {
								update: {
									altText: imgUpdate.altText,
									...(imgUpdate.objectKey && {
										objectKey: imgUpdate.objectKey,
									}),
								},
							},
						},
					})),
				create: newImages,
			},
		},
	})

	// was this an update or a new create?

	return redirectWithToast('../board', {
		title: `${isUpdate ? 'Updated' : 'Created'} item successfully 🚀`,
		type: 'success',
		description: '',
	})
}

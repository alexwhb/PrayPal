// import { type FieldMetadata, getFieldsetProps, getFormProps, getInputProps, useForm } from '@conform-to/react'
// import { getZodConstraint, parseWithZod } from '@conform-to/zod'
// import { parseFormData } from '@mjackson/form-data-parser'
// import { useMemo, useState } from 'react'
// import { data, Form, Link, redirect } from 'react-router'
// import sharp from 'sharp'
// import { z } from 'zod'
// import { ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
// import { Button } from '#app/components/ui/button'
// import {
// 	Card,
// 	CardContent,
// 	CardFooter,
// 	CardHeader,
// 	CardTitle,
// } from '#app/components/ui/card'
// import { Icon } from '#app/components/ui/icon.tsx'
// import { Label } from '#app/components/ui/label'
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from '#app/components/ui/select'
//
// import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
// // import { uploadHandler } from '#app/utils/file-uploads.server.ts'
// import { cn } from '#app/utils/misc.tsx'
// import { type Route } from './+types/share.new.ts'
//
// export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB as an example
//
//
// function imageHasFile(
// 	image: ImageFieldset,
// ): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
// 	return Boolean(image.file?.size && image.file?.size > 0)
// }
//
// function imageHasId(
// 	image: ImageFieldset,
// ): image is ImageFieldset & { id: string } {
// 	return Boolean(image.id)
// }
//
//
// const ImageFieldsetSchema = z.object({
// 	// id: z.string().optional(),
// 	file: z
// 		.instanceof(File, { message: 'A valid image file is required if provided' })
// 		.optional()
// 		.refine(
// 			(file) => !file || file.size <= MAX_UPLOAD_SIZE,
// 			`File size must be less than ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB`,
// 		)
// 		.refine(
// 			(file) => !file || ['image/jpeg', 'image/png'].includes(file.type),
// 			'File must be a JPEG or PNG image',
// 		),
// })
//
// export type ImageFieldset = z.infer<typeof ImageFieldsetSchema>
//
//
// export const ShareItemSchema = z.object({
// 	title: z.string().min(1, 'Title is required.').max(100),
// 	description: z.string().min(1, 'Description is required.').max(200),
// 	location: z.string().min(1, 'Location is required.').max(100),
// 	category: z.string().min(1, 'Category is required.'),
// 	shareType: z.enum(['BORROW', 'GIVE']),
// 	duration: z.string().optional(),
// 	image: ImageFieldsetSchema
// })
//
// export async function loader({ request }: Route.LoaderArgs) {
// 	await requireUserId(request)
//
// 	const url = new URL(request.url)
// 	const shareTypeParam = url.searchParams.get('type')
// 	const shareType =
// 		shareTypeParam && ['GIVE', 'BORROW'].includes(shareTypeParam.toUpperCase())
// 			? shareTypeParam.toUpperCase()
// 			: 'BORROW'
//
// 	const categories = await prisma.category.findMany({
// 		where: { type: 'SHARE', active: true },
// 		select: { id: true, name: true },
// 	})
// 	return data({ categories, defaultShareType: shareType })
// }
//
//
// // TODO invalidate our total cache value whenever we add a new element.
// export async function action({ request }: Route.ActionArgs) {
// 	const userId = await requireUserId(request)
//
//
// 	const submission = await parseWithZod(formData, {
// 		schema: ShareItemSchema.superRefine(async (data, ctx) => {
// 			if (!data.id) return
//
// 			const shareItem = await prisma.shareItem.findUnique({
// 				select: { id: true },
// 				where: { id: data.id, ownerId: userId },
// 			})
// 			if (!shareItem) {
// 				ctx.addIssue({
// 					code: z.ZodIssueCode.custom,
// 					message: 'Share item not found',
// 				})
// 			}
// 		}).transform(async ({ images = [], ...data }) => {
// 			const shareItemId = data.id ?? cuid()
// 			return {
// 				...data,
// 				id: shareItemId,
// 				imageUpdates: await Promise.all(
// 					images.filter(imageHasId).map(async (i) => {
// 						if (imageHasFile(i)) {
// 							return {
// 								id: i.id,
// 								altText: i.altText,
// 								objectKey: await uploadNoteImage(userId, noteId, i.file),
// 							}
// 						} else {
// 							return {
// 								id: i.id,
// 								altText: i.altText,
// 							}
// 						}
// 					}),
// 				),
// 				newImages: await Promise.all(
// 					images
// 						.filter(imageHasFile)
// 						.filter((i) => !i.id)
// 						.map(async (image) => {
// 							return {
// 								altText: image.altText,
// 								objectKey: await uploadNoteImage(userId, noteId, image.file),
// 							}
// 						}),
// 				),
// 			}
// 		}),
// 		async: true,
// 	})
//
// 	console.log('formData', formData)
// 	//
// 	// const submission = await parseWithZod(formData, {
// 	// 	schema: ShareItemSchema.transform(async (data) => {
// 	// 		console.log('Parsed data before transform:', data)
// 	// 		console.log('Parsed data before transform:', data.image)
// 	// 		const image = {
// 	// 			file: data.image?.file,
// 	// 			id: data.image?.objectKey,
// 	// 		}
// 	//
// 	// 		if (imageHasFile(image)) {
// 	// 			const imageBuffer = Buffer.from(await image.file.arrayBuffer())
// 	//
// 	// 			const processedImage = await sharp(imageBuffer)
// 	// 				.resize({ width: 800, withoutEnlargement: true })
// 	// 				.webp({ quality: 80 })
// 	// 				.toBuffer()
// 	//
// 	// 			return {
// 	// 				...data,
// 	// 				imageUpdate: {
// 	// 					id: image.id,
// 	// 					contentType: 'image/webp',
// 	// 					blob: processedImage,
// 	// 				},
// 	// 			}
// 	// 		} else {
// 	// 			return {
// 	// 				...data,
// 	// 				imageUpdate: null,
// 	// 			}
// 	// 		}
// 	// 	}),
// 	// 	async: true,
// 	// })
// 	//
// 	//
// 	// if (submission.status !== 'success') {
// 	// 	return data(
// 	// 		{ result: submission.reply() },
// 	// 		{ status: submission.status === 'error' ? 400 : 200 },
// 	// 	)
// 	// }
// 	//
// 	// const {
// 	// 	title,
// 	// 	description,
// 	// 	location,
// 	// 	category,
// 	// 	shareType,
// 	// 	duration,
// 	// 	imageUpdate,
// 	// } = submission.value
// 	//
// 	// let imageId = null
// 	// if(imageUpdate) {
// 	// 	const image = await prisma.image.create({
// 	// 		data: {
// 	// 			contentType: imageUpdate.contentType,
// 	// 			blob: imageUpdate.blob,
// 	// 			purpose: 'SHARE',
// 	// 			userId,
// 	// 		},
// 	// 	})
// 	// 	imageId = image.id
// 	// 	console.log('imageId', imageId)
// 	// }
// 	//
// 	// await prisma.shareItem.create({
// 	// 	data: {
// 	// 		title,
// 	// 		description,
// 	// 		location,
// 	// 		categoryId: category,
// 	// 		shareType,
// 	// 		duration,
// 	// 		imageId,
// 	// 		status: 'ACTIVE',
// 	// 		userId
// 	// 	},
// 	// })
//
// 	return redirect('../board')
// }
//
// export default function NewShareForm({
// 	loaderData,
// 	actionData,
// }: Route.ComponentProps) {
// 	const { categories, defaultShareType } = loaderData
// 	const [shareType, setShareType] = useState<'BORROW' | 'GIVE'>(defaultShareType.toUpperCase() as 'BORROW' | 'GIVE')
//
// 	const defaultValues = useMemo(
// 		() => ({
// 			id: 'new-share',
// 			title: '',
// 			description: '',
// 			location: '',
// 			category: '',
// 			shareType: shareType,
// 			duration: '',
// 			image: null,
// 		}),
// 		[],
// 	)
//
// 	const [form, fields] = useForm({
// 		id: 'share-editor',
// 		constraint: getZodConstraint(ShareItemSchema),
// 		onValidate({ formData }) {
// 			const t =  parseWithZod(formData, { schema: ShareItemSchema })
// 			console.log('t', t)
// 			return t
// 		},
// 		lastResult: actionData?.result,
// 		defaultValue: defaultValues,
// 		shouldRevalidate: 'onBlur',
// 	})
//
// 	return (
// 		<Card>
// 			<CardHeader>
// 				<CardTitle>Share an Item</CardTitle>
// 			</CardHeader>
// 			<Form method="post" {...getFormProps(form)} encType="multipart/form-data">
// 				<CardContent className="space-y-4">
// 					<Field
// 						labelProps={{ children: 'Title' }}
// 						inputProps={{
// 							...getInputProps(fields.title, { type: 'text' }),
// 							placeholder: 'Enter item title',
// 						}}
// 						errors={fields.title.errors}
// 					/>
//
// 					<div className="space-y-2">
// 						<Label htmlFor="category">Category</Label>
// 						<Select
// 							{...getInputProps(fields.category, { type: 'text' })}
// 							required
// 						>
// 							<SelectTrigger id="category">
// 								<SelectValue placeholder="Select a category" />
// 							</SelectTrigger>
// 							<SelectContent>
// 								{categories.map((category: { id: string; name: string }) => (
// 									<SelectItem key={category.id} value={category.id}>
// 										{category.name}
// 									</SelectItem>
// 								))}
// 							</SelectContent>
// 						</Select>
// 					</div>
//
// 					<TextareaField
// 						labelProps={{ htmlFor: 'description', children: 'Description' }}
// 						textareaProps={{
// 							...getInputProps(fields.description, { type: 'text' }),
// 							placeholder: 'Describe the item you want to share',
// 							maxLength: 200,
// 						}}
// 						errors={fields.description.errors}
// 						className="relative"
// 					>
// 						<div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
// 							{fields.description.value?.length ?? 0} / 200
// 						</div>
// 					</TextareaField>
//
// 					<Field
// 						labelProps={{ children: 'Location' }}
// 						inputProps={{
// 							...getInputProps(fields.location, { type: 'text' }),
// 							placeholder:
// 								'You can be vague here. Leave specifics for messages. ex. East Medford',
// 						}}
// 						errors={fields.location.errors}
// 					/>
//
// 					<div className="space-y-2">
// 						<Label htmlFor="shareType">Share Type</Label>
// 						<Select
// 							{...getInputProps(fields.shareType, { type: 'text' })}
// 							onValueChange={(value: 'BORROW' | 'GIVE') => {
// 								setShareType(value)
// 							}}
// 							required
// 						>
// 							<SelectTrigger id="shareType">
// 								<SelectValue placeholder="Select share type" />
// 							</SelectTrigger>
// 							<SelectContent>
// 								<SelectItem value="BORROW">Borrow</SelectItem>
// 								<SelectItem value="GIVE">Give</SelectItem>
// 							</SelectContent>
// 						</Select>
// 					</div>
//
// 					{shareType === 'BORROW' && (
// 						<Field
// 							labelProps={{ children: 'Duration' }}
// 							inputProps={{
// 								...getInputProps(fields.duration, { type: 'text' }),
// 								placeholder: 'How long can it be borrowed? (e.g., "1 week")',
// 							}}
// 							errors={fields.duration.errors}
// 						/>
// 					)}
//
// 					<div>
// 						<Label>Image</Label>
// 						<ImageChooser meta={fields.image} form={form} />
// 					</div>
//
// 				</CardContent>
// 				<CardFooter>
// 					<div className="flex gap-4">
// 						<Link to="../board" prefetch="intent">
// 							<Button variant="outline">Cancel</Button>
// 						</Link>
//
// 						<Button
// 							type="submit"
// 							disabled={!form.value?.category || !form.value?.title}
// 						>
// 							Share Item
// 						</Button>
// 					</div>
// 				</CardFooter>
// 			</Form>
// 		</Card>
// 	)
// }
//
//
//
//
//
// function ImageChooser({
// 												meta,
// 												form,
// 											}: {
// 	meta: FieldMetadata<ImageFieldset>
// 	form: any
// }) {
// 	const fields = meta.getFieldset()
// 	const existingImageId = fields.id.initialValue
// 	const [previewImage, setPreviewImage] = useState<string | null>(
// 		existingImageId ? getImageSrc(existingImageId) : null,
// 	)
//
// 	// console.log(existingImageId, fields.id, previewImage)
//
// 	const handleRemoveImage = () => {
// 		setPreviewImage(null)
// 		form.update({ name: 'image.file', value: undefined })
// 		form.update({ name: 'image.id', value: undefined }) // Signal removal of existing image
// 	}
//
// 	return (
// 		<fieldset {...getFieldsetProps(meta)}>
// 			<div className="flex gap-3">
// 				<div className="w-32">
// 					<div className="relative h-32 w-32">
// 						{/* Always render the file input */}
// 						<label
// 							htmlFor={fields.file.id}
// 							className={cn(
// 								'group absolute h-32 w-32 rounded-lg',
// 								previewImage
// 									? 'opacity-0' // Hide the label visually when preview is shown
// 									: 'cursor-pointer bg-accent opacity-40 hover:opacity-100',
// 							)}
// 						>
// 							<div className="flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground">
// 								<Icon name="plus" />
// 							</div>
// 							<input
// 								aria-label="Image"
// 								className="absolute left-0 top-0 h-32 w-32 cursor-pointer opacity-0"
// 								onChange={(event) => {
// 									const file = event.target.files?.[0]
// 									if (file) {
// 										const reader = new FileReader()
// 										reader.onloadend = () =>
// 											setPreviewImage(reader.result as string)
// 										reader.readAsDataURL(file)
// 									} else {
// 										setPreviewImage(null)
// 										form.update({ name: 'image.id', value: undefined })
// 									}
// 								}}
// 								accept="image/*"
// 								{...getInputProps(fields.file, { type: 'file' })}
// 							/>
// 						</label>
//
// 						{/* Show a preview image if it exists */}
// 						{previewImage && (
// 							<div className="relative">
// 								<img
// 									src={previewImage}
// 									alt="Preview"
// 									className="h-32 w-32 rounded-lg object-cover"
// 								/>
// 								<button
// 									type="button"
// 									className="absolute -right-2 -top-2 rounded-full bg-destructive p-1"
// 									onClick={handleRemoveImage}
// 								>
// 									<Icon name="cross-1" className="h-4 w-4 text-white" />
// 								</button>
// 							</div>
// 						)}
//
// 						{/* Hidden input for existing image ID only if it has a value */}
// 						{previewImage && fields.id.value ? (
// 							<input {...getInputProps(fields.id, { type: 'hidden' })} />
// 						) : null}
// 					</div>
// 					<div className="min-h-[12px] px-4 pb-3 pt-1">
// 						<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
// 					</div>
// 				</div>
// 			</div>
// 			<div className="min-h-[12px] px-4 pb-3 pt-1">
// 				<ErrorList id={meta.errorId} errors={meta.errors} />
// 			</div>
// 		</fieldset>
// 	)
// }


import { requireUserId } from '#app/utils/auth.server.ts'
import { type Route } from './+types/share.new.ts'
import  ShareEditor  from './__share.new.editor.tsx'
import { data } from 'react-router'

export { action } from './__share.new.server.tsx'


export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)

	const url = new URL(request.url)
	const shareTypeParam = url.searchParams.get('type')
	const shareType =
		shareTypeParam && ['GIVE', 'BORROW'].includes(shareTypeParam.toUpperCase())
			? shareTypeParam.toUpperCase()
			: 'BORROW'

	const categories = await prisma.category.findMany({
		where: { type: 'SHARE', active: true },
		select: { id: true, name: true },
	})
	return data({ categories, defaultShareType: shareType })
}


export default ShareEditor


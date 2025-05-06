import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { parseFormData } from '@mjackson/form-data-parser'
import { useMemo, useRef, useState } from 'react'
import { data, Form, Link, redirect } from 'react-router'
import sharp from 'sharp'
import { z } from 'zod'
import { ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card'
import { Label } from '#app/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#app/components/ui/select'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { uploadHandler } from '#app/utils/file-uploads.server.ts'
import { type Route } from './+types/share.new.ts'


export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB as an example

const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z
		.instanceof(File, { message: 'A valid image file is required if provided' })
		.optional()
		.refine(
			(file) => !file || file.size <= MAX_UPLOAD_SIZE,
			`File size must be less than ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB`,
		)
		.refine(
			(file) => !file || ['image/jpeg', 'image/png'].includes(file.type),
			'File must be a JPEG or PNG image',
		),
})

export type ImageFieldset = z.infer<typeof ImageFieldsetSchema>


export const ShareItemSchema = z.object({
	title: z.string().min(1, 'Title is required.').max(100),
	description: z.string().min(1, 'Description is required.').max(200),
	location: z.string().min(1, 'Location is required.').max(100),
	category: z.string().min(1, 'Category is required.'),
	shareType: z.enum(['BORROW', 'GIVE']),
	duration: z.string().optional(),
	imageFile: ImageFieldsetSchema
})

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	const categories = await prisma.category.findMany({
		where: { type: 'SHARE', active: true },
		select: { id: true, name: true },
	})
	return data({ categories })
}

function imageHasFile(image: { file?: File | null }): image is { file: File } {
	console.log('imageHasFile', image)
	return Boolean(image.file && image.file.size > 0)
}

// TODO invalidate our total cache value whenever we add a new element.
export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)

	const formData = await parseFormData(
		request,
		{ maxFileSize: MAX_UPLOAD_SIZE },
		async (file) => uploadHandler(file),
	)

	console.log('formData', formData)

	const submission = await parseWithZod(formData, {
		schema: ShareItemSchema.transform(async (data) => {
			console.log('Parsed data before transform:', data)
			console.log('Parsed data before transform:', data.imageFile)
			const image = {
				file: data.imageFile?.file,
				id: data.imageFile?.id,
			}

			if (imageHasFile(image)) {
				const imageBuffer = Buffer.from(await image.file.arrayBuffer())

				const processedImage = await sharp(imageBuffer)
					.resize({ width: 800, withoutEnlargement: true })
					.webp({ quality: 80 })
					.toBuffer()

				return {
					...data,
					imageUpdate: {
						id: image.id,
						contentType: image.file.type,
						blob: processedImage,
					},
				}
			} else {
				return {
					...data,
					imageUpdate: null,
				}
			}
		}),
		async: true,
	})
	//
	//
	// const submission = await parseWithZod(formData, {
	// 	schema: ShareItemSchema.transform(async (data) => {
	// 		let imageId = null
	//
	// 		if (data.imageFile && data.imageFile.size > 0) {
	// 			// Process image - resize and convert to webp
	// 			const imageBuffer = Buffer.from(await data.imageFile.arrayBuffer())
	//
	// 			const processedImage = await sharp(imageBuffer)
	// 				.resize({ width: 800, withoutEnlargement: true })
	// 				.webp({ quality: 80 })
	// 				.toBuffer()
	//
	// 			// For now, we'll just store the original image
	// 			const shareImage = await prisma.image.create({
	// 				data: {
	// 					contentType: data.imageFile.type,
	// 					blob: processedImage,
	// 					purpose: 'SHARE',
	// 					userId,
	// 				},
	// 			})
	//
	// 			imageId = shareImage.id
	// 		}
	//
	// 		return {
	// 			...data,
	// 			imageId,
	// 		}
	// 	}),
	// 	async: true,
	// })

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const {
		title,
		description,
		location,
		category,
		shareType,
		duration,
		imageUpdate,
	} = submission.value

	let imageId = null
	if(imageUpdate) {
		imageId = await prisma.image.create({
			data: {
				contentType: imageUpdate.contentType,
				blob: imageUpdate.blob,
				purpose: 'SHARE',
				userId,
			},
		})
	}

	await prisma.shareItem.create({
		data: {
			title,
			description,
			location,
			categoryId: category,
			shareType,
			duration,
			status: 'ACTIVE',
			userId,
			imageId
		},
	})

	return redirect('../board')
}

export default function NewShareForm({
	loaderData: { categories },
	actionData,
}: Route.ComponentProps) {
	const [shareType, setShareType] = useState<'BORROW' | 'GIVE'>('BORROW')
	const [imageSrc, setImageSrc] = useState<string | null>(null)
	const imageRef = useRef<HTMLInputElement>(null)

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.currentTarget.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = (e) => {
				setImageSrc(e.target?.result?.toString() ?? null)
			}
			reader.readAsDataURL(file)
		} else {
			setImageSrc(null)
		}
	}

	const defaultValues = useMemo(
		() => ({
			id: 'new-share',
			title: '',
			description: '',
			location: '',
			category: '',
			shareType: 'BORROW',
			duration: '',
			imageFile: null,
		}),
		[],
	)

	const [form, fields] = useForm({
		id: 'share-editor',
		constraint: getZodConstraint(ShareItemSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ShareItemSchema })
		},
		lastResult: actionData?.result,
		defaultValue: defaultValues,
		shouldRevalidate: 'onBlur',
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Share an Item</CardTitle>
			</CardHeader>
			<Form method="post" {...getFormProps(form)}>
				<CardContent className="space-y-4">
					<Field
						labelProps={{ children: 'Title' }}
						inputProps={{
							...getInputProps(fields.title, { type: 'text' }),
							placeholder: 'Enter item title',
						}}
						errors={fields.title.errors}
					/>

					<div className="space-y-2">
						<Label htmlFor="category">Category</Label>
						<Select
							{...getInputProps(fields.category, { type: 'text' })}
							required
						>
							<SelectTrigger id="category">
								<SelectValue placeholder="Select a category" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((category: { id: string; name: string }) => (
									<SelectItem key={category.id} value={category.id}>
										{category.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<TextareaField
						labelProps={{ htmlFor: 'description', children: 'Description' }}
						textareaProps={{
							...getInputProps(fields.description, { type: 'text' }),
							placeholder: 'Describe the item you want to share',
							maxLength: 200,
						}}
						errors={fields.description.errors}
						className="relative"
					>
						<div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
							{fields.description.value?.length ?? 0} / 200
						</div>
					</TextareaField>

					<Field
						labelProps={{ children: 'Location' }}
						inputProps={{
							...getInputProps(fields.location, { type: 'text' }),
							placeholder:
								'You can be vague here. Leave specifics for messages. ex. East Medford',
						}}
						errors={fields.location.errors}
					/>

					<div className="space-y-2">
						<Label htmlFor="shareType">Share Type</Label>
						<Select
							{...getInputProps(fields.shareType, { type: 'text' })}
							onValueChange={(value: 'BORROW' | 'GIVE') => {
								setShareType(value)
							}}
							required
						>
							<SelectTrigger id="shareType">
								<SelectValue placeholder="Select share type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="BORROW">Borrow</SelectItem>
								<SelectItem value="GIVE">Give</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{shareType === 'BORROW' && (
						<Field
							labelProps={{ children: 'Duration' }}
							inputProps={{
								...getInputProps(fields.duration, { type: 'text' }),
								placeholder: 'How long can it be borrowed? (e.g., "1 week")',
							}}
							errors={fields.duration.errors}
						/>
					)}

					<div className="space-y-2">
						<Label htmlFor={fields.imageFile.id}>Item Image (Optional)</Label>
						<div className="flex flex-col gap-4">
							<input
								ref={imageRef}
								id={fields.imageFile.id}
								name={fields.imageFile.name}
								type="file"
								accept="image/jpeg,image/png"
								onChange={handleImageChange}
								className="hidden"
							/>
							<input
								type="hidden"
								name={fields.imageFile.id}
								value="new-image"
							/>

							{imageSrc ? (
								<div className="relative">
									<img
										src={imageSrc}
										alt="Item preview"
										className="max-h-64 rounded-md object-contain"
									/>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										className="absolute right-2 top-2"
										onClick={() => {
											setImageSrc(null)
											if (imageRef.current) {
												imageRef.current.value = ''
											}
										}}
									>
										Remove
									</Button>
								</div>
							) : (
								<Button
									type="button"
									variant="outline"
									onClick={() => imageRef.current?.click()}
								>
									Upload Image
								</Button>
							)}
							<ErrorList
								id={fields.imageFile.id}
								errors={fields.imageFile.errors}
							/>
							<p className="text-xs text-muted-foreground">
								Maximum file size: {MAX_UPLOAD_SIZE / (1024 * 1024)}MB. Accepted formats: JPEG, PNG.
							</p>
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<div className="flex gap-4">
						<Link to="../board" prefetch="intent">
							<Button variant="outline">Cancel</Button>
						</Link>

						<Button
							type="submit"
							disabled={!form.value?.category || !form.value?.title}
						>
							Share Item
						</Button>
					</div>
				</CardFooter>
			</Form>
		</Card>
	)
}

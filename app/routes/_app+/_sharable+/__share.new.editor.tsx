import {
	type FieldMetadata,
	getFieldsetProps,
	getFormProps,
	getInputProps,
	getTextareaProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Img } from 'openimg/react'
import { useState } from 'react'
import { data, Form, Link } from 'react-router'
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
import { Icon } from '#app/components/ui/icon.tsx'
import { Label } from '#app/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#app/components/ui/select'
import { cn, getMainImageSrc } from '#app/utils/misc.tsx'
import { type Route } from './+types/__share.new.editor'

export const MAX_UPLOAD_SIZE = 1024 * 1024 * 5 // 5MB

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
	id: z.string().optional(),
	title: z.string().min(1, 'Title is required.').max(100),
	description: z.string().min(1, 'Description is required.').max(200),
	location: z.string().min(1, 'Location is required.').max(100),
	category: z.string().min(1, 'Category is required.'),
	shareType: z.enum(['BORROW', 'GIVE']),
	duration: z.string().optional(),
	// image: ImageFieldsetSchema
	images: z.array(ImageFieldsetSchema).max(4).optional(),
})

export default function ShareEditor({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { categories, defaultShareType, shareItem } = loaderData
	const [shareType, setShareType] = useState<'BORROW' | 'GIVE'>(
		defaultShareType.toUpperCase() as 'BORROW' | 'GIVE',
	)

console.log(shareItem)
	const [form, fields] = useForm({
		id: 'share-editor',
		constraint: getZodConstraint(ShareItemSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ShareItemSchema })
		},
		lastResult: actionData?.result,
		defaultValue: {
			...shareItem,
			category: shareItem.categoryId,
			images: shareType?.images ?? [{}],
		},
		shouldRevalidate: 'onBlur',
	})

	const imageList = fields.images.getFieldList()

	return (
		<Card>
			<CardHeader>
				<CardTitle>Share an Item</CardTitle>
			</CardHeader>
			<Form method="post" {...getFormProps(form)} encType="multipart/form-data">
				<input type="hidden" name="id" value={shareItem?.id} />
				<CardContent className="space-y-2">
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
						<div className="min-h-[32px] px-4 pt-1 pb-3"></div>
					</div>

					<div className="space-y-2">
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
							<div className="text-muted-foreground absolute right-4 bottom-4 text-xs">
								{fields.description.value?.length ?? 0} / 200
							</div>
						</TextareaField>
					</div>
					<div className="space-y-2">
						<Field
							labelProps={{ children: 'Location' }}
							inputProps={{
								...getInputProps(fields.location, { type: 'text' }),
								placeholder:
									'You can be vague here. Leave specifics for messages. ex. East Medford',
							}}
							errors={fields.location.errors}
						/>
					</div>

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
						<div className="min-h-[32px] px-4 pt-1 pb-3"></div>
					</div>

					{shareType === 'BORROW' && (
						<div className="space-y-2">
							<Field
								labelProps={{ children: 'Duration' }}
								inputProps={{
									...getInputProps(fields.duration, { type: 'text' }),
									placeholder: 'How long can it be borrowed? (e.g., "1 week")',
								}}
								errors={fields.duration.errors}
							/>
						</div>
					)}

					<div>
						<Label>Images</Label>
						<ul className="flex flex-col gap-4">
							{imageList.map((imageMeta, index) => {
								const imageMetaId = imageMeta.getFieldset().id.value
								const image = shareItem?.images.find(
									({ id }) => id === imageMetaId,
								)
								return (
									<li key={imageMeta.key} className="relative border-b-2">
										<button
											className="text-foreground-destructive absolute top-0 right-0"
											{...form.remove.getButtonProps({
												name: fields.images.name,
												index,
											})}
										>
											<span aria-hidden>
												<Icon name="cross-1" />
											</span>{' '}
											<span className="sr-only">Remove image {index + 1}</span>
										</button>
										<ImageChooser
											meta={imageMeta}
											objectKey={image?.objectKey}
										/>
									</li>
								)
							})}
						</ul>
					</div>
					<Button
						className="mt-3 mb-8"
						{...form.insert.getButtonProps({ name: fields.images.name })}
					>
						<span aria-hidden>
							<Icon name="plus">Image</Icon>
						</span>{' '}
						<span className="sr-only">Add image</span>
					</Button>

					<ErrorList id={form.errorId} errors={form.errors} />
				</CardContent>

				<CardFooter className="mt-3 border-t">
					<div className="flex gap-4 py-2">
						<Link to="../board" prefetch="intent">
							<Button variant="outline">Cancel</Button>
						</Link>

						<Button
							type="submit"
							disabled={form.status === 'submitting' || !form.value?.category || !form.value?.title}
						>
							Share Item
						</Button>
					</div>
				</CardFooter>
			</Form>
		</Card>
	)
}

function ImageChooser({
	meta,
	objectKey,
}: {
	meta: FieldMetadata<ImageFieldset>
	objectKey: string | undefined
}) {
	const fields = meta.getFieldset()
	const existingImage = Boolean(fields.id.initialValue)
	const [previewImage, setPreviewImage] = useState<string | null>(
		objectKey ? getMainImageSrc(objectKey) : null,
	)
	// const [altText, setAltText] = useState(fields.altText.initialValue ?? '')

	return (
		<fieldset {...getFieldsetProps(meta)}>
			<div className="flex gap-3">
				<div className="w-32">
					<div className="relative size-32">
						<label
							htmlFor={fields.file.id}
							className={cn('group absolute size-32 rounded-lg', {
								'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
									!previewImage,
								'cursor-pointer focus-within:ring-2': !existingImage,
							})}
						>
							{previewImage ? (
								<div className="relative">
									{existingImage ? (
										<Img
											src={previewImage}
											alt={''}
											className="size-32 rounded-lg object-cover"
											width={512}
											height={512}
										/>
									) : (
										<img
											src={previewImage}
											alt={''}
											className="size-32 rounded-lg object-cover"
										/>
									)}
									{existingImage ? null : (
										<div className="bg-secondary text-secondary-foreground pointer-events-none absolute -top-0.5 -right-0.5 rotate-12 rounded-sm px-2 py-1 text-xs shadow-md">
											new
										</div>
									)}
								</div>
							) : (
								<div className="border-muted-foreground text-muted-foreground flex size-32 items-center justify-center rounded-lg border text-4xl">
									<Icon name="plus" />
								</div>
							)}
							{existingImage ? (
								<input
									{...getInputProps(fields.id, { type: 'hidden' })}
									key={fields.id.key}
								/>
							) : null}
							<input
								aria-label="Image"
								className="absolute top-0 left-0 z-0 size-32 cursor-pointer opacity-0"
								onChange={(event) => {
									const file = event.target.files?.[0]

									if (file) {
										const reader = new FileReader()
										reader.onloadend = () => {
											setPreviewImage(reader.result as string)
										}
										reader.readAsDataURL(file)
									} else {
										setPreviewImage(null)
									}
								}}
								accept="image/*"
								{...getInputProps(fields.file, { type: 'file' })}
								key={fields.file.key}
							/>
						</label>
					</div>
					<div className="min-h-[32px] px-4 pt-1 pb-3">
						<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
					</div>
				</div>
				{/*<div className="flex-1">*/}
				{/*	<Label htmlFor={fields.altText.id}>Alt Text</Label>*/}
				{/*	<Textarea*/}
				{/*		onChange={(e) => setAltText(e.currentTarget.value)}*/}
				{/*		{...getTextareaProps(fields.altText)}*/}
				{/*		key={fields.altText.key}*/}
				{/*	/>*/}
				{/*	<div className="min-h-[32px] px-4 pt-1 pb-3">*/}
				{/*		<ErrorList*/}
				{/*			id={fields.altText.errorId}*/}
				{/*			errors={fields.altText.errors}*/}
				{/*		/>*/}
				{/*	</div>*/}
				{/*</div>*/}
			</div>
			<div className="min-h-[32px] px-4 pt-1 pb-3">
				<ErrorList id={meta.errorId} errors={meta.errors} />
			</div>
		</fieldset>
	)
}

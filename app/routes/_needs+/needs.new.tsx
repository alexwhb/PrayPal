import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useMemo } from 'react'
import {
	data,
	Form,
	Link,
	type LoaderFunctionArgs,
	redirect,
} from 'react-router'
import { z } from 'zod'
import { TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
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
import { type Route } from './+types/prayer/new'

export async function loader({ params }: LoaderFunctionArgs) {
	const categories = await prisma.category.findMany({
		where: { type: 'NEED', active: true },
		select: { id: true, name: true },
	})

	return data({ categories })
}

export async function action({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: PrayerSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { description, category } = submission.value

	await prisma.request.create({
		data: {
			type: 'NEED',
			categoryId: category,
			description: description,
			fulfilled: false,
			status: 'ACTIVE',
			flagged: false,
			userId: userId,
		},
	})

	return redirect('../board')
}

export const PrayerSchema = z.object({
	description: z.string().min(1, 'Description is required.').max(400),
	category: z.string().min(1, 'Category is required.'),
})

export default function NewNeedForm({
	loaderData: { categories },
	actionData,
}: Route.ComponentProps) {
	const defaultValues = useMemo(
		() => ({
			id: 'new-need',
			description: '',
			category: '',
		}),
		[],
	)

	const [form, fields] = useForm({
		id: 'episode-editor',
		constraint: getZodConstraint(PrayerSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: PrayerSchema })
		},
		lastResult: actionData?.result,
		defaultValue: defaultValues,
		shouldRevalidate: 'onBlur',
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Post a New Need</CardTitle>
			</CardHeader>
			<Form method="post" {...getFormProps(form)}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="category">Category</Label>
						<Select
							{...getInputProps(fields.category, { type: 'text' })} // Bind the field to the form state
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
						labelProps={{ htmlFor: 'description', children: 'Prayer Request' }}
						textareaProps={{
							...getInputProps(fields.description, { type: 'text' }),
							maxLength: 400, // Set maximum characters allowed
						}}
						errors={fields?.description?.errors}
						className="relative"
					>
						<div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
							{fields.description.value?.length ?? 0} / 400
						</div>
					</TextareaField>
				</CardContent>
				<CardFooter>
					<div className="flex gap-4">
						<Link to="../board" prefetch="intent">
							<Button variant="outline">Cancel</Button>
						</Link>

						<Button
							type="submit"
							disabled={!form.value?.category || !form.value?.description}
						>
							Share Prayer Request
						</Button>
					</div>
				</CardFooter>
			</Form>
		</Card>
	)
}

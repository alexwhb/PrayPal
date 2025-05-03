
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useMemo, useState } from 'react'
import { data, Form, Link, redirect } from 'react-router'
import { z } from 'zod'
import { Field, TextareaField } from '#app/components/forms.tsx'
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
import { type Route } from './+types/share.new.ts'

export const ShareItemSchema = z.object({
    title: z.string().min(1, 'Title is required.').max(100),
    description: z.string().min(1, 'Description is required.').max(200),
    location: z.string().min(1, 'Location is required.').max(100),
    category: z.string().min(1, 'Category is required.'),
    shareType: z.enum(['BORROW', 'GIVE']),
    duration: z.string().optional(),
})

export async function loader({ request }: Route.LoaderArgs) {
    await requireUserId(request)
    const categories = await prisma.category.findMany({
        where: { type: 'SHARE', active: true },
        select: { id: true, name: true },
    })
    return data({ categories })
}

// TODO invalidate our total cache value whenever we add a new element.
export async function action({ request }: Route.ActionArgs) {
    const userId = await requireUserId(request)
    const formData = await request.formData()
    const submission = parseWithZod(formData, {
        schema: ShareItemSchema,
    })

    if (submission.status !== 'success') {
        return data(
            { result: submission.reply() },
            { status: submission.status === 'error' ? 400 : 200 },
        )
    }

    const { title, description, location, category, shareType, duration } = submission.value

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
        },
    })

    return redirect('../board')
}

export default function NewShareForm({
    loaderData: { categories },
    actionData,
}: Route.ComponentProps) {
	const [shareType, setShareType] = useState<'BORROW' | 'GIVE'>('BORROW')

    const defaultValues = useMemo(
        () => ({
            id: 'new-share',
            title: '',
            description: '',
            location: '',
            category: '',
            shareType: 'BORROW',
            duration: '',
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
            <Form
                method="post"
                {...getFormProps(form)}
            >
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
                                    <SelectItem
                                        key={category.id}
                                        value={category.id}
                                    >
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
                            placeholder: 'You can be vague here. Leave specifics for messages. ex. East Medford',
                        }}
                        errors={fields.location.errors}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="shareType">Share Type</Label>
                        <Select
                            {...getInputProps(fields.shareType, { type: 'text' })}
														onValueChange={(value : 'BORROW' | 'GIVE') => {setShareType(value)}}
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
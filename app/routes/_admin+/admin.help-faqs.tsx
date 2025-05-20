import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import React, { useState, useEffect } from 'react'
import { data, redirect, Form, useLoaderData } from 'react-router'
import { z } from 'zod'
import { Field, NumberField, TextareaField } from '#app/components/forms'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#app/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '#app/components/ui/dialog'
import { Icon } from '#app/components/ui/icon.tsx'
import { Label } from '#app/components/ui/label'
import {
	Select, SelectContent, SelectItem,
	SelectTrigger,
	SelectValue,
} from '#app/components/ui/select.tsx'
import { Switch } from '#app/components/ui/switch'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table'
import { prisma } from '#app/utils/db.server'
import { requireUserWithRole } from '#app/utils/permissions.server'
import { type Route } from './+types/admin.help-faqs.ts'

export const FAQSchema = z.object({
	id: z.string().optional(),
	question: z.string().min(5, 'Question must be at least 5 characters').max(200),
	answer: z.string().min(10, 'Answer must be at least 10 characters').max(2000),
	category: z.string().min(1, 'Category is required'),
	order: z.coerce.number().int().min(0),
	active: z.boolean().default(true),
})

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserWithRole(request, 'admin')

	const faqs = await prisma.helpFAQ.findMany({
		orderBy: [{ category: 'asc' }, { order: 'asc' }],
	})

	// Get unique categories
	const categories = [...new Set(faqs.map(faq => faq.category))]

	return data({ faqs, categories })
}

export async function action({ request }: Route.ActionArgs) {
	await requireUserWithRole(request, 'admin')

	const formData = await request.formData()
	const intent = formData.get('intent')

	// Handle delete
	if (intent === 'delete') {
		const id = formData.get('id') as string
		await prisma.helpFAQ.delete({ where: { id } })
		return redirect('/admin/help-faqs')
	}

	// Handle create/update
	const submission = parseWithZod(formData, {
		schema: FAQSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { id, question, answer, category, order, active } = submission.value

	if (id) {
		// Update existing FAQ
		await prisma.helpFAQ.update({
			where: { id },
			data: { question, answer, category, order, active },
		})
	} else {
		// Create new FAQ
		await prisma.helpFAQ.create({
			data: { question, answer, category, order, active },
		})
	}

	return redirect('/admin/help-faqs')
}

// FAQDialog component - extracted from the main component
function FAQDialog({
    isOpen,
    onOpenChange,
    selectedFAQ,
    categories,
    onSubmit,
}: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    selectedFAQ: any | null
    categories: string[]
    onSubmit: () => void
}) {
    const [order, setOrder] = useState<number | null>(selectedFAQ?.order || 0)
    
    // Update order when selectedFAQ changes
    useEffect(() => {
        setOrder(selectedFAQ?.order || 0)
    }, [selectedFAQ])

    const [form, fields] = useForm({
        id: 'faq-form',
        constraint: getZodConstraint(FAQSchema),
        defaultValue: selectedFAQ || {
            question: '',
            answer: '',
            category: '',
            order: 0,
            active: true,
        },
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: FAQSchema })
        },
    })

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{selectedFAQ ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
                    <DialogDescription>
                        {selectedFAQ
                            ? 'Update the question and answer details below.'
                            : 'Fill in the details to create a new FAQ entry.'}
                    </DialogDescription>
                </DialogHeader>

                <Form method="post" {...getFormProps(form)} onSubmit={onSubmit}>
                    {selectedFAQ && <input type="hidden" name="id" value={selectedFAQ.id} />}

                    <div className="grid gap-4 py-4">
                        <Select 
                            defaultValue={selectedFAQ?.category || ""}
                            onValueChange={(value) => {
                                // Update the hidden input with the selected value
                                const input = document.createElement('input')
                                input.name = fields.category.name
                                input.value = value
                                form.ref.current?.appendChild(input)
                            }}
                        >
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(category => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Hidden input to store the category value for form submission */}
                        <input 
                            type="hidden" 
                            name={fields.category.name} 
                            defaultValue={selectedFAQ?.category || ""} 
                        />

                        <Field
                            labelProps={{
                                htmlFor: fields.question.id,
                                children: 'Question',
                            }}
                            inputProps={{
                                ...getInputProps(fields.question, { type: 'text' }),
                                placeholder: 'Enter the question',
                                defaultValue: selectedFAQ?.question || "",
                            }}
                            errors={fields.question.errors}
                        />

                        <TextareaField
                            labelProps={{
                                htmlFor: fields.answer.id,
                                children: 'Answer',
                            }}
                            textareaProps={{
                                ...getInputProps(fields.answer, { type: 'textarea' }),
                                placeholder: 'Enter the answer',
                                rows: 5,
                                defaultValue: selectedFAQ?.answer || "",
                            }}
                            errors={fields.answer.errors}
                        />

                        <NumberField
                            min={0}
                            max={10000}
                            labelProps={{ children: 'Display Order' }}
                            onChange={setOrder}
                            value={order}
                            errors={fields.order.errors}
                        />

                        <div className="flex items-center space-x-2">
                            <Switch
                                id={fields.active.id}
                                name={fields.active.name}
                                defaultChecked={selectedFAQ?.active ?? true}
                                {...getInputProps(fields.active, { type: 'checkbox' })}
                            />
                            <Label htmlFor={fields.active.id}>Active</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {selectedFAQ ? 'Update FAQ' : 'Create FAQ'}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function AdminHelpFAQs() {
	const { faqs, categories } = useLoaderData<typeof loader>()
	const [selectedFAQ, setSelectedFAQ] = useState<null | (typeof faqs)[number]>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	function handleEdit(faq: (typeof faqs)[number]) {
		setSelectedFAQ(faq)
		setIsDialogOpen(true)
	}

	function handleNew() {
		setSelectedFAQ(null)
		setIsDialogOpen(true)
	}

	return (
		<div className="container py-8">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Manage Help FAQs</h1>
				<Button onClick={handleNew}>
					<Icon name="plus" className="h-4 w-4" />
					{/*<PlusIcon className="mr-2 h-4 w-4" />*/}
					Add New FAQ
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>FAQ List</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Category</TableHead>
								<TableHead>Question</TableHead>
								<TableHead>Order</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-[100px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{faqs.map(faq => (
								<TableRow key={faq.id}>
									<TableCell>{faq.category}</TableCell>
									<TableCell className="max-w-md truncate">{faq.question}</TableCell>
									<TableCell>{faq.order}</TableCell>
									<TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs ${
											faq.active
												? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
												: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
										}`}>
                      {faq.active ? 'Active' : 'Inactive'}
                    </span>
									</TableCell>
									<TableCell>
										<div className="flex space-x-2">
											<Button variant="outline" size="sm" onClick={() => handleEdit(faq)}>
												<Icon name="pencil-1" size="sm" />
											</Button>
											<Form method="post">
												<input type="hidden" name="intent" value="delete" />
												<input type="hidden" name="id" value={faq.id} />
												<Button variant="outline" size="sm" className="text-destructive">
													<Icon name="trash" size="sm" />
												</Button>
											</Form>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<FAQDialog
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				selectedFAQ={selectedFAQ}
				categories={categories}
				onSubmit={() => setIsDialogOpen(false)}
			/>
		</div>
	)
}
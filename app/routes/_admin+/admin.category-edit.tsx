import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useMemo, useState } from 'react'
import { data, Form, useLoaderData } from 'react-router'
import { z } from 'zod'
import { Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card'
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#app/components/ui/select'
import { Switch } from '#app/components/ui/switch'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#app/components/ui/tabs'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { type Route } from './+types/admin.category.ts'

export async function loader({ request }: Route.LoaderArgs) {
	// Ensure only admins can access this page
	await requireUserWithRole(request, 'admin')

	// Fetch all categories grouped by type
	const categories = await prisma.category.findMany({
		orderBy: [
			{ type: 'asc' },
			{ name: 'asc' }
		],
	})

	// Group categories by type
	const prayerCategories = categories.filter(cat => cat.type === 'PRAYER')
	const needCategories = categories.filter(cat => cat.type === 'NEED')
	const shareCategories = categories.filter(cat => cat.type === 'SHARE')
	const groupCategories = categories.filter(cat => cat.type === 'GROUP')

	return data({
		categories: {
			PRAYER: prayerCategories,
			NEED: needCategories,
			SHARE: shareCategories,
			GROUP: groupCategories
		}
	})
}

export async function action({ request }: Route.ActionArgs) {
	// Ensure only admins can access this endpoint
	await requireUserWithRole(request, 'admin')

	const formData = await request.formData()
	const action = formData.get('_action')

	if (action === 'create') {
		const submission = parseWithZod(formData, {
			schema: CategorySchema,
		})

		if (submission.status !== 'success') {
			return data(
				{ result: submission.reply() },
				{ status: submission.status === 'error' ? 400 : 200 },
			)
		}

		const { name, type, active } = submission.value

		try {
			await prisma.category.create({
				data: {
					name,
					type,
					active,
				},
			})

			return data({ success: true, action: 'create' })
		} catch (error) {
			// Handle unique constraint violation
			if (error.code === 'P2002') {
				return data(
					{
						result: {
							error: {
								name: ['A category with this name already exists for this type.']
							}
						}
					},
					{ status: 400 }
				)
			}
			throw error
		}
	}

	if (action === 'update') {
		const submission = parseWithZod(formData, {
			schema: CategoryUpdateSchema,
		})

		if (submission.status !== 'success') {
			return data(
				{ result: submission.reply() },
				{ status: submission.status === 'error' ? 400 : 200 },
			)
		}

		const { id, name, active } = submission.value

		try {
			await prisma.category.update({
				where: { id },
				data: {
					name,
					active,
				},
			})

			return data({ success: true, action: 'update' })
		} catch (error) {
			// Handle unique constraint violation
			if (error.code === 'P2002') {
				return data(
					{
						result: {
							error: {
								name: ['A category with this name already exists for this type.']
							}
						}
					},
					{ status: 400 }
				)
			}
			throw error
		}
	}

	if (action === 'delete') {
		const id = formData.get('id') as string

		try {
			// Check if the category is in use
			const categoryUsage = await prisma.category.findUnique({
				where: { id },
				select: {
					_count: {
						select: {
							requests: true,
							shareItems: true,
							groups: true
						}
					}
				}
			})

			const totalUsage =
				categoryUsage._count.requests +
				categoryUsage._count.shareItems +
				categoryUsage._count.groups

			// If category is in use, don't delete it but set it to inactive
			if (totalUsage > 0) {
				await prisma.category.update({
					where: { id },
					data: { active: false }
				})

				return data({
					success: true,
					action: 'deactivate',
					message: 'Category is in use and has been deactivated instead of deleted.'
				})
			}

			// If not in use, delete it
			await prisma.category.delete({
				where: { id }
			})

			return data({ success: true, action: 'delete' })
		} catch (error) {
			return data(
				{ error: 'Failed to delete category' },
				{ status: 500 }
			)
		}
	}

	return data({ error: 'Invalid action' }, { status: 400 })
}

const CategorySchema = z.object({
	name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
	type: z.enum(['PRAYER', 'NEED', 'SHARE', 'GROUP'], {
		errorMap: () => ({ message: 'Please select a valid category type' }),
	}),
	active: z.preprocess(
		(value) => value === 'true' || value === true,
		z.boolean()
	),
})

const CategoryUpdateSchema = z.object({
	id: z.string().min(1, 'ID is required'),
	name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
	active: z.preprocess(
		(value) => value === 'true' || value === true,
		z.boolean()
	),
})

export default function AdminCategoryPage() {
	const { categories } = useLoaderData<typeof loader>()
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [selectedCategory, setSelectedCategory] = useState<null | {
		id: string
		name: string
		type: string
		active: boolean
	}>(null)

	// Create category form
	const [createForm, createFields] = useForm({
		id: 'create-category',
		constraint: getZodConstraint(CategorySchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: CategorySchema })
		},
		defaultValue: {
			name: '',
			type: 'PRAYER',
			active: true,
		},
		shouldRevalidate: 'onBlur',
	})

	// Edit category form
	const [editForm, editFields] = useForm({
		id: 'edit-category',
		constraint: getZodConstraint(CategoryUpdateSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: CategoryUpdateSchema })
		},
		defaultValue: useMemo(() => ({
			id: selectedCategory?.id || '',
			name: selectedCategory?.name || '',
			active: selectedCategory?.active ?? true,
		}), [selectedCategory]),
		shouldRevalidate: 'onBlur',
	})

	// Handle edit button click
	const handleEditClick = (category) => {
		setSelectedCategory(category)
		setIsEditDialogOpen(true)
	}

	// Handle delete button click
	const handleDeleteClick = (category) => {
		setSelectedCategory(category)
		setIsDeleteDialogOpen(true)
	}

	// Render category table for a specific type
	const renderCategoryTable = (type) => {
		const typeCategories = categories[type] || []

		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>{type.charAt(0) + type.slice(1).toLowerCase()} Categories</CardTitle>
						<CardDescription>
							Manage categories for {type.toLowerCase()} requests
						</CardDescription>
					</div>
					<Button
						onClick={() => {
							createForm.reset()
							createFields.type.value = type
							setIsCreateDialogOpen(true)
						}}
						size="sm"
					>
						<Icon name="plus" className="h-4 w-4" />
						Add Category
					</Button>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-[100px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{typeCategories.length > 0 ? (
								typeCategories.map((category) => (
									<TableRow key={category.id}>
										<TableCell>{category.name}</TableCell>
										<TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												category.active
													? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
													: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
											}`}>
                        {category.active ? 'Active' : 'Inactive'}
                      </span>
										</TableCell>
										<TableCell>
											<div className="flex space-x-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleEditClick(category)}
												>
													<Icon name="pencil-1" className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDeleteClick(category)}
												>
													<Icon name="trash"  className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={3} className="text-center">
										No categories found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-8 text-3xl font-bold">Category Management</h1>

			<Tabs defaultValue="PRAYER" className="space-y-6">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="PRAYER">Prayer</TabsTrigger>
					<TabsTrigger value="NEED">Needs</TabsTrigger>
					<TabsTrigger value="SHARE">Share</TabsTrigger>
					<TabsTrigger value="GROUP">Groups</TabsTrigger>
				</TabsList>

				<TabsContent value="PRAYER">
					{renderCategoryTable('PRAYER')}
				</TabsContent>

				<TabsContent value="NEED">
					{renderCategoryTable('NEED')}
				</TabsContent>

				<TabsContent value="SHARE">
					{renderCategoryTable('SHARE')}
				</TabsContent>

				<TabsContent value="GROUP">
					{renderCategoryTable('GROUP')}
				</TabsContent>
			</Tabs>

			{/* Create Category Dialog */}
			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add New Category</DialogTitle>
						<DialogDescription>
							Create a new category for prayer requests, needs, shares, or groups.
						</DialogDescription>
					</DialogHeader>

					<Form method="post" {...getFormProps(createForm)}>
						<input type="hidden" name="_action" value="create" />

						<div className="space-y-4 py-4">
							<Field
								labelProps={{ children: 'Category Name' }}
								inputProps={{
									...getInputProps(createFields.name, { type: 'text' }),
									placeholder: 'Enter category name',
								}}
								errors={createFields.name.errors}
							/>

							<div className="space-y-2">
								<Label htmlFor="type">Category Type</Label>
								<Select
									{...getInputProps(createFields.type, { type: 'text' })}
									required
								>
									<SelectTrigger id="type">
										<SelectValue placeholder="Select a type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="PRAYER">Prayer</SelectItem>
										<SelectItem value="NEED">Need</SelectItem>
										<SelectItem value="SHARE">Share</SelectItem>
										<SelectItem value="GROUP">Group</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="flex items-center space-x-2">
								<Switch
									id="active"
									{...getInputProps(createFields.active, { type: 'checkbox' })}
									defaultChecked
								/>
								<Label htmlFor="active">Active</Label>
							</div>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsCreateDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit">Create Category</Button>
						</DialogFooter>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Edit Category Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Category</DialogTitle>
						<DialogDescription>
							Update the category details.
						</DialogDescription>
					</DialogHeader>

					<Form method="post" {...getFormProps(editForm)}>
						<input type="hidden" name="_action" value="update" />
						<input type="hidden" name="id" value={selectedCategory?.id || ''} />

						<div className="space-y-4 py-4">
							<Field
								labelProps={{ children: 'Category Name' }}
								inputProps={{
									...getInputProps(editFields.name, { type: 'text' }),
									placeholder: 'Enter category name',
								}}
								errors={editFields.name.errors}
							/>

							<div className="flex items-center space-x-2">
								<Switch
									id="edit-active"
									{...getInputProps(editFields.active, { type: 'checkbox' })}
									defaultChecked={selectedCategory?.active}
								/>
								<Label htmlFor="edit-active">Active</Label>
							</div>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsEditDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit">Update Category</Button>
						</DialogFooter>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Delete Category Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Category</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this category? This action cannot be undone.
							If the category is in use, it will be deactivated instead.
						</DialogDescription>
					</DialogHeader>

					<Form method="post">
						<input type="hidden" name="_action" value="delete" />
						<input type="hidden" name="id" value={selectedCategory?.id || ''} />

						<DialogFooter className="mt-6">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsDeleteDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit" variant="destructive">Delete Category</Button>
						</DialogFooter>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	)
}
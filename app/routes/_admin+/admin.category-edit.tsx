import {getFormProps, getInputProps, useForm} from '@conform-to/react'
import {getZodConstraint, parseWithZod} from '@conform-to/zod'
import {useState, useEffect} from 'react'
import {data, Form} from 'react-router'
import {z} from 'zod'
import {Field} from '#app/components/forms.tsx'
import {Button} from '#app/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from '#app/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '#app/components/ui/dialog'
import {Icon} from '#app/components/ui/icon.tsx'
import {Label} from '#app/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '#app/components/ui/select'
import {Switch} from '#app/components/ui/switch'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '#app/components/ui/table'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '#app/components/ui/tabs'
import {prisma} from '#app/utils/db.server.ts'
import {requireUserWithRole} from '#app/utils/permissions.server.ts'
import {Route} from './+types/admin.category-edit.ts'


type CategoryType = 'PRAYER' | 'NEED' | 'SHARE' | 'GROUP'

type Category = typeof Route.ComponentProps['categories'][number]

// Schemas
const CategorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
    type: z.enum(['PRAYER', 'NEED', 'SHARE', 'GROUP'], {
        errorMap: () => ({message: 'Please select a valid category type'}),
    }),
    active: z.boolean().default(false),
    // active: z.preprocess((value) => value === 'true' || value === true, z.boolean()),
})

const CategoryUpdateSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
    active: z.boolean().default(false),
})

// Loader
export async function loader({request}: Route.LoaderArgs) {
    await requireUserWithRole(request, 'admin')
    const categories = await prisma.category.findMany({
        orderBy: [{type: 'asc'}, {name: 'asc'}],
    })
    const groupedCategories = {
        PRAYER: categories.filter((cat) => cat.type === 'PRAYER'),
        NEED: categories.filter((cat) => cat.type === 'NEED'),
        SHARE: categories.filter((cat) => cat.type === 'SHARE'),
        GROUP: categories.filter((cat) => cat.type === 'GROUP'),
    }
    return data({categories: groupedCategories})
}

// Action
export async function action({request} : Route.ActionArgs) {
    await requireUserWithRole(request, 'admin')
    const formData = await request.formData()
    const action = formData.get('_action')

    if (action === 'create') {
        const submission = parseWithZod(formData, {schema: CategorySchema})
        if (submission.status !== 'success') {
            return data(
                {result: submission.reply()},
                {status: submission.status === 'error' ? 400 : 200},
            )
        }
        const {name, type, active} = submission.value
        await prisma.category.create({data: {name, type, active}})
        return data({success: true, action: 'create'})
    }

    if (action === 'update') {
        const submission = parseWithZod(formData, {schema: CategoryUpdateSchema})
        console.log(submission, formData)

        if (submission.status !== 'success') {
            return data(
                {result: submission.reply()},
                {status: submission.status === 'error' ? 400 : 200},
            )
        }
        const {id, name, active} = submission.value
        await prisma.category.update({where: {id}, data: {name, active}})
        return data({success: true, action: 'update'})
    }

    if (action === 'delete') {
        const id = formData.get('id') as string
        const categoryUsage = await prisma.category.findUnique({
            where: {id},
            select: {_count: {select: {requests: true, shareItems: true, groups: true}}},
        })
        const totalUsage =
            categoryUsage._count.requests +
            categoryUsage._count.shareItems +
            categoryUsage._count.groups
        if (totalUsage > 0) {
            await prisma.category.update({where: {id}, data: {active: false}})
            return data({
                success: true,
                action: 'deactivate',
                message: 'Category is in use and has been deactivated instead of deleted.',
            })
        }
        await prisma.category.delete({where: {id}})
        return data({success: true, action: 'delete'})
    }

    return data({error: 'Invalid action'}, {status: 400})
}

// Merged Dialog Component
function CategoryDialog({
                            isOpen,
                            onOpenChange,
                            category,
                            defaultType = 'PRAYER',
                        }: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    category?: Category
    defaultType?: CategoryType
}) {


    const isEdit = !!category
    const schema = isEdit ? CategoryUpdateSchema : CategorySchema
    const [form, fields] = useForm({
        id: isEdit ? 'edit-category' : 'create-category',
        constraint: getZodConstraint(schema),
        onValidate({formData}) {
            const temp =   parseWithZod(formData, {schema})
            console.log(temp)
            return temp
        },
        defaultValue: isEdit
            ? {name: category.name, active: category.active}
            : {name: '', type: defaultType, active: true},
        shouldRevalidate: 'onBlur',
    })

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Update the category details.'
                            : 'Create a new category for prayer requests, needs, shares, or groups.'}
                    </DialogDescription>
                </DialogHeader>

                <Form method="post" {...getFormProps(form)}>
                    <input type="hidden" name="_action" value={isEdit ? 'update' : 'create'}/>
                    {isEdit && <input type="hidden" name="id" value={category.id}/>}

                    <div className="space-y-4 py-4">
                        <Field
                            labelProps={{children: 'Category Name'}}
                            inputProps={{
                                ...getInputProps(fields.name, {type: 'text'}),
                                placeholder: 'Enter category name',
                            }}
                            errors={fields.name.errors}
                        />

                        {!isEdit && (
                            <div className="space-y-2">
                                <Label htmlFor="type">Category Type</Label>
                                <Select {...getInputProps(fields.type, {type: 'text'})} required>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select a type"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PRAYER">Prayer</SelectItem>
                                        <SelectItem value="NEED">Need</SelectItem>
                                        <SelectItem value="SHARE">Share</SelectItem>
                                        <SelectItem value="GROUP">Group</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Switch
                                id={isEdit ? 'edit-active' : 'active'}
                                {...getInputProps(fields.active, {type: 'checkbox'})}
                            />
                            <Label htmlFor={isEdit ? 'edit-active' : 'active'}>Active</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" >{isEdit ? 'Update Category' : 'Create Category'}</Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

// Main Component
export default function AdminCategoryPage({loaderData, actionData}: Route.ComponentProps) {
    const {categories} = loaderData
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [defaultType, setDefaultType] = useState<CategoryType>('PRAYER')
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)


    // Add effect to close dialog on successful submission
    useEffect(() => {
        if (actionData?.success &&
            (actionData.action === 'create' || actionData.action === 'update')) {
            setSelectedCategory(null)
            setIsDialogOpen(false);
        }
    }, [actionData]);


    const handleAddClick = (type: CategoryType) => {
        setDefaultType(type)
        setSelectedCategory(null)
        setIsDialogOpen(true)
    }

    const handleEditClick = (category: Category) => {
        setSelectedCategory(category)
        setIsDialogOpen(true)
    }

    const handleDeleteClick = (category: Category) => {
        setSelectedCategory(category)
        setIsDeleteDialogOpen(true)
    }

    const renderCategoryTable = (type: CategoryType) => {
        const typeCategories = categories[type] || []
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{type.charAt(0) + type.slice(1).toLowerCase()} Categories</CardTitle>
                        <CardDescription>Manage categories for {type.toLowerCase()} requests</CardDescription>
                    </div>
                    <Button onClick={() => handleAddClick(type)} size="sm">
                        <Icon name="plus" className="h-4 w-4"/>
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
                      <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              category.active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}
                      >
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
                                                    <Icon name="pencil-1" className="h-4 w-4"/>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(category)}
                                                >
                                                    <Icon name="trash" className="h-4 w-4"/>
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

                <TabsContent value="PRAYER">{renderCategoryTable('PRAYER')}</TabsContent>
                <TabsContent value="NEED">{renderCategoryTable('NEED')}</TabsContent>
                <TabsContent value="SHARE">{renderCategoryTable('SHARE')}</TabsContent>
                <TabsContent value="GROUP">{renderCategoryTable('GROUP')}</TabsContent>
            </Tabs>

            <CategoryDialog
                isOpen={isDialogOpen}
                onOpenChange={(isOpen: boolean) => {
                    setDefaultType('PRAYER')
                    setSelectedCategory(null)
                    setIsDialogOpen(isOpen)
                }}
                category={selectedCategory}
                defaultType={defaultType}
            />

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
                        <input type="hidden" name="_action" value="delete"/>
                        <input type="hidden" name="id" value={selectedCategory?.id || ''}/>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" variant="destructive">
                                Delete Category
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
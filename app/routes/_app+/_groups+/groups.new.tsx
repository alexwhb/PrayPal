import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { SelectGroup } from '@radix-ui/react-select'
import { format } from 'date-fns/format'
import React, { useCallback, useMemo, useState } from 'react'
import { data, Form, useFetcher } from 'react-router'
import { z } from 'zod'
import { DateTimePicker } from '#app/components/date-time-picker.tsx'
import {
	ErrorList,
	Field,
	NumberField,
	TextareaField,
} from '#app/components/forms'
import { UserAutocomplete } from '#app/components/groups/user-autocomplet.tsx'
import { Button } from '#app/components/ui/button'
import { Label } from '#app/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#app/components/ui/select.tsx'
import { type UserSearchResult } from '#app/routes/resources+/users.search.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { type Route } from './+types/groups.new.ts'
import { Calendar } from '#app/components/ui/calendar.tsx'

interface User {
	id: string
	name: string
}

const GroupSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().min(1, 'Description is required'),
	frequency: z.enum([
		'ONCE',
		'DAILY',
		'WEEKLY',
		'BIWEEKLY',
		'MONTHLY',
		'CUSTOM',
	]),

	startDate: z.date({
		required_error: 'A start date is required.',
	}),
	meetingTime: z.string().min(1, 'Meeting time is required'),
	endDate: z.date().optional(),

	location: z.string().optional(),
	isOnline: z.boolean().default(false),
	capacity: z.number().int().positive().optional(),
	categoryId: z.string().min(1, 'Category is required'),
	admins: z.array(z.string()).optional(),
})

export async function loader() {
	const categories = await prisma.category.findMany({
		where: { type: 'GROUP', active: true },
		select: { id: true, name: true },
	})

	return { categories }
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: GroupSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const {
		name,
		description,
		frequency,
		meetingTime,
		location,
		isOnline,
		capacity,
		categoryId,
		admins = [],
	} = submission.value
	await prisma.group.create({
		data: {
			name,
			description,
			frequency,
			meetingTime: new Date(meetingTime),
			location,
			isOnline,
			capacity,
			categoryId,
			memberships: {
				create: [
					{ userId, role: 'LEADER' },
					...admins.map((adminId) => ({
						userId: adminId,
						role: 'LEADER',
					})),
				],
			},
		},
	})

	return redirectWithToast('/groups/board', {
		title: 'Group created successfully!',
		description: '',
		type: 'success',
	})
}

export default function NewGroupForm({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { categories } = loaderData
	const [isOpen, setIsOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [capacity, setCapacity] = useState<number | null>(null)

	const initialDate = useMemo(() => new Date(), [])

	const [selectedDate, setSelectedDate] = useState(initialDate)
	useMemo(() => format(selectedDate, 'PPP'), [selectedDate])
	useMemo(() => selectedDate.toISOString(), [selectedDate])
	// const [selectedAdmins, setSelectedAdmins] = useState<User[]>([]);
	const userFetcher = useFetcher<UserSearchResult[]>()
	//
	const fetchUsers = React.useCallback(
		async (newQuery: string) => {
			if (query == newQuery) return
			// Load the data using the fetcher
			setQuery(newQuery)
			await userFetcher.load(`/resources/users/search?q=${newQuery}`)
		},
		[userFetcher, query],
	)

	const [selectedAdmins, setSelectedAdmins] = React.useState<
		UserSearchResult[]
	>([])
	useCallback((date: Date | undefined) => {
		if (date) setSelectedDate(date)
	}, [])

	// Stabilize onSelect with useCallback
	const onSelect = React.useCallback(
		(user: UserSearchResult | null) => {
			if (!user) return
			if (!selectedAdmins.some((admin) => admin.id === user.id)) {
				setSelectedAdmins((prev) => [...prev, user])
			}
			setQuery('')
			setIsOpen(false)
		},
		[selectedAdmins],
	)

	const defaultValues = {
		categoryId: categories[0]?.id,
		admins: selectedAdmins,
		frequency: 'MONTHLY',
		meetingTime: new Date().toISOString(),
		isOnline: false,
		capacity: null,
		description: '',
		name: '',
		location: '',
	}

	const [form, fields] = useForm({
		id: 'new-group',
		constraint: getZodConstraint(GroupSchema),
		// lastSubmission: actionData,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: GroupSchema })
		},
		defaultValue: defaultValues,
		shouldRevalidate: 'onBlur',
	})

	console.log(form.value.frequency, fields)

	return (
		<Form method="post" {...getFormProps(form)} className="space-y-8">
			{/* This should have a limit of 75 characters */}
			<Field
				labelProps={{ children: 'Group Name' }}
				inputProps={{
					...getInputProps(fields.name, { type: 'text' }),
					placeholder: 'Enter group name',
				}}
				errors={fields.name.errors}
			/>

			<TextareaField
				labelProps={{ children: 'Description' }}
				textareaProps={{
					...getInputProps(fields.description, { type: 'text' }),
					maxLength: 400, // Set maximum characters allowed
				}}
				errors={fields.description.errors}
				className="relative"
			>
				<div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
					{fields.description.value?.length ?? 0} / 400
				</div>
			</TextareaField>

			<Field
				labelProps={{ children: 'Location' }}
				inputProps={{
					...getInputProps(fields.location, { type: 'text' }),
					placeholder: 'Enter group location',
				}}
				errors={fields.location.errors}
			/>

			{/* TODO we should make custom have a text input maybe? */}
			<div className="space-y-2">
				<Label htmlFor="frequency">Frequency</Label>
				<Select
					{...getInputProps(fields.frequency, { type: 'text' })}
					onValueChange={(value) => {
						form.update(fields.frequency.name, value)
					}}
					required
				>
					<SelectTrigger id="frequency">
						<SelectValue placeholder="Select a frequency" />
					</SelectTrigger>
					<SelectContent>
						{['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'].map((freq) => (
							<SelectItem key={freq} value={freq}>
								{freq.charAt(0) + freq.slice(1).toLowerCase()}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="min-h-[12px] px-4 pb-3 pt-1">
					{fields.frequency.errorId ? (
						<ErrorList
							id={fields.frequency.errorId}
							errors={fields.frequency.errors}
						/>
					) : null}
				</div>
			</div>

			{fields.frequency.value === 'CUSTOM' ? (
				<CustomDateCalendar fields={fields} />
			) : (
				<div className="space-y-2">
					<Label>Activity Date</Label>
					<DateTimePicker date={selectedDate} setDate={setSelectedDate} />
					<input
						type="hidden"
						name="meetingTime"
						value={selectedDate.toISOString()}
					/>
				</div>
			)}

			<NumberField
				min={1}
				max={10000}
				labelProps={{ children: 'Capacity (optional)' }}
				onChange={setCapacity}
				value={capacity}
				errors={fields.capacity.errors}
			/>

			<div className="space-y-2">
				<Label htmlFor="category">Category</Label>
				<Select
					{...getInputProps(fields.categoryId, { type: 'text' })} // Bind the field to the form state
					required
				>
					<SelectTrigger id="category">
						<SelectValue placeholder="Select a category" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{categories.map((category: { id: string; name: string }) => (
								<SelectItem key={category.id} value={category.id}>
									{category.name}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<div className="min-h-[12px] px-4 pb-3 pt-1">
					{fields.categoryId.errorId ? (
						<ErrorList
							id={fields.categoryId.errorId}
							errors={fields.categoryId.errors}
						/>
					) : null}
				</div>
			</div>

			{/*TODO this is not worth my time right now, but it would be nice to have down the road. */}

			<div className="space-y-2">
				<Label htmlFor={fields.admins.id}>Additional Group Leaders</Label>

				<UserAutocomplete
					id="admins-search"
					isLoading={userFetcher.state === 'loading'}
					isOpen={isOpen}
					setIsOpen={setIsOpen}
					onSelect={onSelect}
					users={userFetcher.data ?? []}
					onQueryChange={fetchUsers}
					className="flex w-[250px]"
				/>

				{/* Display selected admins */}
				<div className="mt-2 flex flex-wrap gap-2">
					{selectedAdmins.map((admin) => (
						<div
							key={admin.id}
							className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
						>
							<span>{admin.name}</span>
							<button
								type="button"
								onClick={() =>
									setSelectedAdmins(
										selectedAdmins.filter((a) => a.id !== admin.id),
									)
								}
								className="text-muted-foreground hover:text-foreground"
							>
								×
							</button>
						</div>
					))}
				</div>

				{/* Hidden input to submit selected admins */}
				{selectedAdmins.map((admin) => (
					<input
						key={admin.id}
						type="hidden"
						name="admin ids"
						value={admin.id}
					/>
				))}
			</div>

			<Button type="submit" className="w-full">
				Create Group
			</Button>
		</Form>
	)
}

function CustomDateCalendar({
	fields,
}: {
	fields: ReturnType<typeof useForm>[1]
}) {
	return (
		<div className="space-y-4">
			<Label htmlFor="availableDates">Select Dates</Label>
			<Calendar
				mode="multiple"
				{...getInputProps(fields.customFrequency, { type: 'text' })}
				className="rounded-md border"
				numberOfMonths={2}
				fromDate={new Date()}
			/>
		</div>
	)
}

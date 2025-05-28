import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { SelectGroup } from '@radix-ui/react-select'
import { format } from 'date-fns/format'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { data, Form, Link, useFetcher } from 'react-router'
import { z } from 'zod'
import { DateTimePicker } from '#app/components/date-time-picker.tsx'
import { ErrorList, Field, NumberField, SwitchConform, TextareaField } from '#app/components/forms'
import { UserAutocomplete } from '#app/components/groups/user-autocomplet.tsx'
import { Button } from '#app/components/ui/button'
import { Calendar } from '#app/components/ui/calendar.tsx'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '#app/components/ui/card.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#app/components/ui/select.tsx'

import { Separator } from '#app/components/ui/separator.tsx'
import { type UserSearchResult } from '#app/routes/resources+/users.search.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { type Route } from './+types/groups.new.ts'

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

	// For CUSTOM frequency - from CustomDateCalendar
	// Conform-to might send these as multiple form entries with the same name or a serialized string.
	// The preprocess step helps ensure it's parsed into an array of Date objects.
	customFrequency: z.preprocess(
		(val) => {
			if (Array.isArray(val)) {
				// Filter out any null/undefined values that might result from empty form fields
				return val.filter(v => v != null).map(v => v instanceof Date ? v : new Date(String(v)))
			}
			if (typeof val === 'string' && val.trim() !== '') {
				// Attempt to parse if it's a single date string (though less likely for multi-date picker)
				// Or if conform serializes the array as a single string, adjust parsing accordingly.
				// For now, assume it's an array from formData.getAll() or conform handles it.
				try {
					// This part might need adjustment based on how Calendar data is submitted
					const date = new Date(val)
					if (!isNaN(date.getTime())) return [date]
				} catch (e) {
					return [] // Or handle error
				}
			}
			return val // Let Zod attempt to parse, or pass through if already Date[]
		},
		z.array(z.date({ invalid_type_error: 'Each custom date must be a valid date.' }))
			.optional(), // Make it optional at base level, superRefine will enforce if frequency is CUSTOM
	),

	// For non-CUSTOM frequencies - this will be an ISO string from DateTimePicker
	meetingTime: z.string().optional(),

	endDate: z.date().optional(),

	location: z.string().optional(),
	isPrivate: z.boolean().default(false),
	isOnline: z.boolean().default(false),
	capacity: z.number().int().positive().optional(),
	categoryId: z.string().min(1, 'Category is required'),
	admins: z.array(z.string()).optional(),
	videoUrl: z.string().url().optional(),
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
		customFrequency,
		location,
		isPrivate,
		isOnline,
		videoUrl,
		capacity,
		categoryId,
		admins = [],
	} = submission.value

	// Store custom dates as JSON if using CUSTOM frequency
	const customEventDatesJson = frequency === 'CUSTOM' && customFrequency?.length
		? JSON.stringify(customFrequency.map(date => date.toISOString()))
		: null

	await prisma.group.create({
		data: {
			name,
			description,
			frequency,
			meetingTime: frequency !== 'CUSTOM' ? new Date(meetingTime) : null,
			customEventDatesJson,
			location: isOnline ? videoUrl : location,
			isPrivate,
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
		capacity: null,
		customFrequency: [],
		endDate: null,
		isOnline: false,
		isPrivate: false,
		description: '',
		name: '',
		location: '',
		videoUrl: '',
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



	return (
		<Card>
			<CardHeader>
				<CardTitle>Post a New Group</CardTitle>
			</CardHeader>
			<Form method="post" {...getFormProps(form)} className="space-y-8">
				<CardContent className="space-y-4">
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
							placeholder: 'Enter group description.',
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
						<CustomDateCalendar fields={fields} form={form} />
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

					{/* Add toggle switches for isPrivate and isOnline with proper spacing */}
					<div className="space-y-4">
						<Separator className="my-4" />
						
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label htmlFor={fields.isPrivate.id}>Private Group</Label>
									<p className="text-sm text-muted-foreground">
										Require approval for new members to join, and details are hidden from non-members (such as location)
									</p>
								</div>
								<SwitchConform meta={fields.isPrivate} />
							</div>

							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label htmlFor={fields.isOnline.id}>Online Meeting</Label>
									<p className="text-sm text-muted-foreground">
										This group meets virtually
									</p>
								</div>
								<SwitchConform meta={fields.isOnline} />
							</div>
						</div>

						<Separator className="my-4" />
					</div>

					{/* Conditional field for video URL when isOnline is toggled on */}
					{fields.isOnline.value === 'on' && (
						<Field
							labelProps={{ children: 'Video Meeting URL' }}
							inputProps={{
								...getInputProps(fields.videoUrl, { type: 'text' }),
								placeholder: 'https://meet.google.com/...',
							}}
							errors={fields.videoUrl.errors}
						/>
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
				</CardContent>
				<CardFooter className="border-t">
					<div className="flex gap-4">
						<Link to="../board" prefetch="intent">
							<Button variant="outline">Cancel</Button>
						</Link>
						<Button type="submit" disabled={!form.value?.name || !form.value?.description}>
							Create Group
						</Button>
					</div>
				</CardFooter>
			</Form>
		</Card>
	)
}

function CustomDateCalendar({
															fields,
															form,
														}: {
	fields: ReturnType<typeof useForm>[1],
	form: ReturnType<typeof useForm>[0],
}) {
	const [selectedDates, setSelectedDates] = useState<Date[]>([])
	const [selectedTime, setSelectedTime] = useState<Date>(new Date())

	// Update form values when dates or time changes
	useEffect(() => {
		if (selectedDates.length > 0) {
			// Set the time component for each selected date
			const updatedDates = selectedDates.map(date => {
				const newDate = new Date(date)
				newDate.setHours(selectedTime.getHours())
				newDate.setMinutes(selectedTime.getMinutes())
				return newDate
			})

			// Update the form field
			form.update(fields.customFrequency.name, updatedDates)
		}
	}, [selectedDates, selectedTime, fields.customFrequency.name])

	return (
		<div className="space-y-4">
			<Label htmlFor="availableDates">Select Dates</Label>
			<Calendar
				mode="multiple"
				selected={selectedDates}
				onSelect={(dates) => {
					// Convert undefined to empty array
					setSelectedDates(dates || [])
				}}
				className="rounded-md border"
				numberOfMonths={2}
				fromDate={new Date()}
			/>

			{selectedDates.length > 0 && (
				<div className="mt-4">
					<Label>Select Time for Events</Label>
					<div className="mt-2">
						<Input
							type="time"
							value={format(selectedTime, 'HH:mm')}
							onChange={(e) => {
								const [hours, minutes] = e.target.value.split(':').map(Number)
								const newTime = new Date()
								newTime.setHours(hours)
								newTime.setMinutes(minutes)
								setSelectedTime(newTime)
							}}
						/>
					</div>
				</div>
			)}
		</div>
	)
}
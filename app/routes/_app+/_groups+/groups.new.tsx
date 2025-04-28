import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { SelectGroup } from '@radix-ui/react-select'
import React, { useState } from 'react'
import { data, Form, useFetcher  } from 'react-router'
import { z } from 'zod'
import {
	ErrorList,
	Field,
	NumberField, TagField,
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


interface User {
  id: string;
  name: string;
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
	meetingTime: z.string().min(1, 'Meeting time is required'),
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

	const group = await prisma.group.create({
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

	// const [selectedAdmins, setSelectedAdmins] = useState<User[]>([]);
	const userFetcher = useFetcher<UserSearchResult[]>();
	//
	const fetchUsers = React.useCallback(
		async (newQuery: string)=> {
			if (query == newQuery) return;
			// Load the data using the fetcher
			setQuery(newQuery)
			await userFetcher.load(`/resources/users/search?q=${newQuery}`);

		},
		[userFetcher, query]
	);


	// console.log(userFetcher.data)

	// const fetchUsers = async (query: string): Promise<User[]> => {
	// 	if (!query) return [];
	//
	// 	userFetcher.load(`/resources/users/search?q=${query}`);
	//
	// 	return [];
	// }


	// // Add debugging to see when results update
	// const searchResults = React.useMemo(() => {
	// 	console.log('userFetcher state:', userFetcher.state);
	// 	console.log('userFetcher data:', userFetcher.data);
	//
	// 	if (userFetcher.state === "idle" && userFetcher.data) {
	// 		return userFetcher.data.map((u) => ({
	// 			id: u.id,
	// 			name: u.name ?? u.username,
	// 		}));
	// 	}
	// 	return [];
	// }, [userFetcher.state, userFetcher.data]);
	//
	// // Add this useEffect to monitor fetcher state changes
	// React.useEffect(() => {
	// 	console.log('Fetcher state changed:', userFetcher.state);
	// 	console.log('Fetcher data:', userFetcher.data);
	// }, [userFetcher.state, userFetcher.data]);
	//
	// console.log(searchResults)
	const [selectedAdmins, setSelectedAdmins] = React.useState<UserSearchResult[]>([]);

	// Stabilize fetchUsers with useCallback
	// const fetchUsers = React.useCallback(
	// 	async (query: string): Promise<User[]> => {
	// 		if (!query || query.length < 2) return [];
	// 		// Your API call here, e.g., fetch(`/users/search?q=${query}`)
	// 		return [];
	// 	},
	// 	[]
	// );

	// Stabilize onSelect with useCallback
	const onSelect = React.useCallback((user: UserSearchResult | null) => {
		if (!user) return;
		if (!selectedAdmins.some(admin => admin.id === user.id)) {
			setSelectedAdmins(prev => [...prev, user]);
		}
		setQuery("")
		setIsOpen(false)
	}, [selectedAdmins]);




	const defaultValues = {
		categoryId: categories[0]?.id,
		admins: selectedAdmins,
		frequency: 'WEEKLY',
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

	return (
		<Form method="post" {...getFormProps(form)} className="space-y-8">

			<Button onClick={(e) =>{
				e.preventDefault()
			void fetchUsers('m')

			}}>Log form value</Button>

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
					placeholder: 'Describe your group',
				}}
				errors={fields.description.errors}
			/>

			<div className="space-y-2">
				<Label htmlFor="frequency">Frequency</Label>
				<Select
					{...getInputProps(fields.frequency, { type: 'text' })} // Bind the field to the form state
					required
				>
					<SelectTrigger id="frequency">
						<SelectValue placeholder="Select a category" />
					</SelectTrigger>
					<SelectContent>
						{['ONCE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'].map(
							(freq) => (
								<option key={freq} value={freq}>
									{freq.charAt(0) + freq.slice(1).toLowerCase()}
								</option>
							),
						)}
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



			{/*<Field*/}
			{/*  labelProps={{ children: 'Meeting Time' }}*/}
			{/*  inputProps={{*/}
			{/*    ...conform.input(fields.meetingTime),*/}
			{/*    type: 'datetime-local',*/}
			{/*  }}*/}
			{/*  errors={fields.meetingTime.errors}*/}
			{/*/>*/}

			<Field
				labelProps={{ children: 'Location' }}
				inputProps={{
					...getInputProps(fields.location, { type: 'text' }),
					placeholder:
						'Enter group location',
				}}
				errors={fields.location.errors}
			/>

			{/*<div className="flex items-center gap-2">*/}
			{/*  <input*/}
			{/*    type="checkbox"*/}
			{/*		...getInputProps(fields.isOnline, { type: 'checkbox' })*/}
			{/*    /!*{...conform.input(fields.isOnline, { type: 'checkbox' })}*!/*/}
			{/*  />*/}
			{/*  <Label>Online Meeting</Label>*/}
			{/*</div>*/}

			<NumberField
				labelProps={{ children: 'Capacity (optional)' }}
				{...getInputProps(fields.capacity, { type: 'number' })}
				min={1}
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
					{fields.frequency.errorId ? (
						<ErrorList
							id={fields.frequency.errorId}
							errors={fields.frequency.errors}
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
								onClick={() => setSelectedAdmins(selectedAdmins.filter(a => a.id !== admin.id))}
								className="text-muted-foreground hover:text-foreground"
							>
								×
							</button>
						</div>
					))}
				</div>

				{/* Hidden input to submit selected admins */}
				{selectedAdmins.map(admin => (
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

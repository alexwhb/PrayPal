



import { z } from 'zod'
import { Field, NumberField, TagField, TextareaField } from '#app/components/forms'
import { Button } from '#app/components/ui/button'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Label } from '#app/components/ui/label'
import { useState } from 'react'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { data, Form } from 'react-router'
import { PrayerSchema } from '#app/routes/_app+/_prayer+/prayer.new.tsx'
import { RadioGroup } from '@radix-ui/react-menu'
import { createId as cuid } from '@paralleldrive/cuid2'

const GroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  frequency: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM']),
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

  const potentialAdmins = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          name: {
            in: ['admin', 'moderator']
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      username: true,
    }
  })

  return { categories, potentialAdmins }
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
          ...admins.map(adminId => ({
            userId: adminId,
            role: 'LEADER'
          }))
        ]
      }
    },
  })

  return redirectWithToast('/groups/board',  {title: "Group created successfully!", description: '', type: 'success'})
}

export default function NewGroupForm({loaderData, actionData}: Route.ComponentProps) {
  const { categories, potentialAdmins } = loaderData
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([])

	const defaultValues = {
		categoryId: categories[0]?.id,
		admins: selectedAdmins,
		frequency: 'WEEKLY',
		meetingTime: new Date().toISOString(),
		isOnline: false,
		capacity: 0,
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
    <Form method="post"	{...getFormProps(form)} className="space-y-8">
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



      {/*<div className="space-y-2">*/}
      {/*  <Label>Meeting Frequency</Label>*/}
      {/*  <select*/}
      {/*    {...getInputProps(fields.frequency, { type: 'text' })}*/}
      {/*    className="w-full "*/}
      {/*  >*/}
      {/*    {['ONCE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'].map(*/}
      {/*      (freq) => (*/}
      {/*        <option key={freq} value={freq}>*/}
      {/*          {freq.charAt(0) + freq.slice(1).toLowerCase()}*/}
      {/*        </option>*/}
      {/*      ),*/}
      {/*    )}*/}
      {/*  </select>*/}
      {/*  {fields.frequency.errors && (*/}
      {/*    <div className="text-sm text-destructive">*/}
      {/*      {fields.frequency.errors}*/}
      {/*    </div>*/}
      {/*  )}*/}
      {/*</div>*/}

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
          placeholder: 'Meeting location (optional)',
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

      {/*<NumberField*/}
      {/*  labelProps={{ children: 'Capacity (optional)' }}*/}
      {/*  value={fields.capacity.defaultValue ?? null}*/}
      {/*  onChange={(value) => {*/}
      {/*    const capacityInput = document.querySelector(*/}
      {/*      `input[name="${fields.capacity.name}"]`,*/}
      {/*    ) as HTMLInputElement*/}
      {/*    capacityInput.value = value?.toString() ?? ''*/}
      {/*  }}*/}
      {/*  min={1}*/}
      {/*  errors={fields.capacity.errors}*/}
      {/*/>*/}

      {/*<div className="space-y-2">*/}
      {/*  <Label>Category</Label>*/}
      {/*  <select*/}
      {/*    {...conform.select(fields.categoryId)}*/}
      {/*    className="w-full rounded-md border border-input px-3 py-2"*/}
      {/*  >*/}
      {/*    <option value="">Select a category</option>*/}
      {/*    {categories.map((category) => (*/}
      {/*      <option key={category.id} value={category.id}>*/}
      {/*        {category.name}*/}
      {/*      </option>*/}
      {/*    ))}*/}
      {/*  </select>*/}
      {/*  {fields.categoryId.errors && (*/}
      {/*    <div className="text-sm text-destructive">*/}
      {/*      {fields.categoryId.errors}*/}
      {/*    </div>*/}
      {/*  )}*/}
      {/*</div>*/}

      {/*<div className="space-y-2">*/}
      {/*  <Label>Additional Group Admins</Label>*/}
      {/*  <TagField*/}
      {/*    labelProps={{ children: '' }}*/}
      {/*    tags={selectedAdmins.map(*/}
      {/*      id => potentialAdmins.find(admin => admin.id === id)?.name ?? ''*/}
      {/*    )}*/}
      {/*    setTags={(newTags) => {*/}
      {/*      const newAdmins = newTags*/}
      {/*        .map(tag => */}
      {/*          potentialAdmins.find(*/}
      {/*            admin => admin.name === tag || admin.username === tag*/}
      {/*          )?.id*/}
      {/*        )*/}
      {/*        .filter((id): id is string => id !== undefined)*/}
      {/*      setSelectedAdmins(newAdmins)*/}
      {/*    }}*/}
      {/*    inputProps={{*/}
      {/*      placeholder: 'Type admin name and press Enter',*/}
      {/*    }}*/}
      {/*  />*/}
      {/*  {selectedAdmins.map(adminId => (*/}
      {/*    <input*/}
      {/*      key={adminId}*/}
      {/*      type="hidden"*/}
      {/*      name={conform.name(fields.admins.name)}*/}
      {/*      value={adminId}*/}
      {/*    />*/}
      {/*  ))}*/}
      {/*</div>*/}

      <Button type="submit" className="w-full">
        Create Group
      </Button>
    </Form>
  )
}
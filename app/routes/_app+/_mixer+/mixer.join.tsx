import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Check, ChevronsUpDown, PlusCircle, Search, X } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { data, Form, Link, redirect, useSearchParams } from "react-router"
import { z } from 'zod'
import { Field, TextareaField } from '#app/components/forms.tsx'
import { Avatar, AvatarFallback, AvatarImage } from "#app/components/ui/avatar"
import { Button } from "#app/components/ui/button"
import { Calendar } from "#app/components/ui/calendar"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '#app/components/ui/card'
import {Checkbox} from "#app/components/ui/checkbox"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "#app/components/ui/command"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "#app/components/ui/dialog"
import { Input } from "#app/components/ui/input"
import { Label } from "#app/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "#app/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "#app/components/ui/radio-group"
import { Switch } from "#app/components/ui/switch"
import { cn } from "#app/lib/utils"
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/mixer.join.ts'

// Activity types for the mixer
const activityTypes = [
    { id: "dinner", label: "Dinner" },
    { id: "coffee", label: "Coffee" },
    { id: "hike_walk", label: "Hike/Walk" },
	  { id: "fishing", label: "Fishing" },
    { id: "board_games", label: "Board Games" },
    { id: "picnic", label: "Picnic" },
    { id: "movie", label: "Movie" },
]

// Mock church members for search - in a real app, this would come from your API
const mockChurchMembers = [
    {
        id: "user1",
        name: "John Smith",
        email: "john@example.com",
        image: "/placeholder.svg?height=40&width=40",
        initials: "JS",
    },
    {
        id: "user2",
        name: "Sarah Smith",
        email: "sarah@example.com",
        image: "/placeholder.svg?height=40&width=40",
        initials: "SS",
    },
    {
        id: "user3",
        name: "Michael Johnson",
        email: "michael@example.com",
        image: "/placeholder.svg?height=40&width=40",
        initials: "MJ",
    },
    {
        id: "user4",
        name: "Emily Davis",
        email: "emily@example.com",
        image: "/placeholder.svg?height=40&width=40",
        initials: "ED",
    },
    {
        id: "user5",
        name: "David Wilson",
        email: "david@example.com",
        image: "/placeholder.svg?height=40&width=40",
        initials: "DW",
    },
]

// Mock profile data - in a real app, this would come from your API
const mockProfiles = {
    "1": {
        id: "1",
        name: "Family Time",
        type: "family",
        description: "Activities for our whole family",
        activities: ["family_picnic", "game_night"],
        gender: "male",
        canHost: true,
        dietaryRestrictions: "No nuts",
        additionalNotes: "We have a large backyard for outdoor activities",
        children: [
            { name: "Emma", age: "8" },
            { name: "Noah", age: "6" },
        ],
        isPaused: false,
        members: [
            {
                id: "user1",
                name: "John Smith",
                email: "john@example.com",
                image: "/placeholder.svg?height=40&width=40",
                initials: "JS",
            },
        ],
    },
    "2": {
        id: "2",
        name: "Men's Fellowship",
        type: "single",
        description: "Connect with other men from church",
        activities: ["bible_study", "coffee"],
        gender: "male",
        canHost: false,
        dietaryRestrictions: "",
        additionalNotes: "Interested in deep theological discussions",
        children: [],
        isPaused: true,
        members: [
            {
                id: "user1",
                name: "John Smith",
                email: "john@example.com",
                image: "/placeholder.svg?height=40&width=40",
                initials: "JS",
            },
        ],
    },
    "3": {
        id: "3",
        name: "Date Night",
        type: "couple",
        description: "Activities for me and my spouse",
        activities: ["dinner", "movie_night"],
        gender: "male",
        canHost: true,
        dietaryRestrictions: "Vegetarian",
        additionalNotes: "Looking for other couples to build friendships with",
        children: [],
        isPaused: false,
        members: [
            {
                id: "user1",
                name: "John Smith",
                email: "john@example.com",
                image: "/placeholder.svg?height=40&width=40",
                initials: "JS",
            },
            {
                id: "user2",
                name: "Sarah Smith",
                email: "sarah@example.com",
                image: "/placeholder.svg?height=40&width=40",
                initials: "SS",
            },
        ],
    },
}

export const MixerProfileSchema = z.object({
    profileName: z.string().min(3, 'Profile name is required.').max(100),
    description: z.string().min(1, 'Description is required.').max(200),
    householdType: z.enum(['single', 'couple', 'family']),
    gender: z.enum(['male', 'female']),
    activities: z.array(z.string()).min(1, 'At least one activity is required.'),
    availableDates: z.array(z.date()).optional(),
    canHost: z.boolean().default(false),
    dietaryRestrictions: z.string().optional(),
    additionalNotes: z.string().optional(),
})

export async function loader({ request }: Route.LoaderArgs) {
    await requireUserId(request)
    
    // In a real app, you would load the profile data if editing
    // and fetch church members from the database
    return data({ 
        activityTypes,
        churchMembers: mockChurchMembers,
        // You would fetch the actual profile if editing
    })
}

export async function action({ request }: Route.ActionArgs) {
    const userId = await requireUserId(request)
    const formData = await request.formData()
    
    // Parse the children data from formData
    const childrenData: Array<{ name: string; age: string }> = []
    const childrenCount = parseInt(formData.get('childrenCount') as string) || 0
    
    for (let i = 0; i < childrenCount; i++) {
        const name = formData.get(`child-name-${i}`) as string
        const age = formData.get(`child-age-${i}`) as string
        if (name && age) {
            childrenData.push({ name, age })
        }
    }
    
    // Parse the members data from formData
    const membersData: Array<{ id: string }> = []
    const membersCount = parseInt(formData.get('membersCount') as string) || 0
    
    for (let i = 0; i < membersCount; i++) {
        const id = formData.get(`member-id-${i}`) as string
        if (id) {
            membersData.push({ id })
        }
    }
    
    // Parse activities as an array
    const activitiesString = formData.get('activities') as string
    const activities = activitiesString ? activitiesString.split(',') : []
    formData.delete('activities')
    
    // Add activities back as an array for Zod validation
    activities.forEach(activity => {
        formData.append('activities', activity)
    })
    
    const submission = parseWithZod(formData, {
        schema: MixerProfileSchema,
    })

    if (submission.status !== 'success') {
        return data(
            { result: submission.reply() },
            { status: submission.status === 'error' ? 400 : 200 },
        )
    }

    const { 
        profileName, 
        description, 
        householdType, 
        gender, 
        activities: validatedActivities, 
        availableDates,
        canHost, 
        dietaryRestrictions, 
        additionalNotes 
    } = submission.value

    // Here you would create the mixer profile in your database
    // Example:
    // await prisma.mixerProfile.create({
    //   data: {
    //     name: profileName,
    //     description,
    //     householdType,
    //     gender,
    //     activities: validatedActivities,
    //     availableDates,
    //     canHost,
    //     dietaryRestrictions,
    //     additionalNotes,
    //     userId,
    //     children: householdType === 'family' ? {
    //       createMany: {
    //         data: childrenData
    //       }
    //     } : undefined,
    //     members: {
    //       createMany: {
    //         data: membersData
    //       }
    //     }
    //   },
    // })

    return redirect('../mixer')
}

export default function JoinMixerPage({
    loaderData,
    actionData,
}: Route.ComponentProps) {
    const { activityTypes, churchMembers } = loaderData
    const [searchParams] = useSearchParams()
    const profileId = searchParams.get("profile")
    const isUpdate = Boolean(profileId)
    
    // Get the profile data if editing
    const profile = isUpdate && profileId ? 
        (mockProfiles as any)[profileId] : null

    return (
        <div className="container mx-auto py-6 space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isUpdate ? `Update Profile` : "Create New Profile"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isUpdate
                            ? "Update your preferences for this profile"
                            : "Set your preferences to be matched with other church members for social activities."}
                    </p>
                </div>
            </div>

            <MixerProfileForm
                activityTypes={activityTypes}
                churchMembers={churchMembers}
                actionData={actionData}
                isUpdate={isUpdate}
                profile={profile}
            />
        </div>
    )
}

function MixerProfileForm({ 
    activityTypes, 
    churchMembers,
    actionData, 
    isUpdate,
    profile
}: { 
    activityTypes: Array<{id: string, label: string}>,
    churchMembers: Array<{id: string, name: string, email: string, image: string, initials: string}>,
    actionData: any, 
    isUpdate: boolean,
    profile: any
}) {
    // State for managing UI elements
    const [selectedActivities, setSelectedActivities] = useState<string[]>(
        profile?.activities || []
    )
    const [openActivitySelect, setOpenActivitySelect] = useState(false)
    const [children, setChildren] = useState<Array<{ name: string; age: string }>>(
        profile?.children || []
    )
    const [members, setMembers] = useState<Array<typeof churchMembers[0]>>(
        profile?.members || [churchMembers[0]]
    )
    const [searchDialogOpen, setSearchDialogOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isPaused, setIsPaused] = useState(profile?.isPaused || false)
    
    const defaultValues = useMemo(
        () => ({
            profileName: profile?.name || '',
            description: profile?.description || '',
            householdType: profile?.type || 'single',
            gender: profile?.gender || 'male',
            activities: profile?.activities || [],
            availableDates: profile?.availableDates || [],
            canHost: profile?.canHost || false,
            dietaryRestrictions: profile?.dietaryRestrictions || '',
            additionalNotes: profile?.additionalNotes || '',
        }),
        [profile],
    )

    const [form, fields] = useForm({
        id: 'mixer-profile-form',
        constraint: getZodConstraint(MixerProfileSchema),
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: MixerProfileSchema })
        },
        lastResult: actionData?.result,
        defaultValue: defaultValues,
        shouldRevalidate: 'onBlur',
    })

    // Watch for household type changes
    useEffect(() => {
        const householdType = form.value?.householdType
        if (householdType !== 'family') {
            setChildren([])
        } else if (children.length === 0) {
            // Add one empty child by default when switching to family
            setChildren([{ name: "", age: "" }])
        }
    }, [form.value?.householdType, children.length])

    // Filter church members based on search query and exclude already added members
    const filteredMembers = churchMembers.filter(
        (member) =>
            !members.some((m) => m.id === member.id) &&
            (member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase())),
    )

    // Add a member to the profile
    const addMember = (member: typeof churchMembers[0]) => {
        setMembers([...members, member])
        setSearchDialogOpen(false)
        setSearchQuery("")
    }

    // Remove a member from the profile
    const removeMember = (memberId: string) => {
        // Don't allow removing the last member
        if (members.length <= 1) return
        setMembers(members.filter((m) => m.id !== memberId))
    }

    return (
        <Form method="post" {...getFormProps(form)}>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field
                        labelProps={{ children: 'Profile Name' }}
                        inputProps={{
                            ...getInputProps(fields.profileName, { type: 'text' }),
                            placeholder: 'e.g., Family Activities, Men\'s Group, etc.',
                        }}
                        errors={fields.profileName.errors}
                    />

                    <TextareaField
                        labelProps={{ htmlFor: 'description', children: 'Description' }}
                        textareaProps={{
                            ...getInputProps(fields.description, { type: 'text' }),
                            placeholder: 'Describe your mixer profile',
                            maxLength: 200,
                        }}
                        errors={fields.description.errors}
                        className="relative"
                     >
                        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
                            {fields.description.value?.length ?? 0} / 200
                        </div>
                    </TextareaField>

                    <HouseholdTypeSelector fields={fields} />

                    {form.value?.householdType !== 'single' && (
                        <ProfileMembersSection
                            members={members}
                            addMember={addMember}
                            removeMember={removeMember}
                            searchDialogOpen={searchDialogOpen}
                            setSearchDialogOpen={setSearchDialogOpen}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            filteredMembers={filteredMembers}
                            householdType={form.value?.householdType}
                        />
                    )}

                    <GenderSelector fields={fields} />

                    <ActivitySelector
                        fields={fields}
                        activityTypes={activityTypes}
                        selectedActivities={selectedActivities}
                        setSelectedActivities={setSelectedActivities}
                        openActivitySelect={openActivitySelect}
                        setOpenActivitySelect={setOpenActivitySelect}
                    />
                </CardContent>
            </Card>

            {form.value?.householdType === 'family' && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Children</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChildrenSection
                            children={children}
                            setChildren={setChildren}
                        />
                    </CardContent>
                </Card>
            )}

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent>
                    <AvailabilityCalendar fields={fields} />
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <HostingPreference fields={fields} />

                    <TextareaField
                        labelProps={{ htmlFor: 'dietaryRestrictions', children: 'Dietary Restrictions' }}
                        textareaProps={{
                            ...getInputProps(fields.dietaryRestrictions, { type: 'text' }),
                            placeholder: 'Any dietary restrictions or preferences?',
                        }}
                        errors={fields.dietaryRestrictions.errors}
                    />

                    <TextareaField
                        labelProps={{ htmlFor: 'additionalNotes', children: 'Additional Notes' }}
                        textareaProps={{
                            ...getInputProps(fields.additionalNotes, { type: 'text' }),
                            placeholder: 'Any other information you want to share',
                        }}
                        errors={fields.additionalNotes.errors}
                    />
                </CardContent>
            </Card>

            {/* Hidden fields to pass array data */}
            <input
                type="hidden"
                name="activities"
                value={selectedActivities.join(',')}
            />

            <input
                type="hidden"
                name="childrenCount"
                value={children.length.toString()}
            />

            {children.map((child, index) => (
                <div key={index}>
                    <input
                        type="hidden"
                        name={`child-name-${index}`}
                        value={child.name}
                    />
                    <input
                        type="hidden"
                        name={`child-age-${index}`}
                        value={child.age}
                    />
                </div>
            ))}

            <input
                type="hidden"
                name="membersCount"
                value={members.length.toString()}
            />

            {members.map((member, index) => (
                <input
                    key={index}
                    type="hidden"
                    name={`member-id-${index}`}
                    value={member.id}
                />
            ))}

            <div className="flex justify-end gap-4">
                <Link to="../profiles" prefetch="intent" >
                    <Button variant="outline">Cancel</Button>
                </Link>

                <Button
                    type="submit"
                    disabled={!fields.profileName.value || !fields.description.value}
                >
                    {isUpdate ? 'Update Profile' : 'Create Profile'}
                </Button>
            </div>
        </Form>
    )
}

function HouseholdTypeSelector({ fields }: { fields: ReturnType<typeof useForm>[1] }) {
    return (
        <div className="space-y-2">
            <Label htmlFor="householdType">Household Type</Label>
            <RadioGroup
                {...getInputProps(fields.householdType, { type: 'text' })}
                className="flex flex-col space-y-1"
            >
                <div className="flex items-center space-x-3">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single" className="font-normal">Single</Label>
                </div>
                <div className="flex items-center space-x-3">
                    <RadioGroupItem value="couple" id="couple" />
                    <Label htmlFor="couple" className="font-normal">Couple</Label>
                </div>
                <div className="flex items-center space-x-3">
                    <RadioGroupItem value="family" id="family" />
                    <Label htmlFor="family" className="font-normal">Family</Label>
                </div>
            </RadioGroup>
        </div>
    )
}

function ProfileMembersSection({ 
    members, 
    addMember, 
    removeMember,
    searchDialogOpen,
    setSearchDialogOpen,
    searchQuery,
    setSearchQuery,
    filteredMembers,
    householdType
}: { 
    members: Array<{id: string, name: string, email: string, image: string, initials: string}>,
    addMember: (member: {id: string, name: string, email: string, image: string, initials: string}) => void,
    removeMember: (id: string) => void,
    searchDialogOpen: boolean,
    setSearchDialogOpen: (open: boolean) => void,
    searchQuery: string,
    setSearchQuery: (query: string) => void,
    filteredMembers: Array<{id: string, name: string, email: string, image: string, initials: string}>,
    householdType?: string
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-base">Profile Members</Label>
                <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Profile Member</DialogTitle>
                            <DialogDescription>Search for church members to add to this profile.</DialogDescription>
                        </DialogHeader>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email"
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="mt-2 max-h-[300px] overflow-y-auto">
                            {filteredMembers.length === 0 ? (
                                <p className="text-center py-4 text-sm text-muted-foreground">
                                    {searchQuery ? "No members found" : "No more members available"}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {filteredMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.image} alt={member.name} />
                                                    <AvatarFallback>{member.initials}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={() => addMember(member)}>
                                                Add
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSearchDialogOpen(false)}>
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <p className="text-sm text-muted-foreground">
                {householdType === "couple"
                    ? "Add your spouse or partner to this profile."
                    : "Add family members to this profile."}
            </p>
            <div className="space-y-2 mt-2">
                {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-md border">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member.image} alt={member.name} />
                                <AvatarFallback>{member.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeMember(member.id)}
                            disabled={members.length <= 1}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove {member.name}</span>
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function GenderSelector({ fields }: { fields: ReturnType<typeof useForm>[1] }) {
    return (
        <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <RadioGroup
                {...getInputProps(fields.gender, { type: 'text' })}
                className="flex space-x-4"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="font-normal">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="font-normal">Female</Label>
                </div>
            </RadioGroup>
        </div>
    )
}

function ActivitySelector({ 
    fields, 
    activityTypes,
    selectedActivities,
    setSelectedActivities,
    openActivitySelect,
    setOpenActivitySelect
}: { 
    fields: ReturnType<typeof useForm>[1], 
    activityTypes: Array<{id: string, label: string}>,
    selectedActivities: string[],
    setSelectedActivities: React.Dispatch<React.SetStateAction<string[]>>,
    openActivitySelect: boolean,
    setOpenActivitySelect: React.Dispatch<React.SetStateAction<boolean>>
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor="activities">Activity Types</Label>
            <Popover open={openActivitySelect} onOpenChange={setOpenActivitySelect}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openActivitySelect}
                        className="w-full justify-between"
                    >
                        {selectedActivities.length > 0
                            ? `${selectedActivities.length} selected`
                            : "Select activities"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandInput placeholder="Search activities..." />
                        <CommandList>
                            <CommandEmpty>No activity found.</CommandEmpty>
                            <CommandGroup>
                                {activityTypes.map((activity) => (
                                    <CommandItem
                                        key={activity.id}
                                        value={activity.label}
                                        onSelect={() => {
                                            const newSelected = selectedActivities.includes(activity.id)
                                                ? selectedActivities.filter((id) => id !== activity.id)
                                                : [...selectedActivities, activity.id]

                                            setSelectedActivities(newSelected)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedActivities.includes(activity.id) ? "opacity-100" : "opacity-0",
                                            )}
                                        />
                                        {activity.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground">
                Select the types of activities you're interested in.
            </p>
        </div>
    )
}

function ChildrenSection({ 
    children, 
    setChildren 
}: { 
    children: Array<{ name: string; age: string }>,
    setChildren: React.Dispatch<React.SetStateAction<Array<{ name: string; age: string }>>>
}) {
    return (
        <div>
            <p className="text-sm text-muted-foreground mb-4">Please provide information about your children.</p>
            <div className="space-y-4">
                {children.map((child, index) => (
                    <div key={index} className="flex items-end gap-3">
                        <div className="flex-1">
                            <Label htmlFor={`child-name-${index}`} className="text-sm">
                                Name
                            </Label>
                            <Input
                                id={`child-name-${index}`}
                                value={child.name}
                                onChange={(e) => {
                                    const newChildren = [...children]
                                    newChildren[index].name = e.target.value
                                    setChildren(newChildren)
                                }}
                                className="mt-1"
                            />
                        </div>
                        <div className="w-20">
                            <Label htmlFor={`child-age-${index}`} className="text-sm">
                                Age
                            </Label>
                            <Input
                                id={`child-age-${index}`}
                                value={child.age}
                                onChange={(e) => {
                                    const newChildren = [...children]
                                    newChildren[index].age = e.target.value
                                    setChildren(newChildren)
                                }}
                                className="mt-1"
                            />
                        </div>
                        {children.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setChildren(children.filter((_, i) => i !== index))
                                }}
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove child</span>
                            </Button>
                        )}
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                        setChildren([...children, { name: "", age: "" }])
                    }}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Child
                </Button>
            </div>
        </div>
    )
}

function HostingPreference({ fields }: { fields: ReturnType<typeof useForm>[1] }) {
    return (
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
                <Label htmlFor="canHost" className="text-base">Willing to Host</Label>
                <p className="text-sm text-muted-foreground">Are you willing to host activities at your home?</p>
            </div>
            <Switch 
                {...getInputProps(fields.canHost, { type: 'checkbox' })}
                id="canHost" 
            />
        </div>
    )
}

function AvailabilityCalendar({ fields }: { fields: ReturnType<typeof useForm>[1] }) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="availableDates">Select Available Dates</Label>
                <p className="text-sm text-muted-foreground mb-4">
                    Select the dates you're available for activities over the next two months.
                </p>
                <Calendar
                    mode="multiple"
                    {...getInputProps(fields.availableDates, { type: 'text' })}
                    className="rounded-md border"
                    numberOfMonths={2}
										fromDate={new Date()}
                />
            </div>
            <p className="text-sm text-muted-foreground">
                You can select multiple dates by clicking on them.
            </p>
        </div>
    )
}

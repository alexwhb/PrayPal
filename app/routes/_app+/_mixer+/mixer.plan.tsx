import { useState, useEffect } from "react"
import { Link } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from "#app/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "#app/components/ui/avatar"
import { Badge } from "#app/components/ui/badge"
import { Button } from "#app/components/ui/button"
import { Calendar as CalendarComponent } from "#app/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#app/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#app/components/ui/dialog"
import { Input } from "#app/components/ui/input"
import { Label } from "#app/components/ui/label"
import { RadioGroup, RadioGroupItem } from "#app/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#app/components/ui/select"
import { Separator } from "#app/components/ui/separator"
import { Textarea } from "#app/components/ui/textarea"
import { ConfettiCelebration } from '#app/routes/_app+/_mixer+/confetti-celebration.tsx'
import { Icon } from '#app/components/ui/icon.tsx'


// Mock data - in a real app, this would come from your API
const mockMatchData = {
	"1": {
		id: "1",
		status: "matched",
		profileId: "1", // Family Time
		profileName: "Family Time",
		profileType: "family",
		match: {
			id: "family-johnson",
			name: "The Johnson Family",
			type: "family",
			image: "/placeholder.svg?height=80&width=80",
			initials: "JF",
			members: [
				{ name: "Robert Johnson", role: "Father" },
				{ name: "Lisa Johnson", role: "Mother" },
				{ name: "Emily Johnson", role: "Daughter (10)" },
				{ name: "Jack Johnson", role: "Son (8)" },
			],
		},
		sharedInterests: ["Family Picnic", "Game Night", "Bible Study"],
		availableDates: [
			new Date(2025, 4, 15), // May 15, 2025
			new Date(2025, 4, 16),
			new Date(2025, 4, 17),
			new Date(2025, 4, 22),
			new Date(2025, 4, 23),
			new Date(2025, 4, 29),
			new Date(2025, 4, 30),
		],
		canHost: true,
		yourCanHost: true,
		locations: [
			{ id: "your-home", name: "Your Home", address: "Your address" },
			{ id: "their-home", name: "Johnson's Home", address: "123 Main St, Anytown, USA" },
			{ id: "church", name: "Church", address: "456 Church St, Anytown, USA" },
			{ id: "park", name: "Central Park", address: "789 Park Ave, Anytown, USA" },
			{ id: "cafe", name: "Grace Café", address: "321 Coffee Rd, Anytown, USA" },
		],
	},
	"2": {
		id: "2",
		status: "matched",
		profileId: "2", // Men's Fellowship
		profileName: "Men's Fellowship",
		profileType: "single",
		match: {
			id: "david-wilson",
			name: "David Wilson",
			type: "single",
			image: "/placeholder.svg?height=80&width=80",
			initials: "DW",
			members: [{ name: "David Wilson", role: "Individual" }],
		},
		sharedInterests: ["Bible Study", "Coffee"],
		availableDates: [
			new Date(2025, 4, 18), // May 18, 2025
			new Date(2025, 4, 19),
			new Date(2025, 4, 25),
			new Date(2025, 4, 26),
		],
		canHost: false,
		yourCanHost: false,
		locations: [
			{ id: "church", name: "Church", address: "456 Church St, Anytown, USA" },
			{ id: "cafe", name: "Grace Café", address: "321 Coffee Rd, Anytown, USA" },
		],
	},
}

const timeSlots = [
	"8:00 AM",
	"8:30 AM",
	"9:00 AM",
	"9:30 AM",
	"10:00 AM",
	"10:30 AM",
	"11:00 AM",
	"11:30 AM",
	"12:00 PM",
	"12:30 PM",
	"1:00 PM",
	"1:30 PM",
	"2:00 PM",
	"2:30 PM",
	"3:00 PM",
	"3:30 PM",
	"4:00 PM",
	"4:30 PM",
	"5:00 PM",
	"5:30 PM",
	"6:00 PM",
	"6:30 PM",
	"7:00 PM",
	"7:30 PM",
	"8:00 PM",
	"8:30 PM",
]

export default function PlanMatchPage() {

	const params = {id: 1}
	// const router = useRouter()
	const [matchData, setMatchData] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [currentStep, setCurrentStep] = useState(1)
	const [selectedActivity, setSelectedActivity] = useState("")
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
	const [selectedTime, setSelectedTime] = useState("")
	const [selectedLocation, setSelectedLocation] = useState("")
	const [customLocation, setCustomLocation] = useState("")
	const [notes, setNotes] = useState("")
	const [showConfirmDialog, setShowConfirmDialog] = useState(false)
	const [isConfettiActive, setIsConfettiActive] = useState(false)
	const [planProposed, setPlanProposed] = useState(false)

	useEffect(() => {
		// In a real app, you would fetch this data from your API
		const data = mockMatchData[params.id as keyof typeof mockMatchData]
		if (data) {
			setMatchData(data)

			// If there's only one shared interest, auto-select it
			if (data.sharedInterests.length === 1) {
				setSelectedActivity(data.sharedInterests[0])
			}
		}
		setLoading(false)
	}, [params.id])

	const handleNextStep = () => {
		if (currentStep < getTotalSteps()) {
			setCurrentStep(currentStep + 1)
		} else {
			setShowConfirmDialog(true)
		}
	}

	const handlePreviousStep = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1)
		}
	}

	const handleProposePlan = () => {
		setShowConfirmDialog(false)
		setIsConfettiActive(true)

		// In a real app, you would send this plan to your API
		setTimeout(() => {
			setIsConfettiActive(false)
			setPlanProposed(true)
		}, 2000)
	}

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		})
	}

	// Determine how many steps we need based on the data
	const getTotalSteps = () => {
		let steps = 0

		// Step 1: Activity selection (skip if only one shared interest)
		if (matchData?.sharedInterests.length !== 1) steps++

		// Step 2: Date selection
		steps++

		// Step 3: Time selection
		steps++

		// Step 4: Location selection
		steps++

		// Step 5: Notes
		steps++

		return steps
	}

	// Get the current step number considering skipped steps
	const getAdjustedStepNumber = () => {
		let adjustedStep = currentStep

		// If we have only one shared interest, we skip step 1
		if (matchData?.sharedInterests.length === 1 && currentStep >= 1) {
			adjustedStep++
		}

		return adjustedStep
	}

	// Render the current step content
	const renderStepContent = () => {
		const adjustedStep = getAdjustedStepNumber()

		switch (adjustedStep) {
			case 1: // Activity selection
				return (
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">Select an Activity</h2>
						<p className="text-muted-foreground">
							Choose an activity that you'd like to do with {matchData.match.name}.
						</p>

						<RadioGroup value={selectedActivity} onValueChange={setSelectedActivity}>
							<div className="space-y-2">
								{matchData.sharedInterests.map((activity: string) => (
									<div key={activity} className="flex items-center space-x-2">
										<RadioGroupItem value={activity} id={`activity-${activity}`} />
										<Label htmlFor={`activity-${activity}`}>{activity}</Label>
									</div>
								))}
							</div>
						</RadioGroup>
					</div>
				)

			case 2: // Date selection
				return (
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">Select a Date</h2>
						<p className="text-muted-foreground">
							Choose a date when both you and {matchData.match.name} are available.
						</p>

						<div className="border rounded-md p-4">
							<CalendarComponent
								mode="single"
								selected={selectedDate}
								onSelect={setSelectedDate}
								disabled={(date) => {
									// Disable dates that aren't in the availableDates array
									return !matchData.availableDates.some(
										(availableDate: Date) =>
											availableDate.getDate() === date.getDate() &&
											availableDate.getMonth() === date.getMonth() &&
											availableDate.getFullYear() === date.getFullYear(),
									)
								}}
								className="mx-auto"
							/>
						</div>

						<p className="text-sm text-muted-foreground">The calendar shows dates when both of you are available.</p>
					</div>
				)

			case 3: // Time selection
				return (
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">Select a Time</h2>
						<p className="text-muted-foreground">
							Choose a time for your {selectedActivity.toLowerCase()} on {selectedDate && formatDate(selectedDate)}.
						</p>

						<Select value={selectedTime} onValueChange={setSelectedTime}>
							<SelectTrigger>
								<SelectValue placeholder="Select a time" />
							</SelectTrigger>
							<SelectContent>
								{timeSlots.map((time) => (
									<SelectItem key={time} value={time}>
										{time}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)

			case 4: // Location selection
				return (
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">Select a Location</h2>
						<p className="text-muted-foreground">
							Choose where you'd like to meet for {selectedActivity.toLowerCase()}.
						</p>

						<RadioGroup value={selectedLocation} onValueChange={setSelectedLocation}>
							<div className="space-y-3">
								{matchData.locations.map((location: any) => (
									<div key={location.id} className="flex items-start space-x-2">
										<RadioGroupItem value={location.id} id={`location-${location.id}`} className="mt-1" />
										<div>
											<Label htmlFor={`location-${location.id}`} className="font-medium">
												{location.name}
											</Label>
											<p className="text-sm text-muted-foreground">{location.address}</p>
										</div>
									</div>
								))}
								<div className="flex items-start space-x-2">
									<RadioGroupItem value="custom" id="location-custom" className="mt-1" />
									<div className="space-y-2 w-full">
										<Label htmlFor="location-custom" className="font-medium">
											Other Location
										</Label>
										<Input
											placeholder="Enter location name and address"
											value={customLocation}
											onChange={(e) => setCustomLocation(e.target.value)}
											disabled={selectedLocation !== "custom"}
										/>
									</div>
								</div>
							</div>
						</RadioGroup>
					</div>
				)

			case 5: // Notes
				return (
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">Additional Notes</h2>
						<p className="text-muted-foreground">Add any additional information or notes for {matchData.match.name}.</p>

						<Textarea
							placeholder="E.g., Parking information, what to bring, dietary preferences, etc."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={5}
						/>
					</div>
				)

			default:
				return null
		}
	}

	// Check if the current step is complete and we can proceed
	const isStepComplete = () => {
		const adjustedStep = getAdjustedStepNumber()

		switch (adjustedStep) {
			case 1: // Activity selection
				return !!selectedActivity
			case 2: // Date selection
				return !!selectedDate
			case 3: // Time selection
				return !!selectedTime
			case 4: // Location selection
				return selectedLocation && (selectedLocation !== "custom" || customLocation.trim() !== "")
			case 5: // Notes
				return true // Notes are optional
			default:
				return false
		}
	}

	if (loading) {
		return <div className="container mx-auto py-6 text-center">Loading match data...</div>
	}

	if (!matchData) {
		return (
			<div className="container mx-auto py-6 text-center">
				<p className="text-muted-foreground">Match not found</p>
				<Link to="/mixer">
				<Button variant="outline" className="mt-4">
					Back to Mixer
				</Button>
				</Link>
			</div>
		)
	}

	if (planProposed) {
		return (
			<div className="container mx-auto py-6 space-y-6 max-w-3xl">
				<div className="flex items-center gap-2">
					<Link to="/mixer">
					<Button variant="ghost" size="icon">
						<Icon name="arrow-left" className="h-5 w-5" />
						<span className="sr-only">Back</span>
					</Button>
					</Link>
					<h1 className="text-2xl font-bold tracking-tight">Plan Proposed</h1>
				</div>

				<Alert className="bg-primary/10 border-primary">
					<Icon name="check" className="h-4 w-4 text-primary" />
					<AlertTitle>Plan Successfully Proposed!</AlertTitle>
					<AlertDescription>
						Your plan has been sent to {matchData.match.name}. You'll be notified when they respond.
					</AlertDescription>
				</Alert>

				<Card>
					<CardHeader>
						<CardTitle>Plan Details</CardTitle>
						<CardDescription>Here's what you've proposed to {matchData.match.name}.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Icon name="check" className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium">Activity</h3>
							</div>
							<p className="pl-6">{selectedActivity}</p>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Icon name="calendar" className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium">Date & Time</h3>
							</div>
							<p className="pl-6">
								{selectedDate && formatDate(selectedDate)} at {selectedTime}
							</p>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Icon name="map-pin" className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium">Location</h3>
							</div>
							<p className="pl-6">
								{selectedLocation === "custom"
									? customLocation
									: matchData.locations.find((loc: any) => loc.id === selectedLocation)?.name}
							</p>
							<p className="pl-6 text-sm text-muted-foreground">
								{selectedLocation === "custom"
									? ""
									: matchData.locations.find((loc: any) => loc.id === selectedLocation)?.address}
							</p>
						</div>

						{notes && (
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Icon name="calendar" className="h-4 w-4 text-muted-foreground" />
									<h3 className="font-medium">Additional Notes</h3>
								</div>
								<p className="pl-6">{notes}</p>
							</div>
						)}

						<div className="pt-2">
							<Badge>Awaiting Response</Badge>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between border-t p-4">
						{/*TODO */}
						<Button variant="outline" >
							Send Message
						</Button>
						{/*TODO*/}
						<Button>View Pending Plans</Button>
					</CardFooter>
				</Card>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-6 space-y-6 max-w-3xl">
			{isConfettiActive && <ConfettiCelebration />}

			<div className="flex items-center gap-2">
				<Link to="/mixer">
				<Button variant="ghost" size="icon" >
					<Icon name="arrow-left" className="h-5 w-5" />
					<span className="sr-only">Back</span>
				</Button>
				</Link>
				<h1 className="text-2xl font-bold tracking-tight">Propose a Meetup</h1>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				<div className="md:col-span-1">
					<Card>
						<CardHeader className="text-center">
							<div className="mx-auto mb-2">
								<Avatar className="h-20 w-20">
									<AvatarImage src={matchData.match.image || "/placeholder.svg"} alt={matchData.match.name} />
									<AvatarFallback className="text-xl">{matchData.match.initials}</AvatarFallback>
								</Avatar>
							</div>
							<CardTitle>{matchData.match.name}</CardTitle>
							<CardDescription>
								{matchData.match.type === "single"
									? "Individual"
									: matchData.match.type === "couple"
										? "Couple"
										: "Family"}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h3 className="text-sm font-medium mb-2">Shared Interests</h3>
								<div className="flex flex-wrap gap-1">
									{matchData.sharedInterests.map((interest: string, index: number) => (
										<Badge key={index} variant="outline">
											{interest}
										</Badge>
									))}
								</div>
							</div>

							<Separator />

							<div>
								<h3 className="text-sm font-medium mb-2">Your Profile</h3>
								<div className="flex items-center gap-2">
									<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
										{matchData.profileType === "single" ? (
											<Icon name="user" className="h-4 w-4 text-primary" />
										) : (
											<Icon name="users" className="h-4 w-4 text-primary" />
										)}
									</div>
									<div>
										<p className="text-sm font-medium">{matchData.profileName}</p>
										<p className="text-xs text-muted-foreground">
											{matchData.profileType === "single"
												? "Individual"
												: matchData.profileType === "couple"
													? "Couple"
													: "Family"}
										</p>
									</div>
								</div>
							</div>

							<Separator />

							<div className="space-y-2">
								<h3 className="text-sm font-medium">Planning Progress</h3>
								<div className="space-y-1">
									<div className="flex items-center justify-between text-sm">
                    <span className={selectedActivity ? "text-primary font-medium" : "text-muted-foreground"}>
                      Activity
                    </span>
										{selectedActivity && <Icon name="check" className="h-4 w-4 text-primary" />}
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className={selectedDate ? "text-primary font-medium" : "text-muted-foreground"}>Date</span>
										{selectedDate && <Icon name="check" className="h-4 w-4 text-primary" />}
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className={selectedTime ? "text-primary font-medium" : "text-muted-foreground"}>Time</span>
										{selectedTime && <Icon name="check" className="h-4 w-4 text-primary" />}
									</div>
									<div className="flex items-center justify-between text-sm">
                    <span className={selectedLocation ? "text-primary font-medium" : "text-muted-foreground"}>
                      Location
                    </span>
										{selectedLocation && <Icon name="check" className="h-4 w-4 text-primary" />}
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className={notes ? "text-primary font-medium" : "text-muted-foreground"}>Notes</span>
										{notes && <Icon name="check" className="h-4 w-4 text-primary" />}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="md:col-span-2">
					<Card>
						<CardContent className="pt-6">{renderStepContent()}</CardContent>
						<CardFooter className="flex justify-between border-t p-4 mt-4">
							<Button variant="outline" onClick={handlePreviousStep} disabled={currentStep === 1}>
								<Icon name="arrow-left" className="mr-2 h-4 w-4" />
								Back
							</Button>
							<Button onClick={handleNextStep} disabled={!isStepComplete()}>
								{currentStep < getTotalSteps() ? (
									<>
										Next
										<Icon name="arrow-right" className="ml-2 h-4 w-4" />
									</>
								) : (
									"Review & Propose"
								)}
							</Button>
						</CardFooter>
					</Card>
				</div>
			</div>

			<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Propose This Meetup</DialogTitle>
						<DialogDescription>
							Review the details of your plan before proposing it to {matchData.match.name}. They'll need to accept it
							to confirm the meetup.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Icon name="calendar" className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium">Activity</h3>
							</div>
							<p className="pl-6">{selectedActivity}</p>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Icon name="calendar" className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium">Date & Time</h3>
							</div>
							<p className="pl-6">
								{selectedDate && formatDate(selectedDate)} at {selectedTime}
							</p>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Icon name="map-pin" className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium">Location</h3>
							</div>
							<p className="pl-6">
								{selectedLocation === "custom"
									? customLocation
									: matchData.locations.find((loc: any) => loc.id === selectedLocation)?.name}
							</p>
							<p className="pl-6 text-sm text-muted-foreground">
								{selectedLocation === "custom"
									? ""
									: matchData.locations.find((loc: any) => loc.id === selectedLocation)?.address}
							</p>
						</div>

						{notes && (
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Icon name="calendar" className="h-4 w-4 text-muted-foreground" />
									<h3 className="font-medium">Additional Notes</h3>
								</div>
								<p className="pl-6">{notes}</p>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
							Edit Details
						</Button>
						<Button onClick={handleProposePlan}>Propose Plan</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

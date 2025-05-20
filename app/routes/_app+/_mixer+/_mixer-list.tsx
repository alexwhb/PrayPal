import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "#app/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "#app/components/ui/avatar"
import { Badge } from "#app/components/ui/badge"
import { Button } from "#app/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#app/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#app/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "#app/components/ui/dropdown-menu"
import {Icon} from '#app/components/ui/icon.tsx'
import { Input } from "#app/components/ui/input"
import { Label } from "#app/components/ui/label"
import { RadioGroup, RadioGroupItem } from "#app/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#app/components/ui/select"
import { Textarea } from "#app/components/ui/textarea"
import { ConfettiCelebration } from "./confetti-celebration"


const mockMatches = [
	{
		id: "1",
		status: "matched", // new match, no plan yet
		profileId: "1", // Family Time
		profileName: "Family Time",
		profileType: "family",
		match: {
			name: "The Johnson Family",
			type: "family",
			image: "/placeholder.svg?height=40&width=40",
			initials: "JF",
		},
		sharedInterests: ["Family Picnic", "Game Night", "Bible Study"],
	},
	{
		id: "2",
		status: "pending_yours", // you proposed a plan, waiting for their response
		profileId: "2", // Men's Fellowship
		profileName: "Men's Fellowship",
		profileType: "single",
		match: {
			name: "David Wilson",
			type: "single",
			image: "/placeholder.svg?height=40&width=40",
			initials: "DW",
		},
		sharedInterests: ["Bible Study", "Coffee"],
		plan: {
			activity: "Coffee",
			date: "May 18, 2025",
			time: "10:30 AM",
			location: "Grace Café",
			proposedBy: "you",
			proposedAt: new Date(2025, 4, 15, 14, 30),
		},
	},
	{
		id: "3",
		status: "pending_theirs", // they proposed a plan, waiting for your response
		profileId: "3", // Date Night
		profileName: "Date Night",
		profileType: "couple",
		match: {
			name: "Sarah & Michael",
			type: "couple",
			image: "/placeholder.svg?height=40&width=40",
			initials: "SM",
		},
		sharedInterests: ["Dinner", "Movie Night"],
		plan: {
			activity: "Dinner",
			date: "May 22, 2025",
			time: "7:00 PM",
			location: "Italian Restaurant",
			proposedBy: "them",
			proposedAt: new Date(2025, 4, 16, 9, 15),
		},
	},
	{
		id: "4",
		status: "counter_proposed", // you counter-proposed a plan
		profileId: "1", // Family Time
		profileName: "Family Time",
		profileType: "family",
		match: {
			name: "The Williams Family",
			type: "family",
			image: "/placeholder.svg?height=40&width=40",
			initials: "WF",
		},
		sharedInterests: ["Family Picnic", "Game Night"],
		plan: {
			activity: "Game Night",
			date: "May 20, 2025",
			time: "6:00 PM",
			location: "Community Center",
			proposedBy: "them",
			proposedAt: new Date(2025, 4, 14, 10, 15),
			counterProposal: {
				activity: "Game Night",
				date: "May 20, 2025",
				time: "7:00 PM", // Changed time
				location: "Your Home", // Changed location
				reason: "Our kids have soccer practice until 6:30. Would 7:00 PM at our house work better?",
				proposedAt: new Date(2025, 4, 15, 8, 30),
			},
		},
	},
	{
		id: "5",
		status: "confirmed", // plan has been confirmed by both parties
		profileId: "1", // Family Time
		profileName: "Family Time",
		profileType: "family",
		match: {
			name: "The Anderson Family",
			type: "family",
			image: "/placeholder.svg?height=40&width=40",
			initials: "AF",
		},
		sharedInterests: ["Family Picnic", "Game Night"],
		plan: {
			activity: "Family Picnic",
			date: "May 25, 2025",
			time: "12:00 PM",
			location: "Central Park",
			confirmedAt: new Date(2025, 4, 17, 16, 45),
		},
	},
	{
		id: "6",
		status: "past", // meetup has already happened
		profileId: "2", // Men's Fellowship
		profileName: "Men's Fellowship",
		profileType: "single",
		match: {
			name: "James Thompson",
			type: "single",
			image: "/placeholder.svg?height=40&width=40",
			initials: "JT",
		},
		sharedInterests: ["Bible Study", "Coffee"],
		plan: {
			activity: "Bible Study",
			date: "April 28, 2025",
			time: "7:00 PM",
			location: "Church Meeting Room",
			confirmedAt: new Date(2025, 3, 20, 11, 30),
		},
	},
]


// Define types for the match data
type MatchType = "single" | "couple" | "family"

type MatchProfile = {
	name: string
	type: MatchType
	image: string
	initials: string
}

type Plan = {
	activity: string
	date: string
	time: string
	location: string
	proposedBy?: "you" | "them"
	proposedAt?: Date
	confirmedAt?: Date
	counterProposal?: {
		activity: string
		date: string
		time: string
		location: string
		reason: string
		proposedAt: Date
	}
}

type MatchStatus = "matched" | "pending_yours" | "pending_theirs" | "counter_proposed" | "confirmed" | "past"

type Match = {
	id: string
	status: MatchStatus
	profileId: string
	profileName: string
	profileType: MatchType
	match: MatchProfile
	sharedInterests: string[]
	plan?: Plan
}

// Define props for each card component
interface ProfileInfoProps {
	match: Match
}

interface PlanDetailsProps {
	plan: Plan | undefined
}

interface NewMatchCardProps {
	match: Match
	startMessaging: (id: string) => void
	startPlanning: (id: string) => void
}

interface CounterProposedCardProps {
	match: Match
	startMessaging: (id: string) => void
	openDeclineDialog: (id: string) => void
}

interface PendingYoursCardProps {
	match: Match
	startMessaging: (id: string) => void
	openDeclineDialog: (id: string) => void
}

interface PendingTheirsCardProps {
	match: Match
	startMessaging: (id: string) => void
	viewPlanDetails: (id: string) => void
}

interface ConfirmedCardProps {
	match: Match
	startMessaging: (id: string) => void
	viewMatchDetails: (id: string) => void
	isAccepted: boolean
}

interface PastCardProps {
	match: Match
	startMessaging: (id: string) => void
	viewMatchDetails: (id: string) => void
}

// Match card components based on status
function NewMatchCard({ match, startMessaging, startPlanning }: NewMatchCardProps) {
	return (
		<Card key={match.id} className="overflow-hidden">
			<CardHeader className="pb-3">
				<div className="flex justify-between items-start">
					<Badge variant="outline">New Match</Badge>
					{match.plan?.activity && <Badge variant="outline">{match.plan.activity}</Badge>}
				</div>
				{/* Profile and match info */}
				<ProfileInfo match={match} />
			</CardHeader>
			<CardContent className="pb-2">
				<div className="space-y-1">
					<p className="text-sm text-muted-foreground">You've been matched based on shared interests:</p>
					<div className="flex flex-wrap gap-1">
						{match.sharedInterests.map((interest, index) => (
							<Badge key={index} variant="outline" className="text-xs">
								{interest}
							</Badge>
						))}
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between pt-2">
				<Button variant="outline" size="sm" onClick={() => startMessaging(match.id)}>
					<Icon name="message-square" className="h-4 w-4 mr-1" />
					Message
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm">
							<Icon name="thumbs-up" className="h-4 w-4 mr-1" />
							Plan Meetup
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => startPlanning(match.id)}>Use Planning Wizard</DropdownMenuItem>
						<DropdownMenuItem onClick={() => startMessaging(match.id)}>Plan via Message</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardFooter>
		</Card>
	)
}

function CounterProposedCard({ match, startMessaging, openDeclineDialog }: CounterProposedCardProps) {
	return (
		<Card key={match.id} className="overflow-hidden border-amber-500 bg-amber-50/50 dark:bg-amber-900/30 dark:border-amber-900">
			<CardHeader className="pb-3">
				<div className="flex justify-between items-start">
					<Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-100">
						Counter-Proposed
					</Badge>
					{match.plan?.activity && <Badge variant="outline">{match.plan.activity}</Badge>}
				</div>
				{/* Profile and match info */}
				<ProfileInfo match={match} />
			</CardHeader>
			<CardContent className="pb-2">
				<PlanDetails plan={match.plan} />
				<div className="flex items-center gap-2 text-xs text-amber-600 mt-1">
					<Icon name="edit" className="h-3 w-3" />
					<span>You suggested changes</span>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between pt-2">
				<Button className="dark:border-amber-900  dark:bg-amber-900 dark:hover:bg-amber-800 dark:text-white" variant="outline" size="sm" onClick={() => startMessaging(match.id)}>
					<Icon name="message-square" className="h-4 w-4 mr-1" />
					Message
				</Button>
				<Button variant="outline" className="dark:border-amber-900  dark:bg-amber-900 dark:hover:bg-amber-800 dark:text-white" size="sm" onClick={() => openDeclineDialog(match.id)}>
					<Icon name="x" className="h-4 w-4 mr-1" />
					Cancel Plan
				</Button>
			</CardFooter>
		</Card>
	)
}

function PendingYoursCard({ match, startMessaging, openDeclineDialog }: PendingYoursCardProps) {
	return (
		<Card key={match.id} className="overflow-hidden">
			<CardHeader className="pb-3">
				<div className="flex justify-between items-start">
					<Badge variant="secondary">Awaiting Response</Badge>
					{match.plan?.activity && <Badge variant="outline">{match.plan.activity}</Badge>}
				</div>
				{/* Profile and match info */}
				<ProfileInfo match={match} />
			</CardHeader>
			<CardContent className="pb-2">
				<PlanDetails plan={match.plan} />
				<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
					<Icon name="clock" className="h-3 w-3" />
					<span>Waiting for {match.match.name} to respond</span>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between pt-2">
				<Button variant="outline" size="sm" onClick={() => startMessaging(match.id)}>
					<Icon name="message-square" className="h-4 w-4 mr-1" />
					Message
				</Button>
				<Button variant="outline" size="sm" onClick={() => openDeclineDialog(match.id)}>
					<Icon name="x" className="h-4 w-4 mr-1" />
					Cancel Plan
				</Button>
			</CardFooter>
		</Card>
	)
}

function PendingTheirsCard({ match, startMessaging, viewPlanDetails }: PendingTheirsCardProps) {
	return (
		<Card key={match.id} className="overflow-hidden">
			<CardHeader className="pb-3">
				<div className="flex justify-between items-start">
					<Badge variant="secondary">Plan Proposed</Badge>
					{match.plan?.activity && <Badge variant="outline">{match.plan.activity}</Badge>}
				</div>
				{/* Profile and match info */}
				<ProfileInfo match={match} />
			</CardHeader>
			<CardContent className="pb-2">
				<PlanDetails plan={match.plan} />
				<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
					<Icon name="clock" className="h-3 w-3" />
					<span>Proposed by {match.match.name}</span>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between pt-2">
				<Button variant="outline" size="sm" onClick={() => startMessaging(match.id)}>
					<Icon name="message-square" className="h-4 w-4 mr-1" />
					Message
				</Button>
				<Button size="sm" onClick={() => viewPlanDetails(match.id)}>
					<Icon name="check" className="h-4 w-4 mr-1" />
					Review Plan
				</Button>
			</CardFooter>
		</Card>
	)
}

function ConfirmedCard({ match, startMessaging, viewMatchDetails, isAccepted }: ConfirmedCardProps) {
	return (
		<Card key={match.id} className="overflow-hidden border-primary bg-primary/5">
			<CardHeader className="pb-3">
				<div className="flex justify-between items-start">
					<Badge variant="default">Confirmed</Badge>
					{match.plan?.activity && <Badge variant="outline">{match.plan.activity}</Badge>}
				</div>
				{/* Profile and match info */}
				<ProfileInfo match={match} />
			</CardHeader>
			<CardContent className="pb-2">
				<PlanDetails plan={match.plan} />
			</CardContent>
			<CardFooter className="flex justify-between pt-2">
				<Button variant="outline" size="sm" onClick={() => startMessaging(match.id)}>
					<Icon name="message-square" className="h-4 w-4 mr-1" />
					Message
				</Button>
				<Button size="sm" onClick={() => viewMatchDetails(match.id)}>
					<Icon name="calendar-plus" className="h-4 w-4 mr-1" />
					View Details
				</Button>
			</CardFooter>
		</Card>
	)
}

function PastCard({ match, startMessaging, viewMatchDetails }: PastCardProps) {
	return (
		<Card key={match.id} className="overflow-hidden">
			<CardHeader className="pb-3">
				<div className="flex justify-between items-start">
					<Badge variant="outline">Past</Badge>
					{match.plan?.activity && <Badge variant="outline">{match.plan.activity}</Badge>}
				</div>
				{/* Profile and match info */}
				<ProfileInfo match={match} />
			</CardHeader>
			<CardContent className="pb-2">
				<PlanDetails plan={match.plan} />
			</CardContent>
			<CardFooter className="flex justify-between pt-2">
				<Button variant="outline" size="sm" onClick={() => startMessaging(match.id)}>
					<Icon name="message-square" className="h-4 w-4 mr-1" />
					Message
				</Button>
				<Button size="sm" onClick={() => viewMatchDetails(match.id)}>
					<Icon name="calendar-plus" className="h-4 w-4 mr-1" />
					View Details
				</Button>
			</CardFooter>
		</Card>
	)
}

// Shared components for card parts
function ProfileInfo({ match }: ProfileInfoProps) {
	return (
		<>
			<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
				<div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
					{match.profileType === "single" ? (
						<Icon name="user" className="h-3 w-3 text-primary" />
					) : (
						<Icon name="users" className="h-3 w-3 text-primary" />
						)}
				</div>
				<span>{match.profileName}</span>
			</div>
			<CardTitle className="mt-1">
				<div className="flex items-center gap-2">
					<Avatar className="h-8 w-8">
						<AvatarImage src={match.match.image || "/placeholder.svg"} alt={match.match.name} />
						<AvatarFallback>{match.match.initials}</AvatarFallback>
					</Avatar>
					<span>{match.match.name}</span>
				</div>
			</CardTitle>
			<CardDescription>
				{match.match.type === "single" ? "Individual" : match.match.type === "couple" ? "Couple" : "Family"}
			</CardDescription>
		</>
	)
}

function PlanDetails({ plan }: PlanDetailsProps) {
	if (!plan) return null;
	
	return (
		<div className="space-y-2 text-sm">
			{plan.date && (
				<div className="flex items-center gap-2">
					<Icon name="calendar" className="h-4 w-4 text-muted-foreground" />
					<span>{plan.date}</span>
				</div>
			)}
			{plan.time && (
				<div className="flex items-center gap-2">
					<Icon name="clock" className="h-4 w-4 text-muted-foreground" />
					<span>{plan.time}</span>
				</div>
			)}
			{plan.location && (
				<div className="flex items-center gap-2">
					<Icon name="map-pin" className="h-4 w-4 text-muted-foreground" />
					<span>{plan.location}</span>
				</div>
			)}
		</div>
	)
}

export function MixerList() {
	// const router = useRouter()
	// const searchParams = useSearchParams()
	const activeTab =  "pending"

	const [celebratingMatch, setCelebratingMatch] = useState<string | null>(null)
	const [isConfettiActive, setIsConfettiActive] = useState(false)
	const [showDeclineDialog, setShowDeclineDialog] = useState(false)
	const [matchToDecline, setMatchToDecline] = useState<string | null>(null)
	const [declineReason, setDeclineReason] = useState("")
	const [showPlanDetailsDialog, setShowPlanDetailsDialog] = useState(false)
	const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
	const [planAccepted, setPlanAccepted] = useState<string | null>(null)
	const [showCounterProposalForm, setShowCounterProposalForm] = useState(false)
	const [counterProposalData, setCounterProposalData] = useState({
		activity: "",
		date: "",
		time: "",
		location: "",
		reason: "",
	})
	const [counterProposalSubmitted, setCounterProposalSubmitted] = useState(false)
	const [showAddToCalendarDialog, setShowAddToCalendarDialog] = useState(false)
	const [calendarType, setCalendarType] = useState("google")

	// Filter matches based on the active tab
	const filteredMatches = mockMatches.filter((match) => {
		switch (activeTab) {
			case "matches":
				return match.status === "matched"
			case "pending":
				return (
					match.status === "pending_yours" || match.status === "pending_theirs" || match.status === "counter_proposed"
				)
			case "upcoming":
				return match.status === "confirmed"
			case "past":
				return match.status === "past"
			default:
				return true
		}
	})

	const startPlanning = (matchId: string) => {
		// router.push(`/mixer/plan/${matchId}`)
	}

	const startMessaging = (matchId: string) => {
		// router.push(`/mixer/messages/${matchId}`)
	}

	const viewMatchDetails = (matchId: string) => {
		// router.push(`/mixer/matches/${matchId}`)
	}

	const viewPlanDetails = (matchId: string) => {
		const match = mockMatches.find((m) => m.id === matchId)
		setSelectedMatch(matchId)

		// Initialize counter proposal form with current plan data
		if (match?.plan) {
			setCounterProposalData({
				activity: match.plan.activity,
				date: match.plan.date,
				time: match.plan.time,
				location: match.plan.location,
				reason: "",
			})
		}

		setShowPlanDetailsDialog(true)
	}

	const acceptPlan = (matchId: string) => {
		setShowPlanDetailsDialog(false)
		setCelebratingMatch(matchId)
		setIsConfettiActive(true)
		setPlanAccepted(matchId)

		// In a real app, you would update the plan status in your API
		setTimeout(() => {
			setIsConfettiActive(false)
			setCelebratingMatch(null)
		}, 3000)
	}

	const openDeclineDialog = (matchId: string) => {
		setMatchToDecline(matchId)
		setShowDeclineDialog(true)
	}

	const handleDecline = () => {
		// In a real app, you would update the match or plan status in your API
		setShowDeclineDialog(false)
		setMatchToDecline(null)
		setDeclineReason("")
	}

	const handleConfettiComplete = () => {
		setIsConfettiActive(false)
		setCelebratingMatch(null)
	}

	const openCounterProposalForm = () => {
		setShowCounterProposalForm(true)
	}

	const submitCounterProposal = () => {
		// In a real app, you would send this counter-proposal to your API
		setShowCounterProposalForm(false)
		setShowPlanDetailsDialog(false)
		setCounterProposalSubmitted(true)

		// Reset after a few seconds
		setTimeout(() => {
			setCounterProposalSubmitted(false)
		}, 5000)
	}

	const openAddToCalendarDialog = (matchId: string) => {
		setSelectedMatch(matchId)
		setShowAddToCalendarDialog(true)
	}

	const addToCalendar = () => {
		// In a real app, you would generate a calendar file or link
		setShowAddToCalendarDialog(false)

		// Simulate opening a calendar link
		if (calendarType === "google") {
			window.open("https://calendar.google.com", "_blank")
		} else if (calendarType === "outlook") {
			window.open("https://outlook.office.com/calendar", "_blank")
		} else if (calendarType === "apple") {
			alert("Calendar event created for Apple Calendar")
		}
	}

	// Get the selected match data
	const getSelectedMatch = () => {
		return mockMatches.find((match) => match.id === selectedMatch)
	}

	// If no matches match the current filter
	if (filteredMatches.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">No {activeTab} found</p>
			</div>
		)
	}

	return (
		<>
			{isConfettiActive && <ConfettiCelebration onComplete={handleConfettiComplete} />}

			{planAccepted && (
				<Alert className="mb-6 bg-primary/10 border-primary">
					<Icon name="check" className="h-4 w-4 text-primary" />

					<AlertTitle>Plan Accepted!</AlertTitle>
					<AlertDescription>
						You've accepted the plan with {mockMatches.find((match) => match.id === planAccepted)?.match.name}. It's now
						confirmed on your calendar.
					</AlertDescription>
				</Alert>
			)}

			{counterProposalSubmitted && (
				<Alert className="mb-6 bg-primary/10 border-primary">
					<Icon name="edit" className="h-4 w-4 text-primary" />
					<AlertTitle>Counter-Proposal Sent!</AlertTitle>
					<AlertDescription>
						Your suggested changes have been sent. You'll be notified when they respond.
					</AlertDescription>
				</Alert>
			)}

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{filteredMatches.map((match) => {
					const isCelebrating = celebratingMatch === match.id;
					const isAccepted = planAccepted === match.id;
					
					// Render the appropriate card based on match status
					switch(match.status) {
						case "matched":
							return <NewMatchCard 
								key={match.id}
								match={match} 
								startMessaging={startMessaging} 
								startPlanning={startPlanning} 
							/>;
							
						case "counter_proposed":
							return <CounterProposedCard 
								key={match.id}
								match={match} 
								startMessaging={startMessaging} 
								openDeclineDialog={openDeclineDialog} 
							/>;
							
						case "pending_yours":
							return <PendingYoursCard 
								key={match.id}
								match={match} 
								startMessaging={startMessaging} 
								openDeclineDialog={openDeclineDialog} 
							/>;
							
						case "pending_theirs":
							return <PendingTheirsCard 
								key={match.id}
								match={match} 
								startMessaging={startMessaging} 
								viewPlanDetails={viewPlanDetails} 
							/>;
							
						case "confirmed":
						case "past":
							if (isAccepted || match.status === "confirmed") {
								return <ConfirmedCard 
									key={match.id}
									match={match} 
									startMessaging={startMessaging} 
									viewMatchDetails={viewMatchDetails}
									isAccepted={isAccepted}
								/>;
							} else {
								return <PastCard 
									key={match.id}
									match={match} 
									startMessaging={startMessaging} 
									viewMatchDetails={viewMatchDetails} 
								/>;
							}
							
						default:
							return null;
					}
				})}
			</div>

			<Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{matchToDecline && mockMatches.find((m) => m.id === matchToDecline)?.status === "pending_yours"
								? "Cancel Your Proposed Plan"
								: "Decline Proposed Plan"}
						</DialogTitle>
						<DialogDescription>
							{matchToDecline && mockMatches.find((m) => m.id === matchToDecline)?.status === "pending_yours"
								? "Are you sure you want to cancel your proposed plan? You can always create a new plan later."
								: "Are you sure you want to decline this proposed plan? You can suggest an alternative in the message."}
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<label htmlFor="reason" className="text-sm font-medium">
							Reason (optional)
						</label>
						<textarea
							id="reason"
							className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
							placeholder="Let them know why you're declining or canceling (optional)"
							value={declineReason}
							onChange={(e) => setDeclineReason(e.target.value)}
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
							Go Back
						</Button>
						<Button variant="destructive" onClick={handleDecline}>
							{matchToDecline && mockMatches.find((m) => m.id === matchToDecline)?.status === "pending_yours"
								? "Cancel Plan"
								: "Decline Plan"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showPlanDetailsDialog} onOpenChange={setShowPlanDetailsDialog}>
				<DialogContent className="max-w-md">
					{getSelectedMatch() && !showCounterProposalForm && (
						<>
							<DialogHeader>
								<DialogTitle>Review Proposed Plan</DialogTitle>
								<DialogDescription>
									{getSelectedMatch()?.match.name} has proposed the following plan for your meetup.
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Icon name="calendar" className="h-4 w-4 text-muted-foreground" />
										<h3 className="font-medium">Activity</h3>
									</div>
									<p className="pl-6">{getSelectedMatch()?.plan?.activity}</p>
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<h3 className="font-medium">Date & Time</h3>
									</div>
									<p className="pl-6">
										{getSelectedMatch()?.plan?.date} at {getSelectedMatch()?.plan?.time}
									</p>
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Icon name="map-pin" className="h-4 w-4 text-muted-foreground" />
										<h3 className="font-medium">Location</h3>
									</div>
									<p className="pl-6">{getSelectedMatch()?.plan?.location}</p>
								</div>

								<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
									<Icon name="clock" className="h-3 w-3" />
									<span>
                    Proposed on{" "}
										{getSelectedMatch()?.plan?.proposedAt.toLocaleDateString("en-US", {
											month: "long",
											day: "numeric",
											year: "numeric",
										})}
                  </span>
								</div>
							</div>

							<DialogFooter className="flex flex-col sm:flex-row gap-2">
								<Button variant="outline" onClick={() => openDeclineDialog(selectedMatch!)}>
									Decline
								</Button>
								<Button variant="outline" onClick={openCounterProposalForm}>
									<Icon name="edit" className="h-4 w-4 mr-1" />
									Suggest Changes
								</Button>
								<Button onClick={() => acceptPlan(selectedMatch!)}>Accept Plan</Button>
							</DialogFooter>
						</>
					)}

					{getSelectedMatch() && showCounterProposalForm && (
						<>
							<DialogHeader>
								<DialogTitle>Suggest Changes</DialogTitle>
								<DialogDescription>Propose modifications to {getSelectedMatch()?.match.name}'s plan.</DialogDescription>
							</DialogHeader>

							<div className="py-4 space-y-4">
								<div className="space-y-2">
									<Label htmlFor="activity">Activity</Label>
									<Input
										id="activity"
										value={counterProposalData.activity}
										onChange={(e) => setCounterProposalData({ ...counterProposalData, activity: e.target.value })}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="date">Date</Label>
									<Input
										id="date"
										type="date"
										value={counterProposalData.date}
										onChange={(e) => setCounterProposalData({ ...counterProposalData, date: e.target.value })}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="time">Time</Label>
									<Select
										value={counterProposalData.time}
										onValueChange={(value) => setCounterProposalData({ ...counterProposalData, time: value })}
									>
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

								<div className="space-y-2">
									<Label htmlFor="location">Location</Label>
									<Input
										id="location"
										value={counterProposalData.location}
										onChange={(e) => setCounterProposalData({ ...counterProposalData, location: e.target.value })}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="reason">Reason for Changes</Label>
									<Textarea
										id="reason"
										placeholder="Explain why you're suggesting these changes..."
										value={counterProposalData.reason}
										onChange={(e) => setCounterProposalData({ ...counterProposalData, reason: e.target.value })}
										rows={3}
									/>
								</div>
							</div>

							<DialogFooter>
								<Button variant="outline" onClick={() => setShowCounterProposalForm(false)}>
									Cancel
								</Button>
								<Button onClick={submitCounterProposal} disabled={!counterProposalData.reason}>
									Send Counter-Proposal
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={showAddToCalendarDialog} onOpenChange={setShowAddToCalendarDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Add to Calendar</DialogTitle>
						<DialogDescription>Add this meetup to your preferred calendar application.</DialogDescription>
					</DialogHeader>

					<div className="py-4">
						<RadioGroup value={calendarType} onValueChange={setCalendarType}>
							<div className="flex items-center space-x-2 mb-3">
								<RadioGroupItem value="google" id="google" />
								<Label htmlFor="google" className="font-normal flex items-center">
									<svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path
											d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
											fill="#FFC107"
										/>
										<path
											d="M3.15302 7.3455L6.43852 9.755C7.32752 7.554 9.48052 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15902 2 4.82802 4.1685 3.15302 7.3455Z"
											fill="#FF3D00"
										/>
										<path
											d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39897 18 7.19047 16.3415 6.35847 14.027L3.09747 16.5395C4.75247 19.778 8.11347 22 12 22Z"
											fill="#4CAF50"
										/>
										<path
											d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
											fill="#1976D2"
										/>
									</svg>
									Google Calendar
								</Label>
							</div>
							<div className="flex items-center space-x-2 mb-3">
								<RadioGroupItem value="outlook" id="outlook" />
								<Label htmlFor="outlook" className="font-normal flex items-center">
									<svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path
											d="M22 6.25V17.75C22 18.9926 20.9926 20 19.75 20H4.25C3.00736 20 2 18.9926 2 17.75V6.25C2 5.00736 3.00736 4 4.25 4H19.75C20.9926 4 22 5.00736 22 6.25Z"
											fill="#0078D4"
										/>
										<path
											d="M22 6.25V17.75C22 18.9926 20.9926 20 19.75 20H12V4H19.75C20.9926 4 22 5.00736 22 6.25Z"
											fill="#0078D4"
										/>
										<path
											d="M8.74995 8.5H4.24995V15.5H8.74995C9.16416 15.5 9.49995 15.1642 9.49995 14.75V9.25C9.49995 8.83579 9.16416 8.5 8.74995 8.5Z"
											fill="white"
										/>
									</svg>
									Outlook Calendar
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="apple" id="apple" />
								<Label htmlFor="apple" className="font-normal flex items-center">
									<svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path
											d="M18.7101 12.6754C18.7242 11.9979 18.8977 11.3332 19.2181 10.7347C19.5386 10.1362 20.0001 9.62271 20.5601 9.24539C20.1972 8.74326 19.7274 8.32311 19.1851 8.01339C18.6429 7.70367 18.0412 7.51241 17.4201 7.45539C16.0901 7.31539 14.8001 8.24539 14.1201 8.24539C13.4401 8.24539 12.3901 7.45539 11.2701 7.45539C10.5372 7.47986 9.82252 7.68568 9.19519 8.05429C8.56786 8.4229 8.04923 8.94334 7.69007 9.56539C6.5701 11.4554 7.41007 14.2154 8.50007 15.9454C9.06007 16.7954 9.73007 17.7454 10.6001 17.7154C11.4701 17.6854 11.7901 17.1754 12.8401 17.1754C13.8901 17.1754 14.1801 17.7154 15.1001 17.6954C16.0201 17.6754 16.6101 16.8354 17.1701 15.9854C17.6241 15.3071 17.9651 14.5605 18.1801 13.7754C17.5093 13.4878 16.9379 13.0067 16.5349 12.3909C16.1319 11.7751 15.9139 11.0523 15.9101 10.3154C15.9139 9.57848 16.1319 8.85571 16.5349 8.23991C16.9379 7.62411 17.5093 7.14301 18.1801 6.85539C17.7229 5.98539 16.9901 5.30539 16.1101 4.93539C16.5249 5.52328 16.7401 6.22845 16.7301 6.94539C16.7401 7.66233 16.5249 8.3675 16.1101 8.95539C15.7093 9.52539 15.1301 9.95539 14.4801 10.1754C14.6601 10.9954 15.1001 11.7454 15.7301 12.2854C16.0601 12.5554 16.4401 12.7654 16.8401 12.8954C17.5001 13.0954 18.2001 13.0054 18.7101 12.6754Z"
											fill="black"
										/>
										<path
											d="M14.6001 5.52539C15.0978 4.91539 15.3675 4.15539 15.3601 3.37539C14.5801 3.47539 13.8601 3.83539 13.3401 4.41539C12.8201 4.99539 12.5401 5.75539 12.5801 6.52539C13.3601 6.53539 14.1001 6.13539 14.6001 5.52539Z"
											fill="black"
										/>
									</svg>
									Apple Calendar
								</Label>
							</div>
						</RadioGroup>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setShowAddToCalendarDialog(false)}>
							Cancel
						</Button>
						<Button onClick={addToCalendar}>
							<Icon name="calendar" className="h-4 w-4 mr-2" />
							Add to Calendar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

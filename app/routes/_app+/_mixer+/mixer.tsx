import {
	Calendar,
	Clock,
	Edit,
	MapPin,
	MessageSquare,
	Pause,
	ThumbsUp,
	User,
	Users,
} from 'lucide-react'
import { Suspense, useState } from 'react'
import { Link, Outlet } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar'
import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card'
import { type Route } from './+types/mixer'

export async function loader({ request }: Route.LoaderArgs) {
	// if this page is just /mixer then redirect to /mixer/profiles
	// if (new URL(request.url).pathname === '/mixer') {
	// 	return redirect('/mixer/profiles')
	// }
}

export default function MixerLayout() {
	return (
		<Suspense fallback={<div>Loading mixer activities...</div>}>
			{/* Main content area for child routes */}
			<Outlet />
		</Suspense>
	)
}

// Mock data - in a real app, this would come from your API
const mockMatches = [
	{
		id: '1',
		status: 'matched',
		activity: 'Dinner',
		date: 'May 15, 2025',
		time: '6:30 PM',
		location: "Host's home",
		profileId: '1', // Family Time
		profileName: 'Family Time',
		profileType: 'family',
		match: {
			name: 'The Johnson Family',
			type: 'family',
			image: '/placeholder.svg?height=40&width=40',
			initials: 'JF',
		},
	},
	{
		id: '2',
		status: 'active',
		activity: 'Coffee',
		date: 'Pending',
		time: 'To be determined',
		location: 'To be determined',
		profileId: '2', // Men's Fellowship
		profileName: "Men's Fellowship",
		profileType: 'single',
		match: {
			name: 'David Wilson',
			type: 'single',
			image: '/placeholder.svg?height=40&width=40',
			initials: 'DW',
		},
	},
	{
		id: '3',
		status: 'past',
		activity: 'Bible Study',
		date: 'April 28, 2025',
		time: '7:00 PM',
		location: 'Church Meeting Room',
		profileId: '3', // Date Night
		profileName: 'Date Night',
		profileType: 'couple',
		match: {
			name: 'Sarah & Michael',
			type: 'couple',
			image: '/placeholder.svg?height=40&width=40',
			initials: 'SM',
		},
	},
]
//
// export function MixerList() {
// 	const [showFeedback, setShowFeedback] = useState(false)
// 	const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
//
// 	const openFeedback = (matchId: string) => {
// 		// setSelectedMatch(matchId)
// 		// setShowFeedback(true)
// 	}
//
// 	return (
// 		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
// 			{mockMatches.map((match) => (
// 				<Card key={match.id} className="overflow-hidden">
// 					<CardHeader className="pb-3">
// 						<div className="flex items-start justify-between">
// 							<Badge
// 								variant={
// 									match.status === 'matched'
// 										? 'default'
// 										: match.status === 'active'
// 											? 'secondary'
// 											: 'outline'
// 								}
// 							>
// 								{match.status === 'matched'
// 									? 'Matched'
// 									: match.status === 'active'
// 										? 'Active'
// 										: 'Past'}
// 							</Badge>
// 							<Badge variant="outline">{match.activity}</Badge>
// 						</div>
// 						<div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
// 							<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
// 								{match.profileType === 'single' ? (
// 									<User className="h-3 w-3 text-primary" />
// 								) : (
// 									<Users className="h-3 w-3 text-primary" />
// 								)}
// 							</div>
// 							<span>{match.profileName}</span>
// 						</div>
// 						<CardTitle className="mt-1">
// 							<div className="flex items-center gap-2">
// 								<Avatar className="h-8 w-8">
// 									<AvatarImage
// 										src={match.match.image || '/placeholder.svg'}
// 										alt={match.match.name}
// 									/>
// 									<AvatarFallback>{match.match.initials}</AvatarFallback>
// 								</Avatar>
// 								<span>{match.match.name}</span>
// 							</div>
// 						</CardTitle>
// 						<CardDescription>
// 							{match.match.type === 'single'
// 								? 'Individual'
// 								: match.match.type === 'couple'
// 									? 'Couple'
// 									: 'Family'}
// 						</CardDescription>
// 					</CardHeader>
// 					<CardContent className="pb-2">
// 						<div className="space-y-2 text-sm">
// 							<div className="flex items-center gap-2">
// 								<Calendar className="h-4 w-4 text-muted-foreground" />
// 								<span>{match.date}</span>
// 							</div>
// 							<div className="flex items-center gap-2">
// 								<Clock className="h-4 w-4 text-muted-foreground" />
// 								<span>{match.time}</span>
// 							</div>
// 							<div className="flex items-center gap-2">
// 								<MapPin className="h-4 w-4 text-muted-foreground" />
// 								<span>{match.location}</span>
// 							</div>
// 						</div>
// 					</CardContent>
// 					<CardFooter className="flex justify-between pt-2">
// 						{match.status === 'matched' ? (
// 							<>
// 								<Button variant="outline" size="sm">
// 									<MessageSquare className="mr-1 h-4 w-4" />
// 									Message
// 								</Button>
// 								<Button size="sm" onClick={() => openFeedback(match.id)}>
// 									<ThumbsUp className="mr-1 h-4 w-4" />
// 									Confirm
// 								</Button>
// 							</>
// 						) : match.status === 'active' ? (
// 							<>
// 								<Button variant="outline" size="sm">
// 									<MessageSquare className="mr-1 h-4 w-4" />
// 									Message
// 								</Button>
// 								<Button variant="destructive" size="sm">
// 									Decline
// 								</Button>
// 							</>
// 						) : (
// 							<Button
// 								variant="outline"
// 								size="sm"
// 								className="w-full"
// 								onClick={() => openFeedback(match.id)}
// 							>
// 								<ThumbsUp className="mr-1 h-4 w-4" />
// 								Give Feedback
// 							</Button>
// 						)}
// 					</CardFooter>
// 				</Card>
// 			))}
//
// 			{/*<FeedbackDialog open={showFeedback} onOpenChange={setShowFeedback} matchId={selectedMatch} />*/}
// 		</div>
// 	)
// }
//
// // Mock data - in a real app, this would come from your API
// const mockProfiles = [
// 	{
// 		id: '1',
// 		name: 'Family Time',
// 		type: 'family',
// 		description: 'Activities for our whole family',
// 		matchCount: 2,
// 		isPaused: false,
// 	},
// 	{
// 		id: '2',
// 		name: "Men's Fellowship",
// 		type: 'single',
// 		description: 'Connect with other men from church',
// 		matchCount: 1,
// 		isPaused: true,
// 	},
// 	{
// 		id: '3',
// 		name: 'Date Night',
// 		type: 'couple',
// 		description: 'Activities for me and my spouse',
// 		matchCount: 0,
// 		isPaused: false,
// 	},
// ]
//
// export function ProfileSummary() {
// 	const [profiles] = useState(mockProfiles)
// 	const activeProfiles = profiles.filter((profile) => !profile.isPaused)
// 	const totalMatches = profiles.reduce(
// 		(sum, profile) => sum + profile.matchCount,
// 		0,
// 	)
//
// 	// If no profiles, don't show the summary
// 	if (profiles.length === 0) return null
//
// 	return (
// 		<Card className="border-dashed bg-muted/40">
// 			<CardHeader className="pb-3">
// 				<CardTitle className="text-lg">Your Mixer Profiles</CardTitle>
// 				<CardDescription>
// 					You have {profiles.length}{' '}
// 					{profiles.length === 1 ? 'profile' : 'profiles'} (
// 					{activeProfiles.length} active) with a total of {totalMatches}{' '}
// 					{totalMatches === 1 ? 'match' : 'matches'}
// 				</CardDescription>
// 			</CardHeader>
// 			<CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
// 				{profiles.map((profile) => (
// 					<div
// 						key={profile.id}
// 						className={`flex items-start gap-3 rounded-md border p-3 ${
// 							profile.isPaused ? 'bg-muted/50' : 'bg-background'
// 						}`}
// 					>
// 						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
// 							{profile.type === 'single' ? (
// 								<User className="h-4 w-4 text-primary" />
// 							) : (
// 								<Users className="h-4 w-4 text-primary" />
// 							)}
// 						</div>
// 						<div className="min-w-0 flex-1">
// 							<div className="flex items-center justify-between">
// 								<p className="truncate text-sm font-medium">{profile.name}</p>
// 								<div className="ml-2 flex shrink-0 items-center gap-1">
// 									{profile.isPaused && (
// 										<Pause className="h-3 w-3 text-muted-foreground" />
// 									)}
// 									<Badge variant="outline">{profile.matchCount}</Badge>
// 								</div>
// 							</div>
// 							<p className="truncate text-xs text-muted-foreground">
// 								{profile.isPaused
// 									? 'Paused'
// 									: profile.type === 'single'
// 										? 'Individual'
// 										: profile.type === 'couple'
// 											? 'Couple'
// 											: 'Family'}
// 							</p>
// 						</div>
// 						<Button
// 							variant="ghost"
// 							size="icon"
// 							className="h-8 w-8 shrink-0"
// 							asChild
// 						>
// 							<Link to={`/mixer/join?profile=${profile.id}`}>
// 								<Edit className="h-4 w-4" />
// 								<span className="sr-only">Edit {profile.name}</span>
// 							</Link>
// 						</Button>
// 					</div>
// 				))}
// 			</CardContent>
// 		</Card>
// 	)
// }

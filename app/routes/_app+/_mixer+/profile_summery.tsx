import { Edit, Pause, User, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card'

// Mock data - in a real app, this would come from your API
const mockProfiles = [
	{
		id: '1',
		name: 'Family Time',
		type: 'family',
		description: 'Activities for our whole family',
		matchCount: 2,
		isPaused: false,
	},
	{
		id: '2',
		name: "Men's Fellowship",
		type: 'single',
		description: 'Connect with other men from church',
		matchCount: 1,
		isPaused: true,
	},
	{
		id: '3',
		name: 'Date Night',
		type: 'couple',
		description: 'Activities for me and my spouse',
		matchCount: 0,
		isPaused: false,
	},
]

export function ProfileSummary() {
	const [profiles] = useState(mockProfiles)
	const activeProfiles = profiles.filter((profile) => !profile.isPaused)
	const totalMatches = profiles.reduce(
		(sum, profile) => sum + profile.matchCount,
		0,
	)

	// If no profiles, don't show the summary
	if (profiles.length === 0) return null

	return (
		<Card className="border-dashed bg-muted/40">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg">Your Mixer Profiles</CardTitle>
				<CardDescription>
					You have {profiles.length}{' '}
					{profiles.length === 1 ? 'profile' : 'profiles'} (
					{activeProfiles.length} active) with a total of {totalMatches}{' '}
					{totalMatches === 1 ? 'match' : 'matches'}
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{profiles.map((profile) => (
					<div
						key={profile.id}
						className={`flex items-start gap-3 rounded-md border p-3 ${
							profile.isPaused ? 'bg-muted/50' : 'bg-background'
						}`}
					>
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
							{profile.type === 'single' ? (
								<User className="h-4 w-4 text-primary" />
							) : (
								<Users className="h-4 w-4 text-primary" />
							)}
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center justify-between">
								<p className="truncate text-sm font-medium">{profile.name}</p>
								<div className="ml-2 flex shrink-0 items-center gap-1">
									{profile.isPaused && (
										<Pause className="h-3 w-3 text-muted-foreground" />
									)}
									<Badge variant="outline">{profile.matchCount}</Badge>
								</div>
							</div>
							<p className="truncate text-xs text-muted-foreground">
								{profile.isPaused
									? 'Paused'
									: profile.type === 'single'
										? 'Individual'
										: profile.type === 'couple'
											? 'Couple'
											: 'Family'}
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 shrink-0"
							asChild
						>
							<Link to={`/mixer/join?profile=${profile.id}`}>
								<Edit className="h-4 w-4" />
								<span className="sr-only">Edit {profile.name}</span>
							</Link>
						</Button>
					</div>
				))}
			</CardContent>
		</Card>
	)
}

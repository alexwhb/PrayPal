import { Edit, Pause, User, Users } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { Badge } from "#app/components/ui/badge"
import { Button } from "#app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#app/components/ui/card"

// Mock data - in a real app, this would come from your API
const mockProfiles = [
	{
		id: "1",
		name: "Family Time",
		type: "family",
		description: "Activities for our whole family",
		matchCount: 2,
		isPaused: false,
	},
	{
		id: "2",
		name: "Men's Fellowship",
		type: "single",
		description: "Connect with other men from church",
		matchCount: 1,
		isPaused: true,
	},
	{
		id: "3",
		name: "Date Night",
		type: "couple",
		description: "Activities for me and my spouse",
		matchCount: 0,
		isPaused: false,
	},
]

export function ProfileSummary() {
	const [profiles] = useState(mockProfiles)
	const activeProfiles = profiles.filter((profile) => !profile.isPaused)
	const totalMatches = profiles.reduce((sum, profile) => sum + profile.matchCount, 0)

	// If no profiles, don't show the summary
	if (profiles.length === 0) return null

	return (
		<Card className="bg-muted/40 border-dashed">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg">Your Mixer Profiles</CardTitle>
				<CardDescription>
					You have {profiles.length} {profiles.length === 1 ? "profile" : "profiles"} ({activeProfiles.length} active)
					with a total of {totalMatches} {totalMatches === 1 ? "match" : "matches"}
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{profiles.map((profile) => (
					<div
						key={profile.id}
						className={`flex items-start gap-3 p-3 rounded-md border ${
							profile.isPaused ? "bg-muted/50" : "bg-background"
						}`}
					>
						<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
							{profile.type === "single" ? (
								<User className="h-4 w-4 text-primary" />
							) : (
								<Users className="h-4 w-4 text-primary" />
							)}
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium truncate">{profile.name}</p>
								<div className="flex items-center gap-1 ml-2 shrink-0">
									{profile.isPaused && <Pause className="h-3 w-3 text-muted-foreground" />}
									<Badge variant="outline">{profile.matchCount}</Badge>
								</div>
							</div>
							<p className="text-xs text-muted-foreground truncate">
								{profile.isPaused
									? "Paused"
									: profile.type === "single"
										? "Individual"
										: profile.type === "couple"
											? "Couple"
											: "Family"}
							</p>
						</div>
						<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
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

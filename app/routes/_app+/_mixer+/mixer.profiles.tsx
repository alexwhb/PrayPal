import { Edit, Pause, Play, Plus, Trash2, User, Users } from "lucide-react"
import { useState } from "react"
import { Link } from 'react-router'
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
	DialogTrigger,
} from "#app/components/ui/dialog"
import { Input } from "#app/components/ui/input"
import { Label } from "#app/components/ui/label"
import { RadioGroup, RadioGroupItem } from "#app/components/ui/radio-group"
import { Separator } from "#app/components/ui/separator"

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

export default function ProfilesPage() {

	const [profiles, setProfiles] = useState(mockProfiles)
	const [newProfileOpen, setNewProfileOpen] = useState(false)
	const [newProfileName, setNewProfileName] = useState("")
	const [newProfileType, setNewProfileType] = useState("single")
	const [newProfileDescription, setNewProfileDescription] = useState("")
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const [profileToDelete, setProfileToDelete] = useState<string | null>(null)

	const handleCreateProfile = () => {
		const newProfile = {
			id: Date.now().toString(),
			name: newProfileName,
			type: newProfileType,
			description: newProfileDescription,
			matchCount: 0,
			isPaused: false,
		}

		setProfiles([...profiles, newProfile])
		setNewProfileOpen(false)

		// Reset form
		setNewProfileName("")
		setNewProfileType("single")
		setNewProfileDescription("")

		// Navigate to edit the new profile
		// TODO
		// router.push(`/mixer/join?profile=${newProfile.id}`)

	}

	const handleDeleteProfile = () => {
		if (profileToDelete) {
			setProfiles(profiles.filter((profile) => profile.id !== profileToDelete))
			setDeleteConfirmOpen(false)
			setProfileToDelete(null)
		}
	}

	const togglePauseProfile = (profileId: string) => {
		setProfiles(
			profiles.map((profile) => (profile.id === profileId ? { ...profile, isPaused: !profile.isPaused } : profile)),
		)
	}

	return (
		<div className="container mx-auto py-6 space-y-6 max-w-4xl">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold tracking-tight">Mixer Profiles</h1>
					<p className="text-muted-foreground">
						Create different profiles for various ways you want to connect with the church community
					</p>
				</div>
				<Dialog open={newProfileOpen} onOpenChange={setNewProfileOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							New Profile
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Profile</DialogTitle>
							<DialogDescription>
								Create a new profile for a different way you'd like to connect with others.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="name">Profile Name</Label>
								<Input
									id="name"
									placeholder="e.g., Family Activities, Men's Group, etc."
									value={newProfileName}
									onChange={(e) => setNewProfileName(e.target.value)}
								/>
							</div>
							<div className="grid gap-2">
								<Label>Profile Type</Label>
								<RadioGroup value={newProfileType} onValueChange={setNewProfileType}>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="single" id="single" />
										<Label htmlFor="single" className="font-normal">
											Single
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="couple" id="couple" />
										<Label htmlFor="couple" className="font-normal">
											Couple
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="family" id="family" />
										<Label htmlFor="family" className="font-normal">
											Family
										</Label>
									</div>
								</RadioGroup>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="description">Description</Label>
								<Input
									id="description"
									placeholder="Brief description of this profile"
									value={newProfileDescription}
									onChange={(e) => setNewProfileDescription(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setNewProfileOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleCreateProfile} disabled={!newProfileName}>
								Create & Configure
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Separator />

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{profiles.map((profile) => (
					<Card key={profile.id} className={profile.isPaused ? "bg-muted/40" : ""}>
						<CardHeader className="pb-2">
							<div className="flex justify-between items-start">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
									{profile.type === "single" ? (
										<User className="h-5 w-5 text-primary" />
									) : (
										<Users className="h-5 w-5 text-primary" />
									)}
								</div>
								<div className="flex items-center gap-2">
									{profile.isPaused && (
										<Badge variant="outline" className="text-muted-foreground">
											Paused
										</Badge>
									)}
									<Badge variant="outline">
										{profile.matchCount} {profile.matchCount === 1 ? "match" : "matches"}
									</Badge>
								</div>
							</div>
							<CardTitle className="mt-2">{profile.name}</CardTitle>
							<CardDescription>
								{profile.type === "single" ? "Individual" : profile.type === "couple" ? "Couple" : "Family"}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">{profile.description}</p>
						</CardContent>
						<CardFooter className="flex justify-between pt-2">
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setProfileToDelete(profile.id)
										setDeleteConfirmOpen(true)
									}}
								>
									<Trash2 className="h-4 w-4" />
									<span className="sr-only">Delete</span>
								</Button>
								<Link to={`/mixer/join?profile=${profile.id}`}>
									<Button variant="outline" size="sm">
										<Edit className="h-4 w-4" />
										<span className="sr-only">Edit</span>
									</Button>
								</Link>
							</div>
							<Button
								size="sm"
								variant={profile.isPaused ? "default" : "secondary"}
								onClick={() => togglePauseProfile(profile.id)}
							>
								{profile.isPaused ? (
									<>
										<Play className="h-4 w-4 mr-1" />
										Resume
									</>
								) : (
									<>
										<Pause className="h-4 w-4 mr-1" />
										Pause
									</>
								)}
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>

			<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Profile</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this profile? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDeleteProfile}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

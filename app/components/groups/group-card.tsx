import { Clock, MapPin, Calendar, Users, Video } from "lucide-react"
import { useState } from "react"
import { Badge } from "#app/components/ui/badge"
import { Button } from "#app/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "#app/components/ui/card"
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
import { Textarea } from "#app/components/ui/textarea"

export function GroupCard({ group }) {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [message, setMessage] = useState("")
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [phone, setPhone] = useState("")

	const handleJoin = (e) => {
		e.preventDefault()
		setIsDialogOpen(false)
		// In a real app, this would send the join request to the group leader
		alert(`Join request sent to ${group.leaderName} for ${group.name}`)
		setMessage("")
		setName("")
		setEmail("")
		setPhone("")
	}

	return (
		<Card className="h-full flex flex-col">
			<CardHeader className="p-0">
				<div className="relative h-40 w-full">
					<img src={group.image || "/placeholder.svg"} alt={group.name} className="object-cover rounded-t-lg" />
					<div className="absolute top-2 right-2">
						<Badge variant="secondary">{group.type}</Badge>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-4 flex-grow">
				<h3 className="font-semibold text-lg mb-1">{group.name}</h3>
				<p className="text-sm text-muted-foreground mb-3">{group.description}</p>

				<div className="space-y-1 mt-4">
					<div className="flex items-center text-sm">
						<Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
						<span>
              {group.frequency} on {group.day}
            </span>
					</div>
					<div className="flex items-center text-sm">
						<Clock className="mr-2 h-4 w-4 text-muted-foreground" />
						<span>{group.time}</span>
					</div>
					<div className="flex items-center text-sm">
						{group.online ? (
							<Video className="mr-2 h-4 w-4 text-muted-foreground" />
						) : (
							<MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
						)}
						<span>{group.location}</span>
					</div>
					<div className="flex items-center text-sm">
						<Users className="mr-2 h-4 w-4 text-muted-foreground" />
						<span>Led by {group.leaderName}</span>
					</div>
				</div>
			</CardContent>
			<CardFooter className="pt-0">
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button variant="default" className="w-full">
							Join Group
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Join {group.name}</DialogTitle>
							<DialogDescription>
								Fill out this form to request to join this group. The group leader will contact you with more
								information.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleJoin}>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="name">Your Name</Label>
									<Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
								</div>
								<div className="grid gap-2">
									<Label htmlFor="email">Email</Label>
									<Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
								</div>
								<div className="grid gap-2">
									<Label htmlFor="phone">Phone (optional)</Label>
									<Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
								</div>
								<div className="grid gap-2">
									<Label htmlFor="message">Message (optional)</Label>
									<Textarea
										id="message"
										placeholder="Share a bit about yourself or ask questions about the group..."
										value={message}
										onChange={(e) => setMessage(e.target.value)}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button type="submit">Send Join Request</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</CardFooter>
		</Card>
	)
}
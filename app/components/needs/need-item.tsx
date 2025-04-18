import { CalendarDays, CheckCircle2 } from "lucide-react"
// import { useState } from "react"
import { type Need } from '#app/components/needs/type.ts'
import { Avatar, AvatarFallback, AvatarImage } from "#app/components/ui/avatar"
import { Badge } from "#app/components/ui/badge"
import { Button } from "#app/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "#app/components/ui/card"
import { formatDate } from '#app/utils/formatter.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx'

// import {
// 	Dialog,
// 	DialogContent,
// 	DialogDescription,
// 	DialogFooter,
// 	DialogHeader,
// 	DialogTitle,
// 	DialogTrigger,
// } from "#app/components/ui/dialog"
// import { Label } from "#app/components/ui/label"
// import { Textarea } from "#app/components/ui/textarea"

export function NeedItem({need}: { need: Need; }) {
	// const [isDialogOpen, setIsDialogOpen] = useState(false)
	// const [message, setMessage] = useState("")
	

	// const handleConnect = (e) => {
	// 	e.preventDefault()
	// 	setIsDialogOpen(false)
	// 	// In a real app, this would send the message to the user
	// 	alert(`Message sent to ${need.userName}: "${message}"`)
	// 	setMessage("")
	// }

	return (
		<Card className={need.fulfilled ? "opacity-75" : ""}>
			<CardHeader className="pb-2">
				<div className="flex justify-between items-start">
					<div className="flex items-center gap-3">
						<Avatar>
							<AvatarImage src={getUserImgSrc(need.user.image?.id)} alt={need.user.username} />
							<AvatarFallback>{need.user.username.charAt(0)}</AvatarFallback>
						</Avatar>
						<div>
							<h3 className="font-medium">{need.user.username}</h3>
							<div className="flex items-center text-sm text-muted-foreground">
								<CalendarDays className="mr-1 h-3 w-3" />
								{formatDate(need.createdAt)}
							</div>
						</div>
					</div>
					<Badge variant={need.fulfilled ? "outline" : "secondary"}>{need.category.name}</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<p className="text-sm">{need.description}</p>
			</CardContent>
			<CardFooter className="flex justify-between pt-2">
				{need.fulfilled ? (
					<div className="flex items-center text-green-600">
						<CheckCircle2 className="h-4 w-4 mr-1" />
						<span className="text-sm">Fulfilled</span>
					</div>
				) : (
					<></>
					// <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					// 	<DialogTrigger asChild>
					// 		<Button variant="outline">Connect</Button>
					// 	</DialogTrigger>
					// 	<DialogContent>
					// 		<DialogHeader>
					// 			<DialogTitle>Connect with {need.userName}</DialogTitle>
					// 			<DialogDescription>Send a message to offer help with their need.</DialogDescription>
					// 		</DialogHeader>
					// 		<form onSubmit={handleConnect}>
					// 			<div className="grid gap-4 py-4">
					// 				<div className="grid gap-2">
					// 					<Label htmlFor="message">Your message</Label>
					// 					<Textarea
					// 						id="message"
					// 						placeholder="Hi, I'd like to help with your need..."
					// 						value={message}
					// 						onChange={(e) => setMessage(e.target.value)}
					// 						required
					// 					/>
					// 				</div>
					// 			</div>
					// 			<DialogFooter>
					// 				<Button type="submit">Send Message</Button>
					// 			</DialogFooter>
					// 		</form>
					// 	</DialogContent>
					// </Dialog>
				)}
				<Button variant="ghost" size="sm" onClick={()=>{}}>
					{need.fulfilled ? "Mark as Unfulfilled" : "Mark as Fulfilled"}
				</Button>
			</CardFooter>
		</Card>
	)
}

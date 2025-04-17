import { useState } from 'react'
import { Button } from '#app/components/ui/button'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card'
import { Label } from '#app/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#app/components/ui/select'
import { Textarea } from '#app/components/ui/textarea'
import { Link } from 'react-router'
//
//
// export async function loader({ params }: LoaderFunctionArgs) {
// 	// const user = await prisma.user.findFirst({
// 	// 	select: {
// 	// 		id: true,
// 	// 		name: true,
// 	// 		username: true,
// 	// 		createdAt: true,
// 	// 		image: { select: { id: true } },
// 	// 	},
// 	// 	where: {
// 	// 		username: params.username,
// 	// 	},
// 	// })
// 	//
// 	// invariantResponse(user, 'User not found', { status: 404 })
// 	//
// 	// return { user, userJoinedDisplay: user.createdAt.toLocaleDateString() }
// }
//
// export async function action({ request }: Route.ActionArgs) {
// 	const formData = await request.formData()
//
// }
//

export default function NewPrayerForm() {
	const [formData, setFormData] = useState({
		category: '',
		description: '',
	})
	//
	const handleSubmit = (e) => {
		e.preventDefault()
		if (formData.category && formData.description) {
			// onSubmit(formData)
		}
	}
	//
	const handleChange = (field, value) => {
		setFormData({ ...formData, [field]: value })
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Share a Prayer Request</CardTitle>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="category">Category</Label>
						<Select
							onValueChange={(value) => handleChange('category', value)}
							required
						>
							<SelectTrigger id="category">
								<SelectValue placeholder="Select a category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Health">Health</SelectItem>
								<SelectItem value="Family">Family</SelectItem>
								<SelectItem value="Work">Work</SelectItem>
								<SelectItem value="Guidance">Guidance</SelectItem>
								<SelectItem value="Relationships">Relationships</SelectItem>
								<SelectItem value="Financial">Financial</SelectItem>
								<SelectItem value="Spiritual">Spiritual</SelectItem>
								<SelectItem value="Other">Other</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Prayer Request</Label>
						<Textarea
							id="description"
							placeholder="Share your prayer request..."
							value={formData.description}
							onChange={(e) => handleChange('description', e.target.value)}
							required
							className="min-h-[100px]"
						/>
					</div>
				</CardContent>
				<CardFooter>
					<div className="flex gap-4">
						<Link to="../board" prefetch="intent">
							<Button variant="outline">Cancel</Button>
						</Link>

						<Button
							type="submit"
							disabled={!formData.category || !formData.description}
						>
							Share Prayer Request
						</Button>
					</div>
				</CardFooter>
			</form>
		</Card>
	)
}

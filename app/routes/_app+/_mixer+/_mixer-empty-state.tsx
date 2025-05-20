import { Link } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardDescription, CardFooter,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

export function MixerEmptyState() {
	// const router = useRouter()

	// This would be fetched from your API in a real implementation
	const hasJoined = false
	const hasMatches = true

	// If the user has joined and has matches, don't show the empty state
	if (hasJoined && hasMatches) return null

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
					<Icon name="users" className="h-6 w-6" />
				</div>
				<CardTitle className="text-center">{hasJoined ? "Waiting for a Match" : "Join the Church Mixer"}</CardTitle>
				<CardDescription className="text-center">
					{hasJoined
						? "We're working on finding the perfect match for you. You'll be notified when we find someone!"
						: "Connect with other church members through social activities like dinners, coffee, and more."}
				</CardDescription>
			</CardHeader>
			<CardContent className="text-center text-sm text-muted-foreground">
				{hasJoined
					? "This usually takes 1-2 days depending on availability and preferences."
					: "The Church Mixer helps build community by connecting members for meaningful social interactions."}
			</CardContent>
			<CardFooter className="flex justify-center">
				<Link to="/mixer/join" prefetch="intent">
					<Button>{hasJoined ? "Update Preferences" : "Join Mixer"}</Button>
				</Link>
			</CardFooter>
		</Card>
	)
}

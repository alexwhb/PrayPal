import { Button } from '#app/components/ui/button.tsx'
import { Link } from 'react-router'
import { Separator } from '#app/components/ui/separator.tsx'
import { Tabs, TabsList, TabsTrigger } from '#app/components/ui/tabs.tsx'
import { MixerEmptyState } from '#app/routes/_app+/_mixer+/_mixer-empty-state.tsx'
import { Suspense } from 'react'
import { MixerList } from '#app/routes/_app+/_mixer+/_mixer-list.tsx'
import { ProfileSummary } from '#app/routes/_app+/_mixer+/profile_summery.tsx'


export default function MixerIndex() {
	return (
		<div className="h-full">
			<div className="container mx-auto py-6 space-y-6">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<h1 className="text-3xl font-bold tracking-tight">Church Mixer</h1>
						<p className="text-muted-foreground">Connect with other church members through social activities</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" asChild>
							<Link to="/mixer/profiles">Manage Profiles</Link>
						</Button>
						<Button asChild>
							<Link to="/mixer/join">New Profile</Link>
						</Button>
					</div>
				</div>

				<Separator />
				<ProfileSummary />
				<Separator />


				<div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
					<Tabs defaultValue="matches" className="w-full md:w-auto">
						<TabsList>
							<TabsTrigger value="matches">New Matches</TabsTrigger>
							<TabsTrigger value="pending">Pending Plans</TabsTrigger>
							<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
							<TabsTrigger value="past">Past</TabsTrigger>
						</TabsList>
					</Tabs>
					{/* MixerFilters component would go here */}
				</div>

				<Suspense fallback={<div>Loading mixer activities...</div>}>
					<MixerList />
				</Suspense>

				{/* MixerList component would go here */}
				<MixerEmptyState />
			</div>
		</div>
	)
}
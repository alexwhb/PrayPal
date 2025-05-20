// import { ArrowRight, Gift, Heart, Users, InfoIcon, Coffee } from 'lucide-react'
import { Link, redirect } from 'react-router'
import { CTASection } from '#app/components/marketing/cta-section'
import { Alert, AlertDescription } from '#app/components/ui/alert'
import { Button } from '#app/components/ui/button'
import { getUserId } from '#app/utils/auth.server.ts'
import { type Route } from './+types/index'
import { Icon } from '#app/components/ui/icon.tsx'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await getUserId(request)

	// if we have a logged in user... redirect them to the app.
	if (userId) {
		return redirect('/prayer/board')
	}

	return {
		isInviteOnly: process.env.REGISTRATION_MODE === 'referral-only',
	}
}

export const meta: Route.MetaFunction = () => [{ title: 'PrayPal' }]

export default function LandingPage({ loaderData }: Route.ComponentProps) {
	return (
		<div className="flex min-h-screen flex-col">
			{/* Hero Section */}
			<section className="from-primary/10 to-background relative bg-gradient-to-b py-20 md:py-32">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center space-y-4 text-center">
						<div className="space-y-2">
							<h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
								Welcome to PrayPal
							</h1>
							<p className="text-muted-foreground mx-auto max-w-[700px] md:text-xl">
								A community platform where church members can help each other
								through sharing needs, resources, and support.
							</p>
						</div>
						<div className="flex flex-col gap-4 sm:flex-row">
							{loaderData.isInviteOnly ? (
								<div className="max-w-[500px]">
									<Alert>
										<Icon name="info" className="h-4 w-4" />
										<AlertDescription>
											PrayPal is currently invite-only. If you know someone
											who's already a member, please ask them to generate an
											invite link for you.
										</AlertDescription>
									</Alert>
									<div className="mt-4">
										<Link to="/login" prefetch="intent">
											<Button size="lg">Log In</Button>
										</Link>
									</div>
								</div>
							) : (
								<>
									<Link to="/signup" prefetch="intent">
										<Button size="lg">
											Sign Up <Icon name="arrow-right" className="mr-2 h-4 w-4" />
										</Button>
									</Link>
									<Link to="/login" prefetch="intent">
										<Button variant="outline" size="lg">
											Log In
										</Button>
									</Link>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Decorative image */}
				<div className="absolute inset-0 -z-10 overflow-hidden">
					<div className="bg-background/80 absolute inset-0" />
					<img
						src="/placeholder.svg?height=1080&width=1920"
						alt=""
						className="h-full w-full object-cover opacity-20"
						aria-hidden="true"
					/>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-16 md:py-24">
				<div className="container px-4 md:px-6">
					<div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
						<div className="flex flex-col items-center space-y-4 text-center">
							<div className="bg-primary/10 rounded-full p-4">
								<Icon name="heart" className="h-6 w-6 text-primary" />
							</div>
							<div className="space-y-2">
								<h3 className="text-xl font-bold">Community Needs Board</h3>
								<p className="text-muted-foreground">
									Post your needs or offer help to others in your community.
									From childcare to home repairs, connect with members in your
									church who can help.
								</p>
							</div>
						</div>
						<div className="flex flex-col items-center space-y-4 text-center">
							<div className="bg-primary/10 rounded-full p-4">
								<Icon name="gift" className="h-6 w-6 text-primary" />
							</div>
							<div className="space-y-2">
								<h3 className="text-xl font-bold">Free Share Board</h3>
								<p className="text-muted-foreground">
									Give away items you no longer need or find things you're
									looking for. Or share things that you don't actively use with
									others.
								</p>
							</div>
						</div>
						<div className="flex flex-col items-center space-y-4 text-center">
							<div className="bg-primary/10 rounded-full p-4">
								<Icon name="users" className="h-6 w-6 text-primary" />
							</div>
							<div className="space-y-2">
								<h3 className="text-xl font-bold">Group Finder</h3>
								<p className="text-muted-foreground">
									Find or create local groups, from book clubs to volunteer
									organizations.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="bg-muted py-16 md:py-24">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-4 text-center">
						<div className="space-y-2">
							<h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
								How It Works
							</h2>
							<p className="text-muted-foreground mx-auto max-w-[700px]">
								Careborhood makes it easy to connect with your community and
								share resources.
							</p>
						</div>
					</div>
					<div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 md:gap-12">
						<div className="flex flex-col items-center space-y-4 text-center">
							<div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold">
								1
							</div>
							<div className="space-y-2">
								<h3 className="text-xl font-bold">Create an Account</h3>
								<p className="text-muted-foreground">
									Sign up with your email and create your community profile.
								</p>
							</div>
						</div>
						<div className="flex flex-col items-center space-y-4 text-center">
							<div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold">
								2
							</div>
							<div className="space-y-2">
								<h3 className="text-xl font-bold">Connect with Neighbors</h3>
								<p className="text-muted-foreground">
									Browse the member directory and connect with people in your
									area.
								</p>
							</div>
						</div>
						<div className="flex flex-col items-center space-y-4 text-center">
							<div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold">
								3
							</div>
							<div className="space-y-2">
								<h3 className="text-xl font-bold">Share & Receive Help</h3>
								<p className="text-muted-foreground">
									Post your needs, offer your skills, or share items with
									others.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="py-16 md:py-24">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-4 text-center">
						<div className="space-y-2">
							<h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
								What Our Community Says
							</h2>
							<p className="text-muted-foreground mx-auto max-w-[700px]">
								Hear from members who have experienced the power of community
								through Careborhood.
							</p>
						</div>
					</div>
					<div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:gap-12">
						<div className="bg-card rounded-lg border p-6 shadow-sm">
							<div className="space-y-4">
								<p className="text-muted-foreground">
									"When my car broke down, I posted on the needs board and a
									neighbor offered to drive me to work for a week. Careborhood
									helped me when I needed it most."
								</p>
								<div className="flex items-center space-x-4">
									<div className="bg-primary/10 rounded-full p-1">
										<span className="text-primary text-lg font-semibold">
											SM
										</span>
									</div>
									<div>
										<p className="text-sm font-medium">Sarah M.</p>
										<p className="text-muted-foreground text-xs">
											Community Member
										</p>
									</div>
								</div>
							</div>
						</div>
						<div className="bg-card rounded-lg border p-6 shadow-sm">
							<div className="space-y-4">
								<p className="text-muted-foreground">
									"I've given away furniture, clothes, and toys that were just
									collecting dust. It feels great knowing these items are
									helping my neighbors instead of ending up in a landfill."
								</p>
								<div className="flex items-center space-x-4">
									<div className="bg-primary/10 rounded-full p-1">
										<span className="text-primary text-lg font-semibold">
											JT
										</span>
									</div>
									<div>
										<p className="text-sm font-medium">James T.</p>
										<p className="text-muted-foreground text-xs">
											Community Member
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section - only show if not invite only */}
			{!loaderData.isInviteOnly && <CTASection />}

			{/* Footer */}
			<footer className="border-t py-6 md:py-8">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-4 text-center">
						<div className="flex items-center space-x-1">
							<Icon name="heart" className="h-6 w-6" />
							<span className="text-lg font-bold">PrayPal</span>
						</div>
						<p className="text-muted-foreground text-sm">
							© {new Date().getFullYear()} PrayPal. All rights reserved.
						</p>
						{/* Buy Me a Coffee section */}
						<div className="flex items-center justify-center pt-2">
							<Button asChild variant="outline" size="sm" className="gap-2">
								<a
									href="https://www.buymeacoffee.com/alex.black"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center"
								>
									<Icon name="coffee" className="h-4 w-4" />
									<span>Buy Me a Coffee</span>
								</a>
							</Button>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}

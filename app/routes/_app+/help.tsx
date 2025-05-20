import { data, Link } from 'react-router'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '#app/components/ui/accordion'
import { Button } from '#app/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card'
import { Icon } from '#app/components/ui/icon.tsx'
import { Separator } from '#app/components/ui/separator'
import { prisma } from '#app/utils/db.server'
import { type Route } from './+types/help'

export async function loader() {
	const faqs = await prisma.helpFAQ.findMany({
		where: { active: true },
		orderBy: [{ category: 'asc' }, { order: 'asc' }],
	})

	// Group FAQs by category
	const faqsByCategory = faqs.reduce(
		(acc, faq) => {
			if (!acc[faq.category]) {
				acc[faq.category] = []
			}
			acc[faq.category].push(faq)
			return acc
		},
		{} as Record<string, typeof faqs>,
	)

	return data({ faqsByCategory })
}

export default function HelpPage({ loaderData }: Route.ComponentProps) {
	const { faqsByCategory } = loaderData

	return (
		<div className="container mx-auto max-w-4xl py-8">
			<h1 className="mb-8 text-center text-3xl font-bold">Help Center</h1>

			{/* FAQ Section */}
			<section className="mb-16">
				<h2 className="mb-6 text-2xl font-semibold">
					Frequently Asked Questions
				</h2>

				{Object.entries(faqsByCategory).map(([category, faqs]) => (
					<div key={category} className="mb-8">
						<h3 className="mb-4 text-xl font-semibold">{category}</h3>
						<Accordion type="single" collapsible className="w-full">
							{faqs.map((faq) => (
								<AccordionItem key={faq.id} value={faq.id}>
									<AccordionTrigger className="text-left">
										{faq.question}
									</AccordionTrigger>
									<AccordionContent>
										<div className="prose prose-sm dark:prose-invert max-w-none">
											{faq.answer}
										</div>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				))}
			</section>

			{/* Feedback Section */}
			<section className="mb-8">
				<Card>
					<CardHeader>
						<CardTitle>Need More Help?</CardTitle>
						<CardDescription>
							Have a question, found a bug, or want to suggest a feature?
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p>
							This project is open source and maintained by the community. If
							you've found a bug, have a feature request, or need help with
							something not covered in the FAQs, please consider opening an
							issue on GitHub.
						</p>

						<div className="space-y-2">
							<h4 className="font-medium">How to report an issue:</h4>
							<ol className="list-decimal space-y-1 pl-5">
								<li>Visit our GitHub repository</li>
								<li>Click on the "Issues" tab</li>
								<li>Click "New Issue" and select the appropriate template</li>
								<li>
									Fill in the details with as much information as possible
								</li>
								<li>Submit the issue</li>
							</ol>
						</div>

						<div className="flex flex-col gap-4 pt-4 sm:flex-row">
							<Button asChild className="flex-1">
								<a
									href="https://github.com/alexwhb/praypal/issues/new?template=bug_report.md"
									target="_blank"
									rel="noopener noreferrer"
								>
									Report a Bug
								</a>
							</Button>
							<Button asChild variant="outline" className="flex-1">
								<a
									href="https://github.com/alexwhb/praypal/issues/new?template=feature_request.md"
									target="_blank"
									rel="noopener noreferrer"
								>
									Request a Feature
								</a>
							</Button>
						</div>
					</CardContent>
				</Card>
			</section>

			{/* Community Support Section */}
			<section className="mb-12">
				<Card>
					<CardHeader>
						<CardTitle>Community Support</CardTitle>
						<CardDescription>
							Connect with other users and get help from the community
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p>
							Our community is active and helpful. You can also find support
							through these channels:
						</p>

						<div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
							<Button asChild variant="outline">
								<Link to="/prayer/board">Prayer Board</Link>
							</Button>
							<Button asChild variant="outline">
								<Link to="/needs/board">Community Needs</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</section>

			{/* Support the Project Section */}
			<Separator className="my-8" />

			<section className="text-center">
				<h2 className="mb-4 text-xl font-semibold">Support the Project</h2>
				<p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
					PrayPal is a free, open-source project maintained by Alex Black. If
					you find it useful, please consider supporting the development with a
					donation.
				</p>

				<div className="flex justify-center">
					<Button asChild variant="default" className="gap-2">
						<a
							href="https://www.buymeacoffee.com/alex.black"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center"
						>
							<Icon name="heart" className="h-4 w-4" />
							<span>Buy Me a Coffee</span>
						</a>
					</Button>
				</div>

				<div className="mt-8 flex items-center justify-center text-sm text-muted-foreground">
					<Icon name="heart" className="mr-2 h-4 w-4 text-red-500" />

					<span>Thank you for your support!</span>
				</div>
			</section>
		</div>
	)
}

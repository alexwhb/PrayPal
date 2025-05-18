import { type ModerationType, type ModeratorAction } from '@prisma/client'
import { data, Form, Link, useLoaderData } from 'react-router'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Alert, AlertDescription } from '#app/components/ui/alert.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '#app/components/ui/card.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#app/components/ui/select.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { formatDate } from '#app/utils/formatter.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { type Route } from './+types/admin.moderation.ts'

export async function loader({ params, request }: Route.LoaderArgs) {
	// await requireUserWithRole(request, ['admin', 'moderator'])
	const reportId = params.reportId

	const report = await prisma.report.findUnique({
		where: { id: reportId },
		include: {
			reportedBy: { select: { id: true, name: true, username: true } },
		},
	})

	if (!report) {
		throw new Response('Report not found', { status: 404 })
	}

	// Get the reported item based on type
	let reportedItem = null
	switch (report.itemType) {
		case 'PRAYER':
		case 'NEED':
			reportedItem = await prisma.request.findUnique({
				where: { id: report.itemId },
				include: {
					user: { select: { id: true, name: true, username: true } },
					category: true,
				},
			})
			break
		case 'GROUP':
			reportedItem = await prisma.group.findUnique({
				where: { id: report.itemId },
				include: {
					memberships: {
						where: { role: 'LEADER' },
						include: {
							user: { select: { id: true, name: true, username: true } },
						},
					},
					category: true,
				},
			})
			break
		// Add other cases as needed
	}

	return data({ report, reportedItem })
}

export async function action({ request }: { request: Request }) {
	const userId = await requireUserWithRole(request, ['admin', 'moderator'])
	const formData = await request.formData()

	const reportId = formData.get('reportId') as string
	const action = formData.get('_action') as ModeratorAction
	const itemId = formData.get('itemId') as string
	const itemType = formData.get('itemType') as ModerationType
	const reason = formData.get('reason') as string

	// Create moderation log
	await prisma.moderationLog.create({
		data: {
			moderatorId: userId,
			itemId,
			itemType,
			action,
			reason,
			report: {
				connect: { id: reportId }
			}
		},
	})

	// Update report status
	await prisma.report.update({
		where: { id: reportId },
		data: {
			status: 'RESOLVED',
			resolution: reason,
			resolvedById: userId,
			resolvedAt: new Date(),
		},
	})

	const ACTION_HANDLERS = {
		DELETE: {
			PRAYER: (id: string) => prisma.request.delete({ where: { id } }),
			NEED: (id: string) => prisma.request.delete({ where: { id } }),
			GROUP: (id: string) => prisma.group.update({ where: { id }, data: { active: false } }),
			SHARE_ITEM: (id: string) => prisma.shareItem.delete({ where: { id } }),
			USER: (id: string) => prisma.user.delete({ where: { id } }),
			MESSAGE: (id: string) => prisma.message.delete({ where: { id } }),
		},
		// ... other handlers
	} as const

	const handler = ACTION_HANDLERS[action]?.[itemType]
	if (handler) {
		await handler(itemId)
	}

	return data({ success: true })
}

function ReportDetails({ report }: { report: any }) {
	return (
		<Card className="mb-6">
			<CardHeader>
				<CardTitle>Report Details</CardTitle>
				<CardDescription>
					Reported on {formatDate(report.createdAt)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div>
						<span className="font-medium">Reported By:</span>{' '}
						<Link to={`/users/${report.reportedBy.username}`} className="hover:underline">
							{report.reportedBy.name}
						</Link>
					</div>
					<div>
						<span className="font-medium">Reason:</span>{' '}
						<Badge>{report.reason}</Badge>
					</div>
					{report.description && (
						<div>
							<span className="font-medium">Description:</span>
							<p className="mt-1 whitespace-pre-wrap text-muted-foreground">
								{report.description}
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}

export default function ReviewReport() {
	const { report, reportedItem } = useLoaderData<typeof loader>()

	return (
		<div className="container mx-auto py-8 max-w-3xl">
			<div className="mb-4">
				<Link to="/admin/moderation" className="text-sm font-medium text-primary hover:underline">
					← Back to Moderation Dashboard
				</Link>
			</div>

			<h1 className="mb-6 text-3xl font-bold">Review Reported Content</h1>

			<ReportDetails report={report} />

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Take Action</CardTitle>
					<CardDescription>
						Choose how to handle this report
					</CardDescription>
				</CardHeader>
				<Form method="post">
					<CardContent>
						<input type="hidden" name="reportId" value={report.id} />
						<input type="hidden" name="itemId" value={report.itemId} />
						<input type="hidden" name="itemType" value={report.itemType} />

						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="action">Action</Label>
								<Select name="_action" required>
									<SelectTrigger id="action">
										<SelectValue placeholder="Select an action" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="DELETE">Delete content</SelectItem>
										<SelectItem value="HIDE">Hide content</SelectItem>
										<SelectItem value="FLAG">Flag content</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="reason">Resolution</Label>
								<Textarea
									id="reason"
									name="reason"
									placeholder="Explain the action taken"
									rows={3}
									required
								/>
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button type="submit" variant="default">
							Submit Decision
						</Button>
						<Form method="post">
							<input type="hidden" name="_action" value="dismissReport" />
							<input type="hidden" name="reportId" value={report.id} />
							<Button type="submit" variant="outline">
								Dismiss Report
							</Button>
						</Form>
					</CardFooter>
				</Form>
			</Card>

			{!reportedItem && (
				<Alert variant="destructive">
					<Icon name="alert-circle" className="h-4 w-4" />
					<AlertDescription>
						The reported content could not be found. It may have been already deleted.
					</AlertDescription>
				</Alert>
			)}

			{reportedItem && (
				<Card>
					<CardHeader>
						<CardTitle>Reported Content</CardTitle>
					</CardHeader>
					<CardContent>
						{/* Render the reported content based on its type */}
						{/* This would be similar to the rendering logic in admin.mod.details.$logId.tsx */}
					</CardContent>
				</Card>
			)}
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
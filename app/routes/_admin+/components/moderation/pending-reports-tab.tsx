import { type ModerationType } from '@prisma/client'
import { Form, Link } from 'react-router'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table.tsx'
import { formatDate } from '#app/utils/formatter.ts'
import { getItemTypeLabel } from '../../admin.moderation.tsx'

type PendingReport = {
	id: string
	itemType: string
	reportedBy: {
		username: string
		name: string
	}
	reason: string
	description?: string
	createdAt: Date
}

export function PendingReportsTab({
	pendingReports,
}: {
	pendingReports: PendingReport[]
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Pending Reports</CardTitle>
				<CardDescription>
					Review and take action on reported content
				</CardDescription>
			</CardHeader>
			<CardContent>
				{pendingReports.length === 0 ? (
					<p className="py-4 text-center text-muted-foreground">
						No pending reports to review
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Reported By</TableHead>
								<TableHead>Reason</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pendingReports.map((report) => (
								<TableRow key={report.id}>
									<TableCell>
										<Badge variant="outline">
											{getItemTypeLabel(report.itemType as ModerationType)}
										</Badge>
									</TableCell>
									<TableCell>
										<Link
											to={`/users/${report.reportedBy.username}`}
											className="hover:underline"
										>
											{report.reportedBy.name}
										</Link>
									</TableCell>
									<TableCell>
										<Badge>{report.reason}</Badge>
									</TableCell>
									<TableCell>{formatDate(report.createdAt)}</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Link
												to={`/admin/moder/review/${report.id}`}
												className="text-sm font-medium text-primary hover:underline"
											>
												<Button size="sm">Review</Button>
											</Link>
											<Form method="post">
												<input
													type="hidden"
													name="_action"
													value="dismissReport"
												/>
												<input
													type="hidden"
													name="reportId"
													value={report.id}
												/>
												<Button size="sm" variant="outline">
													Dismiss
												</Button>
											</Form>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	)
}

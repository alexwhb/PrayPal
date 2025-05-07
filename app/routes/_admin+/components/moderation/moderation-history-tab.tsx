import { type ModerationType, type ModeratorAction } from '@prisma/client'
import { Link } from 'react-router'
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
import { getItemTypeLabel, getActionLabel } from '../../admin.moderation.tsx'

type ModerationLog = {
    id: string
    moderator: {
        username: string
        name: string
    }
    action: ModeratorAction
    itemType: ModerationType
    reason: string
    createdAt: Date
}

export function ModerationHistoryTab({ moderationLogs }: { moderationLogs: ModerationLog[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Moderation History</CardTitle>
                <CardDescription>View past moderation actions</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Moderator</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Item Type</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {moderationLogs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>
                                    <Link
                                        to={`/users/${log.moderator.username}`}
                                        className="hover:underline"
                                    >
                                        {log.moderator.name}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            log.action === 'DELETE'
                                                ? 'destructive'
                                                : log.action === 'RESTORE'
                                                    ? 'default'
                                                    : 'outline'
                                        }
                                    >
                                        {getActionLabel(log.action)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {getItemTypeLabel(log.itemType)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {log.reason || 'No reason provided'}
                                </TableCell>
                                <TableCell>{formatDate(log.createdAt)}</TableCell>
                                <TableCell>
                                    <Link
                                        to={`/admin/mod/details/${log.id}`}
                                        className="text-sm font-medium text-primary hover:underline"
                                    >
                                        <Button size="sm" variant="outline">
                                            View Details
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
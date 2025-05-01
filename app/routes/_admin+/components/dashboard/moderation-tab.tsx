import { Flag, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#app/components/ui/card.tsx'

type ModerationTabProps = {
  metrics: {
    pendingReports: number
    moderationActions: number
  }
}

export function ModerationTab({ metrics }: ModerationTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingReports}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting moderation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderation Actions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.moderationActions}</div>
            <p className="text-xs text-muted-foreground">
              Actions taken in selected period
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moderation Activity</CardTitle>
          <CardDescription>
            Recent moderation actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="font-medium">Action</div>
              <div className="font-medium">Date</div>
            </div>
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Link to="/admin/moderation" className="text-primary hover:underline">
                View all moderation actions
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
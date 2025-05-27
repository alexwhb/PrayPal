import {Icon} from '#app/components/ui/icon.tsx'
import { BarChart } from '#app/components/admin/charts.tsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#app/components/ui/card.tsx'

type CommunityTabProps = {
  metrics: {
    totalGroups: number
    newGroups: number
    newShareItems: number
    claimedShareItems: number
    activeUsers: number
    engagementRate: number
  }
  activityData: Array<{
    name: string
    prayers: number
    needs: number
    shares: number
  }>
}

export function CommunityTab({ metrics, activityData }: CommunityTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
						<Icon name="users" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalGroups}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.newGroups} new in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Items</CardTitle>
						<Icon name="trending-up" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newShareItems}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.claimedShareItems} claimed in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Engagement</CardTitle>
						<Icon name="check-circle" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.engagementRate.toFixed(1)}% engagement rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Community Growth</CardTitle>
          <CardDescription>
            New users and groups over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={activityData}
            categories={['prayers', 'needs', 'shares']}
            index="name"
            valueFormatter={(value) => `${value}`}
            className="h-[300px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}
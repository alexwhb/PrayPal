import { LineChart, PieChart as PieChartComponent } from '#app/components/admin/charts.tsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#app/components/ui/card.tsx'
import {Icon} from '#app/components/ui/icon.tsx'

// components/dashboard/overview-tab.tsx
// Update the component props type
type OverviewTabProps = {
  metrics: {
    totalUsers: number
    newUsers: number
    newPrayers: number
    answeredPrayers: number
    newNeeds: number
    fulfilledNeeds: number
    messagesSent: number
  }
  activityData: Array<{
    name: string
    prayers: number
    needs: number
    shares: number
  }>
	selectedCategory: string
  categoryData: Array<{
    name: string
    value: number
  }>
}

export function OverviewTab({ selectedCategory, metrics, activityData, categoryData }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
						<Icon name="users" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.newUsers} new in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prayer Requests</CardTitle>
						<Icon name="message-circle" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newPrayers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.answeredPrayers} answered in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Posted</CardTitle>
						<Icon name="flag" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newNeeds}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.fulfilledNeeds} fulfilled in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
						<Icon name="message-circle" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.messagesSent}</div>
            <p className="text-xs text-muted-foreground">
              Community engagement
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>
              Posts across different boards over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <LineChart
              data={activityData}
              categories={['prayers', 'needs', 'shares']}
              index="name"
              valueFormatter={(value) => `${value} posts`}
            />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Prayer Categories</CardTitle>
            <CardDescription>
              Distribution of prayer requests by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PieChartComponent
              data={categoryData}
              index="name"
              categories={['value']}
							categoryName={selectedCategory}
              valueFormatter={(value) => `${value} prayers`}
              className="h-[300px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
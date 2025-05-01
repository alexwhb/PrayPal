import { format, subDays } from 'date-fns'
import { Users, MessageCircle, Flag, CheckCircle2, PieChart, BarChart3, TrendingUp } from 'lucide-react'
import { useCallback } from 'react'
import { data, Link, useLoaderData, useNavigate } from 'react-router'
import { BarChart, LineChart, PieChart as PieChartComponent } from '#app/components/charts.tsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#app/components/ui/card.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#app/components/ui/tabs.tsx'
import { prisma } from '#app/utils/db.server.ts'
// import { DateRangePicker } from '#app/components/date-range-picker.tsx'
import { type Route } from './+types/admin.dashboard.ts'

export async function loader({ request }: Route.LoaderArgs) {
	// Ensure only admins/moderators can access this page
	// await requireUserWithRole(request, ['admin', 'moderator'])

	const url = new URL(request.url)
	const startDateParam = url.searchParams.get('startDate')
	const endDateParam = url.searchParams.get('endDate')

	// Default to today if no dates provided
	const endDate = endDateParam ? new Date(endDateParam) : new Date()
	const startDate = startDateParam ? new Date(startDateParam) : subDays(endDate, 7)

	// Set time to beginning/end of day
	startDate.setHours(0, 0, 0, 0)
	endDate.setHours(23, 59, 59, 999)

	// Get total user count
	const totalUsers = await prisma.user.count()

	// Get new users in date range
	const newUsers = await prisma.user.count({
		where: {
			createdAt: {
				gte: startDate,
				lte: endDate
			}
		}
	})

	// Prayer metrics
	const newPrayers = await prisma.request.count({
		where: {
			type: 'PRAYER',
			createdAt: {
				gte: startDate,
				lte: endDate
			}
		}
	})

	const answeredPrayers = await prisma.request.count({
		where: {
			type: 'PRAYER',
			fulfilled: true,
			fulfilledAt: {
				gte: startDate,
				lte: endDate
			}
		}
	})

	// Need metrics
	const newNeeds = await prisma.request.count({
		where: {
			type: 'NEED',
			createdAt: {
				gte: startDate,
				lte: endDate
			}
		}
	})

	const fulfilledNeeds = await prisma.request.count({
		where: {
			type: 'NEED',
			fulfilled: true,
			fulfilledAt: {
				gte: startDate,
				lte: endDate
			}
		}
	})

	// Share metrics
	const newShareItems = await prisma.shareItem.count({
		where: {
			createdAt: {
				gte: startDate,
				lte: endDate
			}
		}
	})

	const claimedShareItems = await prisma.shareItem.count({
		where: {
			claimed: true,
			updatedAt: {
				gte: startDate,
				lte: endDate
			}
		}
	})

	// Group metrics
	const newGroups = await prisma.group.count({
		where: {
			createdAt: {
				gte: startDate,
				lte: endDate
			}
		}
	})

	const totalGroups = await prisma.group.count()

	// Message metrics
	const messagesSent = await prisma.message.count({
		where: {
			createdAt: {
				gte: startDate,
				lte: endDate
			}
		}
	})

	// Moderation metrics
	const pendingReports = await prisma.report.count({
		where: {
			status: 'PENDING'
		}
	})

	const moderationActions = await prisma.moderationLog.count({
		where: {
			createdAt: {
				gte: startDate,
				lte: endDate
			}
		}
	})

	// Get activity over time (last 7 days)
	const last7Days = Array.from({ length: 7 }, (_, i) => {
		const date = subDays(new Date(), i)
		date.setHours(0, 0, 0, 0)
		return date
	}).reverse()

	const activityData = await Promise.all(
		last7Days.map(async (day) => {
			const nextDay = new Date(day)
			nextDay.setDate(day.getDate() + 1)

			const prayers = await prisma.request.count({
				where: {
					type: 'PRAYER',
					createdAt: {
						gte: day,
						lt: nextDay
					}
				}
			})

			const needs = await prisma.request.count({
				where: {
					type: 'NEED',
					createdAt: {
						gte: day,
						lt: nextDay
					}
				}
			})

			const shares = await prisma.shareItem.count({
				where: {
					createdAt: {
						gte: day,
						lt: nextDay
					}
				}
			})

			return {
				name: format(day, 'MMM dd'),
				prayers,
				needs,
				shares
			}
		})
	)

	// Get category distribution
	const prayerCategories = await prisma.request.groupBy({
		by: ['categoryId'],
		where: {
			type: 'PRAYER',
			createdAt: {
				gte: startDate,
				lte: endDate
			}
		},
		_count: true
	})

	const categoryNames = await prisma.category.findMany({
		where: {
			id: {
				in: prayerCategories.map(c => c.categoryId)
			}
		},
		select: {
			id: true,
			name: true
		}
	})

	const categoryMap = new Map(categoryNames.map(c => [c.id, c.name]))

	const prayerCategoryData = prayerCategories.map(category => ({
		name: categoryMap.get(category.categoryId) || 'Unknown',
		value: category._count
	}))

	// Get user engagement data
	const userEngagement = await prisma.user.findMany({
		where: {
			createdAt: {
				lte: endDate
			}
		},
		select: {
			id: true,
			_count: {
				select: {
					requests: {
						where: {
							createdAt: {
								gte: startDate,
								lte: endDate
							}
						}
					},
					messagesSent: {
						where: {
							createdAt: {
								gte: startDate,
								lte: endDate
							}
						}
					},
					groupMemberships: {
						where: {
							joinedAt: {
								gte: startDate,
								lte: endDate
							}
						}
					}
				}
			}
		},
		take: 100 // Limit to prevent performance issues
	})

	// Calculate engagement metrics
	const activeUsers = userEngagement.filter(user =>
		user._count.requests > 0 ||
		user._count.messagesSent > 0 ||
		user._count.groupMemberships > 0
	).length

	const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0

	return data({
		metrics: {
			totalUsers,
			newUsers,
			activeUsers,
			engagementRate,
			newPrayers,
			answeredPrayers,
			newNeeds,
			fulfilledNeeds,
			newShareItems,
			claimedShareItems,
			newGroups,
			totalGroups,
			messagesSent,
			pendingReports,
			moderationActions
		},
		activityData,
		prayerCategoryData,
		dateRange: {
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString()
		}
	})
}

export default function Dashboard() {
	const { metrics, activityData, prayerCategoryData, dateRange } = useLoaderData<typeof loader>()
	const navigate = useNavigate()

	const handleDateRangeChange = useCallback((start: Date, end: Date) => {
		const url = new URL(window.location.href)
		url.searchParams.set('startDate', start.toISOString())
		url.searchParams.set('endDate', end.toISOString())
		navigate(url.toString())
	}, [navigate])

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">Dashboard</h1>

					{/*<DateRangePicker*/}
					{/*	startDate={new Date(dateRange.startDate)}*/}
					{/*	endDate={new Date(dateRange.endDate)}*/}
					{/*	onDateRangeChange={handleDateRangeChange}*/}
					{/*/>*/}
				</div>

				<Tabs defaultValue="overview" className="space-y-4">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="community">Community</TabsTrigger>
						<TabsTrigger value="moderation">Moderation</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">Total Members</CardTitle>
									<Users className="h-4 w-4 text-muted-foreground" />
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
									<MessageCircle className="h-4 w-4 text-muted-foreground" />
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
									<Flag className="h-4 w-4 text-muted-foreground" />
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
									<MessageCircle className="h-4 w-4 text-muted-foreground" />
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
										colors={['#2563eb', '#16a34a', '#d97706']}
										valueFormatter={(value) => `${value} posts`}
										className="h-[300px]"
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
										data={prayerCategoryData}
										index="name"
										categories={['value']}
										colors={['#2563eb', '#16a34a', '#d97706', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']}
										valueFormatter={(value) => `${value} prayers`}
										className="h-[300px]"
									/>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value="community" className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">Total Groups</CardTitle>
									<Users className="h-4 w-4 text-muted-foreground" />
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
									<TrendingUp className="h-4 w-4 text-muted-foreground" />
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
									<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
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
									colors={['#2563eb', '#16a34a', '#d97706']}
									valueFormatter={(value) => `${value}`}
									className="h-[300px]"
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="moderation" className="space-y-4">
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
					</TabsContent>
				</Tabs>
			</div>
		</main>
	)
}
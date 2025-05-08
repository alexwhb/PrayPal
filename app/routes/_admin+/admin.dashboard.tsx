import { format, subDays } from 'date-fns'
import { useCallback } from 'react'
import { data, useLoaderData, useNavigate } from 'react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#app/components/ui/tabs.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/admin.dashboard.ts'
import { CommunityTab } from './components/dashboard/community-tab.tsx'
import { ModerationTab } from './components/dashboard/moderation-tab.tsx'
import { OverviewTab } from './components/dashboard/overview-tab.tsx'

export async function loader({ request }: Route.LoaderArgs) {
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

	// Get new users in the date range
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
					sentMessages: { // Changed from messagesSent to sentMessages
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
		user._count.sentMessages > 0 || // Changed from messagesSent to sentMessages
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

					<TabsContent value="overview">
						<OverviewTab metrics={metrics} activityData={activityData} prayerCategoryData={prayerCategoryData} />
					</TabsContent>

					<TabsContent value="community">
						<CommunityTab metrics={metrics} activityData={activityData} />
					</TabsContent>

					<TabsContent value="moderation">
						<ModerationTab metrics={metrics} />
					</TabsContent>
				</Tabs>
			</div>
		</main>
	)
}
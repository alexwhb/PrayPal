import { format, subDays } from 'date-fns'
import { useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { CategorySelector } from '#app/components/admin/category-selector.tsx'
import { DateRangePicker } from '#app/components/admin/date-range-picker.tsx'
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
  const categoryParam = url.searchParams.get('category')

  // Default to today if no dates provided
  const endDate = endDateParam ? new Date(endDateParam) : new Date()
  const startDate = startDateParam ? new Date(startDateParam) : subDays(endDate, 7)

  // Set time to beginning/end of day
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  // Create base filter with date range
  const dateFilter = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  // Get total user count
  const totalUsers = await prisma.user.count()

  // Get new users in the date range
  const newUsers = await prisma.user.count({
    where: {
      ...dateFilter
    }
  })

  // Prayer metrics
  const newPrayers = await prisma.request.count({
    where: {
      type: 'PRAYER',
      ...dateFilter
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
      ...dateFilter
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
      ...dateFilter
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
      ...dateFilter
    }
  })

  const totalGroups = await prisma.group.count()

  // Message metrics
  const messagesSent = await prisma.message.count({
    where: {
      ...dateFilter
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
      ...dateFilter
    }
  })


  // Instead of calculating activity for the last 7 days fixed
  // Get activity over the selected date range
  const getDaysInRange = (startDate: Date, endDate: Date) => {
    const days = [];
    let currentDate = new Date(startDate);
    
    // Ensure we have at least 7 data points or the actual number of days in the range
    const daysInRange = Math.max(7, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // If range is shorter than 7 days, we'll show some days before the start date to make it 7 days
    if (daysInRange === 7 && (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) < 7) {
      currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() - (7 - Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
    }
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const daysInRange = getDaysInRange(startDate, endDate);

  const activityData = await Promise.all(
    daysInRange.map(async (day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const dayFilter = {
        createdAt: {
          gte: day,
          lt: nextDay
        }
      };
      
      // If a category is selected, filter the activity data by category
      const prayerFilter = categoryParam && categoryParam !== 'all' && categoryParam === 'prayer' 
        ? { ...dayFilter } : { type: 'PRAYER', ...dayFilter };
        
      const needFilter = categoryParam && categoryParam !== 'all' && categoryParam === 'need' 
        ? { ...dayFilter } : { type: 'NEED', ...dayFilter };
        
      const shareFilter = categoryParam && categoryParam !== 'all' && categoryParam === 'share' 
        ? { ...dayFilter } : null; // Share items don't have a type field

      const prayers = await prisma.request.count({
        where: prayerFilter
      });

      const needs = await prisma.request.count({
        where: needFilter
      });

      const shares = shareFilter ? await prisma.shareItem.count({
        where: shareFilter
      }) : 0;

      return {
        name: format(day, 'MMM dd'),
        prayers: categoryParam && categoryParam !== 'all' && categoryParam !== 'prayer' ? 0 : prayers,
        needs: categoryParam && categoryParam !== 'all' && categoryParam !== 'need' ? 0 : needs,
        shares: categoryParam && categoryParam !== 'all' && categoryParam !== 'share' ? 0 : shares
      };
    })
  );


  const categoryNames = await prisma.category.findMany({
    select: {
      id: true,
      name: true
    }
  })

  // Get category distribution based on selected category type
  const getCategoryData = async () => {
    // Determine which model to query based on the category parameter
    if (categoryParam === 'share') {
      // Query ShareItem model for share categories
      const shareCategories = await prisma.shareItem.groupBy({
        by: ['categoryId'],
        _count: {
          _all: true
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // Map to standardized format with value property
      return shareCategories.map(cat => {
        const category = categoryNames.find(c => c.id === cat.categoryId);
        return {
          name: category ? category.name : 'Unknown',
          value: cat._count._all
        };
      });
      
    } else if (categoryParam === 'group') {
      // Query Group model for group categories
      const groupCategories = await prisma.group.groupBy({
        by: ['categoryId'],
        _count: {
          _all: true
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // Map to standardized format with value property
      return groupCategories.map(cat => {
        const category = categoryNames.find(c => c.id === cat.categoryId);
        return {
          name: category ? category.name : 'Unknown',
          value: cat._count._all
        };
      });
      
    } else {
      // For prayer and need, query the Request model
      // Use the correct RequestType enum value
      const requestType = categoryParam === 'need' ? 'NEED' : 'PRAYER';
      
      const requestCategories = await prisma.request.groupBy({
        by: ['categoryId'],
        _count: {
          _all: true
        },
        where: {
          type: requestType,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // Map to standardized format with value property
      return requestCategories.map(cat => {
        const category = categoryNames.find(c => c.id === cat.categoryId);
        return {
          name: category ? category.name : 'Unknown',
          value: cat._count._all
        };
      });
    }
  };

  const prayerCategoryData = await getCategoryData();

  return {
    metrics: {
      totalUsers,
      newUsers,
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
  }
}

const formattedSelectedCategory = [{ value: 'all', label: 'All Categories' }, { value: 'prayer', label: 'Prayers' }, { value: 'need', label: 'Needs' }, { value: 'share', label: 'Share Itemss' }];

export default function Dashboard({loaderData}: Route.ComponentProps) {
	const { metrics, activityData, prayerCategoryData, dateRange } = loaderData
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

	const selectedCategory = searchParams.get('category') || 'all'

	const selectedCategoryLabel =
		useMemo(() =>formattedSelectedCategory.find(cat => cat.value === selectedCategory)?.label || 'All Categories', [selectedCategory] )



	const handleDateRangeChange = useCallback((start: Date, end: Date) => {
		// Create a new URLSearchParams instance with current search params
		const newParams = new URLSearchParams(searchParams)

		// Update the date parameters
		newParams.set('startDate', start.toISOString())
		newParams.set('endDate', end.toISOString())

		// Set the new search params
		setSearchParams(newParams)
	}, [searchParams, setSearchParams])

	const handleCategoryChange = useCallback((category: string) => {
		// Create a new URLSearchParams instance with current search params
		const newParams = new URLSearchParams(searchParams)

		if (category !== 'all') {
			newParams.set('category', category)
		} else {
			newParams.delete('category')
		}

		// Set the new search params
		setSearchParams(newParams)
	}, [searchParams, setSearchParams])

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="flex flex-col space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">Dashboard</h1>

					<div className="flex gap-2">
						<CategorySelector
							value={selectedCategory}
							onChange={handleCategoryChange}
						/>
						<DateRangePicker
							startDate={new Date(dateRange.startDate)}
							endDate={new Date(dateRange.endDate)}
							onDateRangeChange={handleDateRangeChange}
						/>
					</div>
				</div>

				<Tabs defaultValue="overview" className="space-y-4">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						{/*<TabsTrigger value="community">Community</TabsTrigger>*/}
						<TabsTrigger value="moderation">Moderation</TabsTrigger>
					</TabsList>

					<TabsContent value="overview">
						<OverviewTab metrics={metrics} activityData={activityData} categoryData={prayerCategoryData} selectedCategory={selectedCategoryLabel} />
					</TabsContent>

					{/*<TabsContent value="community">*/}
					{/*	<CommunityTab metrics={metrics} activityData={activityData} />*/}
					{/*</TabsContent>*/}

					<TabsContent value="moderation">
						<ModerationTab metrics={metrics} />
					</TabsContent>
				</Tabs>
			</div>
		</main>
	)
}
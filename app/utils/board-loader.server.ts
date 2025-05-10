import { cachified } from '@epic-web/cachified'
import { cache } from '#app/utils/cache.server.ts'
import { PAGE_SIZE } from '#app/utils/consts.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { type RequestType } from '#app/utils/types.ts'

type BoardLoaderOptions = {
  type: RequestType
  includeFullfilled?: boolean
  transformResponse?: (data: any[], user: { roles: Array<{ name: string }> }) => any[]
  model: any // Prisma model
  where: Record<string, any>
  getCategoryWhere: () => { type: RequestType; active: boolean }
  select?: Record<string, any> // Add select option
}

type BoardQueryParams = {
  url: URL
  userId: string
}

export async function loadBoardData({ url, userId }: BoardQueryParams, options: BoardLoaderOptions) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      roles: {
        select: {
          name: true,
          permissions: true
        }
      }
    }
  })

  if (!user) throw new Error('User not found')

  // Extract query parameters
  const sort = url.searchParams.get('sort') === 'asc' ? 'asc' : 'desc'
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const filterParam = url.searchParams.get('filter')
  const activeFilter = filterParam && filterParam !== 'All' ? filterParam : null

	console.log(sort, page, filterParam, activeFilter)

  // Build the where clause by combining the base where with filters
  const where = {
    ...options.where,
    ...(activeFilter ? {
      category: {
        name: activeFilter,
      },
    } : {}),
  }

  const [items] = await prisma.$transaction([
    options.model.findMany({
      where,
      select: options.select || {
        id: true,
        user: { select: { id: true, name: true, image: true, username: true } },
        category: { select: { name: true } },
        description: true,
        createdAt: true,
        fulfilled: true,
        response: true,
      },
      orderBy: { createdAt: sort },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

	const totalCacheKey = `groups:total:${options.type}:filter:${activeFilter || 'All'}`;
	const total = await cachified({
		key: totalCacheKey,
		cache,
		getFreshValue: async () => {
			return options.model.count({ where });
		},
		ttl: 1000 * 60 * 5, // 5 minutes
	});


	const hasNextPage = total > page * PAGE_SIZE

  // Get categories using the provided getCategoryWhere function
	const filtersCacheKey = `categories:${options.type}`;
	const filters = await cachified({
		key: filtersCacheKey,
		cache,
		getFreshValue: async () => {
			const categories = await prisma.category.findMany({
				where: options.getCategoryWhere(),
				select: { name: true },
				orderBy: { name: 'asc' },
			});
			return [{ name: 'All' }, ...categories];
		},
		ttl: 1000 * 60 * 20, // 20 minutes
	});


  const transformedItems = options.transformResponse 
    ? options.transformResponse(items, user)
    : items

  return {
    items: transformedItems,
    filters,
    activeFilter: activeFilter || 'All',
    userId,
    hasNextPage,
    user,
    total,
    page
  }
}
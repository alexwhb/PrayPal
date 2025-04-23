import { PAGE_SIZE } from '#app/utils/consts.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { type RequestType } from '#app/utils/types.ts'
import { userHasRole } from '#app/utils/user.ts'

type BoardLoaderOptions = {
  type: RequestType
  includeFullfilled?: boolean
  transformResponse?: (data: any[], user: { roles: Array<{ name: string }> }) => any[]
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

  // Build the where clause dynamically
  const where: any = {
    type: options.type,
    status: 'ACTIVE',
  }

  if (options.includeFullfilled === false) {
    where.fulfilled = false
  }

  if (activeFilter) {
    where.category = {
      name: activeFilter,
    }
  }

  const [items, total] = await prisma.$transaction([
    prisma.request.findMany({
      where,
      select: {
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
    prisma.request.count({ where }),
  ])

  const hasNextPage = total > page * PAGE_SIZE

  let filters = await prisma.category.findMany({
    where: { type: options.type, active: true },
    select: { name: true },
  })

  filters = [{ name: 'All' }, ...filters]

  const transformedItems = options.transformResponse 
    ? options.transformResponse(items, user)
    : items

  return {
    items: transformedItems,
    filters,
    activeFilter: activeFilter || 'All',
    userId,
    hasNextPage,
    user // Return the user object instead of just roles
  }
}
import { useCallback } from 'react'
import { data, useSearchParams } from 'react-router'
import NeedsBoard from '#app/components/needs/needs-board.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/needs.board.ts'

const PAGE_SIZE = 30

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)

	// Extract query parameters.
	const sort = url.searchParams.get('sort') === 'asc' ? 'asc' : 'desc'
	const page = parseInt(url.searchParams.get('page') || '1', 10)
	const filterParam = url.searchParams.get('filter')
	const activeFilter = filterParam && filterParam !== 'All' ? filterParam : null

	// Build the where clause dynamically
	const where = {
		type: 'NEED',
		status: 'ACTIVE',
		fulfilled: false  // Only include unfulfilled needs, wo we don't have a bunch of noise on the board.
	} as any

	// Only add category filter if activeFilter is not null and not "All"
	if (activeFilter) {
		where.category = {
			name: activeFilter,
		}
	}

	const [needs, totalPrayers] = await prisma.$transaction([
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

	const hasNextPage = totalPrayers > page * PAGE_SIZE

	let filters = await prisma.category.findMany({
		where: { type: 'NEED', active: true },
		select: { name: true },
	})

	filters = [{ name: 'All' }, ...filters]

	// Return "All" as activeFilter when it's null
	return {
		needs,
		filters,
		activeFilter: activeFilter || 'All',
		userId,
		hasNextPage,
	}
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const prayerId = formData.get('prayerId')
	const action = formData.get('_action')

	if (action === 'delete') {
		// Handle delete prayer action
		await prisma.request.delete({ where: { id: prayerId as string } })
		return data({ success: true })
	}
}

export default function NeedsBoardPage({
	actionData,
	loaderData,
}: Route.ComponentProps) {
	const [searchParams] = useSearchParams()

	// Helper to generate URLs with updated search params
	const generateUrl = useCallback(
		(newParams: Record<string, string | number>) => {
			const params = new URLSearchParams(searchParams)
			Object.entries(newParams).forEach(([key, value]) => {
				if (value === undefined || value === null || value === '') {
					params.delete(key)
				} else {
					params.set(key, String(value))
				}
			})
			return `?${params.toString()}`
		},
		[searchParams],
	)

	// Generate URLs for different actions
	const getSortUrl = useCallback(() => {
		// we toggle our sort.
		const currentSort = searchParams.get('sort') === 'asc' ? 'asc' : 'desc'
		const newSort = currentSort === 'asc' ? 'desc' : 'asc'
		return generateUrl({ sort: newSort, page: 1 })
	}, [generateUrl, searchParams])

	const getFilterUrl = useCallback(
		(newFilter: string) => {
			return generateUrl({ filter: newFilter, page: 1 })
		},
		[generateUrl],
	)

	const getNextPageUrl = useCallback(() => {
		const currentPage = parseInt(searchParams.get('page') || '1', 10)
		return generateUrl({ page: currentPage + 1 })
	}, [generateUrl, searchParams])

	return (
		<NeedsBoard
			loaderData={loaderData}
			actionData={actionData}
			getFilterUrl={getFilterUrl}
			getSortUrl={getSortUrl}
			getNextPageUrl={getNextPageUrl}
		/>
	)
}

import { useCallback } from 'react'
import { data, useSearchParams } from 'react-router'
import PrayerBoard from '#app/components/prayer/prayer-board.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/prayer.board.ts'

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
		type: 'PRAYER',
		status: 'ACTIVE',
	} as any

	// Only add category filter if activeFilter is not null and not "All"
	if (activeFilter) {
		where.category = {
			name: activeFilter,
		}
	}

	const [prayerData, totalPrayers] = await prisma.$transaction([
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
		where: { type: 'PRAYER', active: true },
		select: { name: true },
	})

	filters = [{ name: 'All' }, ...filters]

	const prayers = prayerData.map((data) => ({
		answered: data.fulfilled,
		answeredMessage:
			data.response &&
			typeof data.response === 'object' &&
			'message' in data.response
				? data.response.message
				: ('' as string | null),
		prayerCount: data.response?.prayerCount ?? 0,
		hasPrayed: data.response?.prayedBy?.includes(userId) ?? false,
		lastUpdatedAt: data.response?.lastUpdatedAt ?? null,
		...data,
	}))

	// Return "All" as activeFilter when it's null
	return {
		prayers,
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

	if (action === 'togglePraying') {
		// First fetch the current request
		const request = await prisma.request.findUnique({
			where: { id: prayerId as string },
			select: { response: true },
		})

		// Initialize or get current values
		const currentResponse = request?.response ?? {}
		const prayedBy = new Set(currentResponse.prayedBy ?? [])
		const currentCount = currentResponse.prayerCount ?? 0

		// Toggle user's prayer status
		const hasPrayed = prayedBy.has(userId)
		if (hasPrayed) {
			prayedBy.delete(userId)
		} else {
			prayedBy.add(userId)
		}

		// Update the request with new values
		await prisma.request.update({
			where: { id: prayerId as string },
			data: {
				response: {
					prayerCount: hasPrayed ? currentCount - 1 : currentCount + 1,
					prayedBy: Array.from(prayedBy),
					lastUpdatedAt: new Date().toISOString(),
				},
			},
		})

		return data({ success: true })
	} else if (action === 'delete') {
		// Handle delete prayer action
		await prisma.request.delete({ where: { id: prayerId as string } })
		return data({ success: true })
	} else if (action === 'markAsAnswered') {
		// TODO update this.

		await prisma.request.update({
			where: { id: prayerId as string },
			data: {
				fulfilled: true,
				response: {
					message: formData.get('testimony') as string,
				},
			},
		})
	}
}

export default function PrayerBoardPage({actionData, loaderData}: Route.ComponentProps) {
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
		<main className="container mx-auto px-4 py-8">

			<PrayerBoard
				loaderData={loaderData}
				actionData={actionData}
				getFilterUrl={getFilterUrl}
				getSortUrl={getSortUrl}
				getNextPageUrl={getNextPageUrl}
			/>
		</main>
	)
}

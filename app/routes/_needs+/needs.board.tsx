import { useCallback } from 'react'
import { data, redirect, useSearchParams } from 'react-router'
import NeedsBoard from '#app/components/needs/needs-board.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { loadBoardData } from '#app/utils/board-loader.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/needs.board.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)

	const boardData = await loadBoardData(
		{ url, userId },
		{ 
			type: 'NEED',
			includeFullfilled: false 
		}
	)

	return {
		...boardData,
		needs: boardData.items
	}
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const needId = formData.get('needId')
	const action = formData.get('_action')

	if (action === 'delete') {
		// Handle delete prayer action
		await prisma.request.delete({ where: { id: needId as string } })
		return data({ success: true })
	} else if (action === 'markFulfilled') {
		await prisma.request.update({
			where: { id: needId as string },
			data: {
				fulfilled: formData.get('fulfilled') === '1',
			},
		})
		return data({ success: true })
	} else if (action === 'contact') {
		// First get the need to find its creator
		const need = await prisma.request.findUnique({
			where: { id: needId as string },
			select: { userId: true },
		})

		if (!need) return null

		// Find existing conversation between these two users
		const existingConversation = await prisma.conversation.findFirst({
			where: {
				AND: [
					{ participants: { every: { id: { in: [userId, need.userId] } } } },
					{ group: null },
				],
			},
		})

		if (existingConversation) {
			return redirect(`/messages/${existingConversation.id}`)
		}

		// Create new conversation between the two users
		const conversation = await prisma.conversation.create({
			data: {
				participants: {
					connect: [
						{ id: userId }, // Current user
						{ id: need.userId }, // Need creator
					],
				},
			},
		})

		return redirect(`/messages/${conversation.id}`)
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

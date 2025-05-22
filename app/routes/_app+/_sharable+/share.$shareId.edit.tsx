
import { requireUserId } from '#app/utils/auth.server.ts'
import { type Route } from './+types/share.$shareId.edit.ts'
import ShareEditor from './__share.new.editor.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { data } from 'react-router'



export { action } from './__share.new.server.tsx'

export async function loader({ request, params }: Route.LoaderArgs) {
	await requireUserId(request)

	const shareItem = await prisma.shareItem.findUnique({
		where: { id: params.shareId },
		select: {
			id: true,
			title: true,
			description: true,
			location: true,
			categoryId: true,
			shareType: true,
			duration: true,
			images: {
				orderBy: {
					order: 'asc',
				},
				select: {
					id: true,
					order: true,
					image: {
						select: {
							id: true,
							altText: true,
							objectKey: true,
						},
					},
				},
			},
		},
	})


	const categories = await prisma.category.findMany({
		where: { type: 'SHARE', active: true },
		select: { id: true, name: true },
	})
	return data({ categories, defaultShareType: shareItem.shareType, shareItem })
}

export default function ShareEditPage({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return <ShareEditor loaderData={loaderData} actionData={actionData} />
}

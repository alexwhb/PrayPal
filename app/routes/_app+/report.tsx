import { createModerationReport } from '#app/utils/moderation.server.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { ReportableType, ReportReason } from '@prisma/client'


export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  
  await createModerationReport({
    itemId: formData.get('itemId') as string,
    itemType: formData.get('itemType') as ReportableType,
    reason: formData.get('reason') as ReportReason,
    description: formData.get('description') as string,
    reporterId: userId
  })

  return { success: true }
}
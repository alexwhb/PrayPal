import { type ReportableType, type ReportReason } from '@prisma/client'
import { requireUserId } from '#app/utils/auth.server.ts'
import { createModerationReport } from '#app/utils/moderation.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { type Route } from './+types/report.ts'


export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  
  // Get the referrer URL to redirect back to
  const referer = request.headers.get('referer')
  const redirectTo = formData.get('redirectTo') as string || referer || '/'
  
  await createModerationReport({
    itemId: formData.get('itemId') as string,
    itemType: formData.get('itemType') as ReportableType,
    reason: formData.get('reason') as ReportReason,
    description: formData.get('description') as string,
    reporterId: userId
  })

  // Redirect back with a success toast
  return redirectWithToast(redirectTo, {
    title: 'Report submitted',
    description: 'Thank you for your report. Our moderation team will review it.',
    type: 'success'
  })
}
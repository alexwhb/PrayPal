// import { data, Form, Link, redirect, useLoaderData } from 'react-router'
// import { requireUserId } from '#app/utils/auth.server.ts'
// import { prisma } from '#app/utils/db.server.ts'
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from '#app/components/ui/card.tsx'
// import { Button } from '#app/components/ui/button.tsx'
// import { Badge } from '#app/components/ui/badge.tsx'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '#app/components/ui/select.tsx'
// import { Textarea } from '#app/components/ui/textarea.tsx'
// import { Label } from '#app/components/ui/label.tsx'
// import { formatDate } from '#app/utils/formatter.ts'
// import { ModerationType, ModeratorAction, ReportableType } from '@prisma/client'
// import { Separator } from '#app/components/ui/separator.tsx'
// import { Alert, AlertDescription, AlertTitle } from '#app/components/ui/alert.tsx'
// import { AlertCircle } from 'lucide-react'
//
// // Helper function to convert ReportableType to ModerationType
// function convertToModerationType(reportableType: ReportableType): ModerationType {
//   const mapping: Record<ReportableType, ModerationType> = {
//     'PRAYER': 'PRAYER',
//     'NEED': 'NEED',
//     'MESSAGE': 'MESSAGE',
//     'USER': 'USER',
//     'GROUP': 'GROUP',
//     'SHARE_ITEM': 'SHARE_ITEM',
//     'REQUEST': 'NEED', // Map REQUEST to NEED as per the schema
//   }
//   return mapping[reportableType]
// }
//
// export async function loader({ params, request }: { params: { reportId: string }, request: Request }) {
//   const userId = await requireUserId(request)
//
//   // Check if user is a moderator or admin
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     include: { roles: true },
//   })
//
//   const isModOrAdmin = user?.roles.some(role =>
//     ['admin', 'moderator'].includes(role.name)
//   ) ?? false
//
//   if (!isModOrAdmin) {
//     throw new Response('Not authorized', { status: 403 })
//   }
//
//   const reportId = params.reportId
//
//   // Get the report with related data
//   const report = await prisma.report.findUnique({
//     where: { id: reportId },
//     include: {
//       reportedBy: {
//         select: {
//           id: true,
//           name: true,
//           username: true,
//         },
//       },
//     },
//   })
//
//   if (!report) {
//     throw new Response('Report not found', { status: 404 })
//   }
//
//   // Get the reported item based on type
//   let reportedItem = null
//
//   if (report.itemType === 'PRAYER' || report.itemType === 'NEED' || report.itemType === 'REQUEST') {
//     reportedItem = await prisma.request.findUnique({
//       where: { id: report.itemId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//           },
//         },
//         category: true,
//       },
//     })
//   } else if (report.itemType === 'GROUP') {
//     reportedItem = await prisma.group.findUnique({
//       where: { id: report.itemId },
//       include: {
//         memberships: {
//           where: { role: 'LEADER' },
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 name: true,
//                 username: true,
//               },
//             },
//           },
//         },
//         category: true,
//       },
//     })
//   } else if (report.itemType === 'SHARE_ITEM') {
//     reportedItem = await prisma.shareItem.findUnique({
//       where: { id: report.itemId },
//       include: {
//         owner: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//           },
//         },
//         category: true,
//       },
//     })
//   } else if (report.itemType === 'USER') {
//     reportedItem = await prisma.user.findUnique({
//       where: { id: report.itemId },
//       select: {
//         id: true,
//         name: true,
//         username: true,
//         email: true,
//         createdAt: true,
//       },
//     })
//   }
//
//   return data({
//     report,
//     reportedItem,
//     isAdmin: user?.roles.some(role => role.name === 'admin') ?? false,
//   })
// }
//
// export async function action({ request }: { request: Request }) {
//   const userId = await requireUserId(request)
//
//   // Check if user is a moderator or admin
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     include: { roles: true },
//   })
//
//   const isModOrAdmin = user?.roles.some(role =>
//     ['admin', 'moderator'].includes(role.name)
//   ) ?? false
//
//   if (!isModOrAdmin) {
//     throw new Response('Not authorized', { status: 403 })
//   }
//
//   const formData = await request.formData()
//   const action = formData.get('_action')
//
//   if (action === 'resolveReport') {
//     const reportId = formData.get('reportId') as string
//     const resolution = formData.get('resolution') as string
//     const moderatorAction = formData.get('moderatorAction') as ModeratorAction
//     const itemId = formData.get('itemId') as string
//     const reportItemType = formData.get('itemType') as ReportableType
//
//     // Convert ReportableType to ModerationType
//     const itemType = convertToModerationType(reportItemType)
//
//     // Create moderation log
//     const moderationLog = await prisma.moderationLog.create({
//       data: {
//         moderatorId: userId,
//         itemId,
//         itemType,
//         action: moderatorAction,
//         reason: resolution || 'Moderation action',
//         report: {
//           connect: {
//             id: reportId,
//           },
//         },
//       },
//     })
//
//     // Update report status
//     await prisma.report.update({
//       where: { id: reportId },
//       data: {
//         status: 'RESOLVED',
//         resolution,
//         resolvedById: userId,
//         resolvedAt: new Date(),
//       },
//     })
//
//     // Take action on the item based on moderatorAction
//     if (moderatorAction === 'DELETE') {
//       if (itemType === 'PRAYER' || itemType === 'NEED') {
//         await prisma.request.delete({ where: { id: itemId } })
//       } else if (itemType === 'GROUP') {
//         await prisma.group.update({
//           where: { id: itemId },
//           data: { active: false }
//         })
//       } else if (itemType === 'SHARE_ITEM') {
//         await prisma.shareItem.delete({ where: { id: itemId } })
//       } else if (itemType === 'USER') {
//         await prisma.user.delete({ where: { id: itemId } })
//       }
//     } else if (moderatorAction === 'HIDE' || moderatorAction === 'FLAG') {
//       if (itemType === 'PRAYER' || itemType === 'NEED') {
//         await prisma.request.update({
//           where: { id: itemId },
//           data: {
//             status: 'REMOVED',
//             flagged: moderatorAction === 'FLAG'
//           }
//         })
//       } else if (itemType === 'SHARE_ITEM') {
//         await prisma.shareItem.update({
//           where: { id: itemId },
//           data: {
//             status: 'REMOVED',
//             flagged: moderatorAction === 'FLAG'
//           }
//         })
//       }
//     }
//
//     return redirect('/admin/moderation')
//   }
//
//   if (action === 'dismissReport') {
//     const reportId = formData.get('reportId') as string
//
//     await prisma.report.update({
//       where: { id: reportId },
//       data: {
//         status: 'DISMISSED',
//         resolvedById: userId,
//         resolvedAt: new Date(),
//         resolution: 'Dismissed by moderator',
//       },
//     })
//
//     return redirect('/admin/moderation')
//   }
//
//   return null
// }
//
// export default function ReviewReport() {
//   const { report, reportedItem, isAdmin } = useLoaderData<typeof loader>()
//
//   function getItemTypeLabel(type: ReportableType) {
//     const labels: Record<ReportableType, string> = {
//       PRAYER: 'Prayer Request',
//       NEED: 'Need Request',
//       MESSAGE: 'Message',
//       USER: 'User',
//       GROUP: 'Group',
//       SHARE_ITEM: 'Shared Item',
//       REQUEST: 'Request',
//     }
//     return labels[type] || type
//   }
//
//   function renderReportedItem() {
//     if (!reportedItem) {
//       return (
//         <Alert variant="destructive" className="mb-4">
//           <AlertCircle className="h-4 w-4" />
//           <AlertTitle>Item not found</AlertTitle>
//           <AlertDescription>
//             The reported item may have been deleted or is no longer accessible.
//           </AlertDescription>
//         </Alert>
//       )
//     }
//
//     if (report.itemType === 'PRAYER' || report.itemType === 'NEED' || report.itemType === 'REQUEST') {
//       return (
//         <Card className="mb-4">
//           <CardHeader>
//             <CardTitle>{report.itemType === 'PRAYER' ? 'Prayer Request' : 'Need Request'}</CardTitle>
//             <CardDescription>
//               Posted by{' '}
//               <Link to={`/users/${reportedItem.user.username}`} className="font-medium hover:underline">
//                 {reportedItem.user.name}
//               </Link>{' '}
//               in {reportedItem.category.name}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <p className="whitespace-pre-wrap">{reportedItem.description}</p>
//           </CardContent>
//         </Card>
//       )
//     } else if (report.itemType === 'GROUP') {
//       const leader = reportedItem.memberships[0]?.user
//
//       return (
//         <Card className="mb-4">
//           <CardHeader>
//             <CardTitle>{reportedItem.name}</CardTitle>
//             <CardDescription>
//               Created by{' '}
//               {leader ? (
//                 <Link to={`/users/${leader.username}`} className="font-medium hover:underline">
//                   {leader.name}
//                 </Link>
//               ) : (
//                 'Unknown user'
//               )}{' '}
//               in {reportedItem.category.name}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <p className="whitespace-pre-wrap">{reportedItem.description}</p>
//           </CardContent>
//         </Card>
//       )
//     } else if (report.itemType === 'SHARE_ITEM') {
//       return (
//         <Card className="mb-4">
//           <CardHeader>
//             <CardTitle>{reportedItem.title}</CardTitle>
//             <CardDescription>
//               Shared by{' '}
//               <Link to={`/users/${reportedItem.owner.username}`} className="font-medium hover:underline">
//                 {reportedItem.owner.name}
//               </Link>{' '}
//               in {reportedItem.category.name}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <p className="whitespace-pre-wrap">{reportedItem.description}</p>
//           </CardContent>
//         </Card>
//       )
//     } else if (report.itemType === 'USER') {
//       return (
//         <Card className="mb-4">
//           <CardHeader>
//             <CardTitle>User Profile</CardTitle>
//             <CardDescription>
//               Account created on {formatDate(reportedItem.createdAt)}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-2">
//               <div>
//                 <span className="font-medium">Name:</span> {reportedItem.name}
//               </div>
//               <div>
//                 <span className="font-medium">Username:</span> @{reportedItem.username}
//               </div>
//               {isAdmin && (
//                 <div>
//                   <span className="font-medium">Email:</span> {reportedItem.email}
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       )
//     }
//
//     return null
//   }
//
//   return (
//     <div className="container mx-auto py-8 max-w-3xl">
//       <div className="mb-4">
//         <Link to="/admin/moderation" className="text-sm font-medium text-primary hover:underline">
//           ← Back to Moderation Dashboard
//         </Link>
//       </div>
//
//       <h1 className="mb-6 text-3xl font-bold">Review Report</h1>
//
//       <Card className="mb-6">
//         <CardHeader>
//           <CardTitle>Report Details</CardTitle>
//           <CardDescription>
//             Reported on {formatDate(report.createdAt)}
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div>
//               <span className="font-medium">Reported Item:</span>{' '}
//               <Badge variant="outline">{getItemTypeLabel(report.itemType)}</Badge>
//             </div>
//             <div>
//               <span className="font-medium">Reported By:</span>{' '}
//               <Link to={`/users/${report.reportedBy.username}`} className="hover:underline">
//                 {report.reportedBy.name}
//               </Link>
//             </div>
//             <div>
//               <span className="font-medium">Reason:</span>{' '}
//               <Badge>{report.reason}</Badge>
//             </div>
//             {report.description && (
//               <div>
//                 <span className="font-medium">Description:</span>
//                 <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
//                   {report.description}
//                 </p>
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//
//       <h2 className="mb-4 text-xl font-bold">Reported Content</h2>
//       {renderReportedItem()}
//
//       <h2 className="mb-4 text-xl font-bold">Take Action</h2>
//       <Card>
//         <CardContent className="pt-6">
//           <Form method="post">
//             <input type="hidden" name="reportId" value={report.id} />
//             <input type="hidden" name="itemId" value={report.itemId} />
//             <input type="hidden" name="itemType" value={report.itemType} />
//
//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="moderatorAction">Action</Label>
//                 <Select name="moderatorAction" required>
//                   <SelectTrigger id="moderatorAction">
//                     <SelectValue placeholder="Select an action" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="DELETE">Delete content</SelectItem>
//                     <SelectItem value="HIDE">Hide content</SelectItem>
//                     <SelectItem value="FLAG">Flag content</SelectItem>
//                     <SelectItem value="RESTORE">Restore content</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//
//               <div className="space-y-2">
//                 <Label htmlFor="resolution">Resolution Notes</Label>
//                 <Textarea
//                   id="resolution"
//                   name="resolution"
//                   placeholder="Explain your decision (optional)"
//                   rows={3}
//                 />
//               </div>
//             </div>
//
//             <div className="mt-6 flex justify-between">
//               <Button
//                 type="submit"
//                 name="_action"
//                 value="dismissReport"
//                 variant="outline"
//               >
//                 Dismiss Report
//               </Button>
//               <Button
//                 type="submit"
//                 name="_action"
//                 value="resolveReport"
//               >
//                 Resolve Report
//               </Button>
//             </div>
//           </Form>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
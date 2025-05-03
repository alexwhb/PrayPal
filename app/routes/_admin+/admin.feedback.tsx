import { useState } from 'react'
import { data, redirect, Form, useLoaderData } from 'react-router'

import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#app/components/ui/card'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#app/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#app/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#app/components/ui/table'
import { Textarea } from '#app/components/ui/textarea'
import { prisma } from '#app/utils/db.server'
import { requireUserWithRole } from '#app/utils/permissions.server'
import { type Route } from './+types/admin.feedback.ts'

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserWithRole(request, 'admin')
  
  const url = new URL(request.url)
  const type = url.searchParams.get('type') as 'BUG' | 'QUESTION' | 'FEATURE' | null
  const status = url.searchParams.get('status') as 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'IMPLEMENTED' | null
  
  const feedback = await prisma.feedback.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  return data({ feedback })
}

export async function action({ request }: Route.ActionArgs) {
  await requireUserWithRole(request, 'admin')
  
  const formData = await request.formData()
  const id = formData.get('id') as string
  const status = formData.get('status') as 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'IMPLEMENTED'
  const response = formData.get('response') as string | null
  
  await prisma.feedback.update({
    where: { id },
    data: { 
      status,
      ...(response ? { description: response } : {}),
    },
  })
  
  return redirect('/admin/feedback')
}

export default function AdminFeedback() {
  const { feedback } = useLoaderData<typeof loader>()
  const [selectedFeedback, setSelectedFeedback] = useState<null | (typeof feedback)[number]>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'IMPLEMENTED'>('OPEN')
  const [response, setResponse] = useState('')
  
  function handleViewDetails(item: (typeof feedback)[number]) {
    setSelectedFeedback(item)
    setNewStatus(item.status)
    setResponse(item.description)
    setIsDialogOpen(true)
  }
  
  function getStatusBadge(status: string) {
    switch (status) {
      case 'OPEN':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Open</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">In Progress</Badge>
      case 'IMPLEMENTED':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Implemented</Badge>
      case 'CLOSED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  function getTypeBadge(type: string) {
    switch (type) {
      case 'BUG':
        return <Badge variant="destructive">Bug</Badge>
      case 'FEATURE':
        return <Badge variant="secondary">Feature</Badge>
      case 'QUESTION':
        return <Badge variant="default">Question</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }
  
  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage User Feedback</h1>
        <div className="flex gap-4">
          <Form method="get">
            <Select name="type" onValueChange={(value) => {
              const form = document.querySelector('form') as HTMLFormElement
              form.submit()
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="BUG">Bug Reports</SelectItem>
                <SelectItem value="QUESTION">Questions</SelectItem>
                <SelectItem value="FEATURE">Feature Requests</SelectItem>
              </SelectContent>
            </Select>
          </Form>
          
          <Form method="get">
            <Select name="status" onValueChange={(value) => {
              const form = document.querySelector('form:nth-of-type(2)') as HTMLFormElement
              form.submit()
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </Form>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Feedback List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{getTypeBadge(item.type)}</TableCell>
                  <TableCell className="max-w-md truncate font-medium">{item.title}</TableCell>
                  <TableCell>{item.user.name || item.user.username}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(item)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              View and update the status of this feedback item.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <>
              <div className="grid gap-4 py-4">
                <div className="flex justify-between">
                  <div>
                    {getTypeBadge(selectedFeedback.type)}
                  </div>
                  <div>
                    Submitted: {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">{selectedFeedback.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    By: {selectedFeedback.user.name || selectedFeedback.user.username}
                  </p>
                </div>
                
                <div className="rounded-md bg-muted p-4">
                  <p className="whitespace-pre-wrap">{selectedFeedback.description}</p>
                </div>
                
                <Form method="post">
                  <input type="hidden" name="id" value={selectedFeedback.id} />
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Update Status</label>
                      <Select 
                        name="status" 
                        value={newStatus}
                        onValueChange={(value) => setNewStatus(value as any)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Admin Response</label>
                      <Textarea
                        name="response"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Add your response or notes here..."
                        className="min-h-[100px]"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        This will replace the original description. Include the original content if you want to preserve it.
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Update Feedback
                    </Button>
                  </DialogFooter>
                </Form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
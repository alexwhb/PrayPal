import { ReportReason } from '@prisma/client'
import { Flag, Trash, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { Form } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#app/components/ui/dialog.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu.tsx'
import { Label } from '#app/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#app/components/ui/select.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'

type ContentModerationType = 'share-item' | 'prayer' | 'need' | 'group' | 'message' | 'user'

type ContentModerationProps = {
  itemId: string
  itemType: ContentModerationType
  canModerate: boolean
  isOwner: boolean
  onModerateAction?: (
    itemId: string,
    action: 'delete' | 'pending' | 'removed',
    isModerator: boolean,
  ) => void
}

export default function ContentModeration({
  itemId,
  itemType,
  canModerate,
  isOwner,
  onModerateAction,
}: ContentModerationProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<'delete' | 'pending' | 'removed' | 'report' | null>(null)
  
  const handleOpenDialog = (action: 'delete' | 'pending' | 'removed' | 'report') => {
    setDialogAction(action)
    setDialogOpen(true)
  }
  
  const handleCloseDialog = () => {
    setDialogOpen(false)
    setDialogAction(null)
  }
  
  const handleAction = () => {
    if (dialogAction && onModerateAction && dialogAction !== 'report') {
      onModerateAction(itemId, dialogAction, canModerate)
    }
    // For report action, the form will handle submission
    if (dialogAction !== 'report') {
      handleCloseDialog()
    }
  }
  
  // Map content type to ReportableType enum value
  const getReportableType = () => {
    const mapping: Record<ContentModerationType, string> = {
      'share-item': 'SHARE_ITEM',
      'prayer': 'PRAYER',
      'need': 'NEED',
      'group': 'GROUP',
      'message': 'MESSAGE',
      'user': 'USER',
    }
    return mapping[itemType]
  }
  
  // Map content type to form field name
  const getItemIdFieldName = () => {
    const mapping: Record<ContentModerationType, string> = {
      'share-item': 'itemId',
      'prayer': 'prayerId',
      'need': 'needId',
      'group': 'groupId',
      'message': 'messageId',
      'user': 'userId',
    }
    return mapping[itemType]
  }
  
  return (
    <div className="flex gap-2">
      {/* Moderator actions */}
      {canModerate && !isOwner && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Flag className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <DropdownMenuItem
              onClick={() => handleOpenDialog('pending')}
            >
              Mark as Pending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenDialog('removed')}
            >
              Remove Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {/* Regular user report option */}
      {!canModerate && !isOwner && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenDialog('report')}
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="sr-only">Report</span>
        </Button>
      )}

      {/* Owner delete option */}
      {isOwner && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleOpenDialog('delete')}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </Button>
      )}
      
      {/* Moderation/Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'delete' && 'Delete Item'}
              {dialogAction === 'pending' && 'Mark as Pending'}
              {dialogAction === 'removed' && 'Remove Item'}
              {dialogAction === 'report' && 'Report Content'}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'delete' && 'Are you sure you want to delete this item? This action cannot be undone.'}
              {dialogAction === 'pending' && 'This will mark the item as pending review.'}
              {dialogAction === 'removed' && 'This will remove the item from public view.'}
              {dialogAction === 'report' && 'Report this content to the moderators for review.'}
            </DialogDescription>
          </DialogHeader>
          
          {dialogAction === 'report' ? (
            <Form method="post" action="/report" onSubmit={() => handleCloseDialog()}>
              <input type="hidden" name="itemId" value={itemId} />
              <input type="hidden" name="itemType" value={getReportableType()} />
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Select name="reason" required>
                    <SelectTrigger id="reason">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ReportReason.SPAM}>Spam</SelectItem>
                      <SelectItem value={ReportReason.INAPPROPRIATE}>Inappropriate Content</SelectItem>
                      <SelectItem value={ReportReason.HARASSMENT}>Harassment</SelectItem>
                      <SelectItem value={ReportReason.SCAM}>Scam</SelectItem>
                      <SelectItem value={ReportReason.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Please provide details about your report"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">Submit Report</Button>
              </DialogFooter>
            </Form>
          ) : (
            <Form method="post">
              <input type="hidden" name={getItemIdFieldName()} value={itemId} />
              <input type="hidden" name="_action" value={dialogAction} />
              <input 
                type="hidden" 
                name="moderatorAction" 
                value={canModerate ? "1" : "0"} 
              />
              
              {(dialogAction === 'pending' || dialogAction === 'removed') && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="Reason for this action"
                      rows={3}
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {dialogAction === 'delete' && 'Delete'}
                  {dialogAction === 'pending' && 'Mark as Pending'}
                  {dialogAction === 'removed' && 'Remove'}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
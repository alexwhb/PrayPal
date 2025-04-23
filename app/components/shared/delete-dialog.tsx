
import { Form } from 'react-router'
import {
	Dialog,
	DialogContent, DialogFooter,
	DialogHeader,
	DialogTitle,
} from '#app/components/ui/dialog.tsx'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  additionalFormData?: Record<string, string>
  isModerator?: boolean
}

export function DeleteDialog({ 
  open, 
  onOpenChange, 
  additionalFormData,
  isModerator 
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isModerator ? 'Moderate Content' : 'Delete Content'}
          </DialogTitle>
        </DialogHeader>
        
        <Form method="post">
          {Object.entries(additionalFormData || {}).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          
          {isModerator && (
            <div className="space-y-4">
              <Label htmlFor="reason">Reason for moderation</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Enter reason for moderation..."
              />
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              name="_action"
              value="delete"
              type="submit"
            >
              {isModerator ? 'Moderate' : 'Delete'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
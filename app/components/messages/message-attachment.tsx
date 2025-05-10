import { Gift, Share } from 'lucide-react'
import { Form } from 'react-router'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Card, CardContent, CardFooter, CardHeader } from '#app/components/ui/card.tsx'
import { getImageSrc } from '#app/utils/misc.tsx'

export type Attachment = {
  id: string
  type: string
  referenceId: string
  metadata: Record<string, any>
}


type AttachmentProps = {
  attachment: Attachment
  isOwner: boolean
}

export function MessageAttachment({ attachment, isOwner }: AttachmentProps) {
  if (attachment.type === 'SHARE_ITEM') {
    return <ShareItemAttachment attachment={attachment} isOwner={isOwner} />
  }
  
  // Add more attachment type renderers as needed
  return null
}

function ShareItemAttachment({ attachment, isOwner }: AttachmentProps) {
  const { referenceId, metadata } = attachment
  const { title, imageId, category, shareType } = metadata
  const isBorrowable = shareType === 'BORROW'
  
  return (
    <Card className="mb-4 max-w-sm border-2 transition-shadow hover:shadow-md">
      <CardHeader className="p-0">
        <div className="h-32 relative w-full overflow-hidden">
          <img
            src={imageId ? getImageSrc(imageId) : 'https://placehold.co/600x400'}
            alt={title}
            className="h-full w-full rounded-t-lg object-cover"
          />
          <div className="absolute right-2 top-2">
            <Badge
              variant="secondary"
              className="bg-green-500 hover:bg-green-400"
            >
              {category}
            </Badge>
          </div>
          <div className="absolute left-2 top-2">
            <Badge
              variant={isBorrowable ? 'outline' : 'default'}
              className={
                isBorrowable
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-green-500 hover:bg-green-600'
              }
            >
              {isBorrowable ? (
                <div className="flex items-center gap-1">
                  <Share className="h-3 w-3" />
                  <span>Borrow</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Gift className="h-3 w-3" />
                  <span>Free</span>
                </div>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <h3 className="text-md font-semibold">{title}</h3>
      </CardContent>
      
      {isOwner && (
        <CardFooter className="pt-0">
          <Form method="post" action="/share/board">
            <input type="hidden" name="itemId" value={referenceId} />
            <input type="hidden" name="_action" value="toggleClaimed" />
            <Button type="submit" size="sm">
              Mark as Claimed
            </Button>
          </Form>
        </CardFooter>
      )}
    </Card>
  )
}
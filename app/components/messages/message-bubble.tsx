import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar'
import { getUserImgSrc } from '#app/utils/misc'

type MessageProps = {
  message: {
    id: string
    content: string
    createdAt: string | Date
    sender: {
      id: string
      image?: { id: string } | null
      name?: string
      username?: string
    }
  }
  userId: string
}

export function MessageBubble({ message, userId }: MessageProps) {
  const isCurrentUser = message.sender.id === userId
  const senderName = message.sender.name || message.sender.username || 'User'
  
  return (
    <div
      className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <Avatar className="h-8 w-8 mt-1">
        <AvatarImage
          src={getUserImgSrc(message.sender.image?.id)}
          alt={senderName}
        />
        <AvatarFallback>{senderName[0]}</AvatarFallback>
      </Avatar>
      
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className="mt-1 text-xs opacity-70">
          {formatDistanceToNow(
            typeof message.createdAt === 'string' 
              ? new Date(message.createdAt) 
              : message.createdAt, 
            { addSuffix: true }
          )}
        </p>
      </div>
    </div>
  )
}
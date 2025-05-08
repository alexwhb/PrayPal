import { formatDate } from '#app/utils/formatter'
import { MessageAttachment } from './message-attachment'

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
  
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-lg p-3 ${
        isCurrentUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      }`}>
        {!isCurrentUser && (
          <div className="mb-1 text-xs font-medium">
            {message.sender.name || message.sender.username}
          </div>
        )}
        
        {message.attachment && (
          <MessageAttachment 
            attachment={message.attachment}
            isOwner={message.sender.id !== userId}
          />
        )}
        
        <div>{message.content}</div>
        
        <div className="mt-1 text-right text-xs opacity-70">
          {formatDate(message.createdAt, 'time')}
        </div>
      </div>
    </div>
  )
}
import { formatDate } from '#app/utils/formatter'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { AvatarFallback, AvatarImage, Avatar  } from '../ui/avatar'
import { type Attachment, MessageAttachment } from './message-attachment'


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
    attachment?: Attachment
  }
  userId: string
}

export function MessageBubble({ message, userId }: MessageProps) {
  const isCurrentUser = message.sender.id === userId
	const isAttachmentOwner = message.sender.id !== userId

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
			<Avatar className="h-8 w-8 m-2">
				<AvatarImage
					src={getUserImgSrc(message.sender.image?.id)}
					alt={message.sender.name || message.sender.username}
				/>
				<AvatarFallback>{message.sender.name[0] || message.sender.username[0]}</AvatarFallback>
			</Avatar>


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
            isOwner={isAttachmentOwner}
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
import { Card, CardContent } from '@/components/ui/card'
import MarkdownViewer from './MarkdownViewer'
import { User, Bot } from 'lucide-react'

interface MessageProps {
  message: string
  isUser: boolean
}

export default function Message({ message, isUser }: MessageProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-500 text-white'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        
        <Card className={`${isUser ? 'bg-blue-500 text-white' : 'bg-gray-50 dark:bg-gray-800'}`}>
          <CardContent className="p-4">
            {isUser ? (
              <p className="text-sm">{message}</p>
            ) : (
              <MarkdownViewer content={message} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
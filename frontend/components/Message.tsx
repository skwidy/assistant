import MarkdownViewer from './MarkdownViewer'

interface MessageProps {
  message: string
  isUser: boolean
}

export default function Message({ message, isUser }: MessageProps) {
  return (
    <div className="py-1">
      <div className="max-w-3xl mx-auto px-4">
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
          {isUser ? (
            <div
              className="rounded-2xl px-4 py-1 text-base bg-gray-700 text-white mb-8"
              style={{ maxWidth: '95%' }}
            >
              {message}
            </div>
          ) : (
            <div
              className="text-base text-gray-900 dark:text-gray-100 leading-relaxed"
              style={{ maxWidth: '100%' }}
            >
              <MarkdownViewer content={message} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
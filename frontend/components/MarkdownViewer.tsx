import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface MarkdownViewerProps {
  content: string
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-pre:bg-gray-900 prose-pre:text-gray-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom styling for code blocks
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            return !isInline ? (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            )
          },
          // Custom styling for links
          a({ children, href }: any) {
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {children}
              </a>
            )
          },
          // Custom styling for lists
          ul({ children }: any) {
            return <ul className="list-disc list-inside space-y-1">{children}</ul>
          },
          ol({ children }: any) {
            return <ol className="list-decimal list-inside space-y-1">{children}</ol>
          },
          // Custom styling for blockquotes
          blockquote({ children }: any) {
            return (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic">
                {children}
              </blockquote>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
} 
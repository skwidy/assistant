import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface MarkdownViewerProps {
  content: string
}

// Dynamically load highlight.js theme based on color mode
function useHighlightTheme() {
  useEffect(() => {
    let link = document.getElementById('hljs-theme') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'stylesheet'
      link.id = 'hljs-theme'
      document.head.appendChild(link)
    }
    function updateTheme() {
      const isDark = document.documentElement.classList.contains('dark')
      link!.href = isDark
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css'
      // Also update all code block text color
      document.querySelectorAll('pre code').forEach((el) => {
        (el as HTMLElement).style.color = isDark ? '#f3f4f6' : '#1f2937'
      })
    }
    updateTheme()
    // Listen for theme changes
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      if (link) link.remove()
      observer.disconnect()
    }
  }, [])
}

// Helper to extract text from ReactMarkdown code children
function extractCodeText(children: any): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(extractCodeText).join('')
  if (children && typeof children === 'object' && 'props' in children) return extractCodeText(children.props.children)
  return ''
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 px-2 py-1 text-xs rounded bg-gray-700/80 dark:bg-gray-700/80 text-gray-200 hover:bg-blue-500 hover:text-white transition-colors z-10"
      style={{ fontFamily: 'inherit' }}
      tabIndex={-1}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  useHighlightTheme()
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:m-0 prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0 prose-pre:rounded-none prose-hr:my-6 prose-hr:border-t prose-hr:border-gray-200 dark:prose-hr:border-gray-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom styling for code blocks
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            let codeString = extractCodeText(children).replace(/\n$/, '')
            // Robustly remove all leading and trailing backticks for inline code
            if (isInline && codeString.length > 1) {
              codeString = codeString.replace(/^`+/, '').replace(/`+$/, '').trim();
              // If still wrapped in backticks, repeat
              while (codeString.startsWith('`') && codeString.endsWith('`') && codeString.length > 1) {
                codeString = codeString.slice(1, -1).trim();
              }
            }
            return !isInline ? (
              <div className="relative my-4">
                <pre
                  className="bg-[#f4f4f5] dark:bg-[#23272f] border border-gray-200 dark:border-gray-700 rounded-xl p-4 overflow-x-auto text-sm leading-relaxed font-mono text-gray-800 dark:text-gray-100"
                  style={{ fontSize: '15px', lineHeight: '1.6', fontFamily: 'Menlo, Monaco, Consolas, \'Liberation Mono\', \'Courier New\', monospace', boxShadow: 'none' }}
                >
                  <CopyButton value={codeString} />
                  <code className={className + ' !bg-transparent !border-0 !rounded-none'} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code
                className="bg-gray-100 dark:bg-[#23272f] text-[.97em] px-1.5 py-0.5 rounded font-mono text-gray-800 dark:text-gray-200"
                {...props}
              >
                {codeString}
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
                className="text-blue-600 dark:text-blue-400 hover:underline transition-colors"
              >
                {children}
              </a>
            )
          },
          // Custom styling for lists
          ul({ children }: any) {
            return <ul className="list-disc list-outside space-y-2 my-4 pl-6 marker:text-gray-400 dark:marker:text-gray-500">{children}</ul>
          },
          ol({ children }: any) {
            return <ol className="list-decimal list-outside space-y-2 my-4 pl-6 marker:text-gray-400 dark:marker:text-gray-500">{children}</ol>
          },
          li({ children, ...props }: any) {
            return <li className="mb-1 pl-1 text-gray-800 dark:text-gray-200 leading-relaxed" {...props}>{children}</li>
          },
          // Custom styling for blockquotes
          blockquote({ children }: any) {
            return (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#23272f] rounded-lg py-2">
                {children}
              </blockquote>
            )
          },
          // Custom styling for headings
          h1({ children }: any) {
            return <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-4">{children}</h1>
          },
          h2({ children }: any) {
            return <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-5 mb-3">{children}</h2>
          },
          h3({ children }: any) {
            return <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">{children}</h3>
          },
          // Custom styling for paragraphs
          p({ children }: any) {
            return <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
          },
          // Custom styling for tables
          table({ children }: any) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm">
                  {children}
                </table>
              </div>
            )
          },
          thead({ children }: any) {
            return <thead className="bg-gray-100 dark:bg-gray-700">{children}</thead>
          },
          tbody({ children }: any) {
            return <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>
          },
          tr({ children, ...props }: any) {
            return <tr className="even:bg-gray-50 even:dark:bg-[#23272f]" {...props}>{children}</tr>
          },
          th({ children }: any) {
            return <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-left font-medium">{children}</th>
          },
          td({ children }: any) {
            return <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{children}</td>
          },
          hr() {
            return <hr className="my-6 border-t border-gray-200 dark:border-gray-700" />
          },
          img({ src, alt }: any) {
            return <img src={src} alt={alt} className="max-w-full h-auto rounded-lg my-4" />
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
} 
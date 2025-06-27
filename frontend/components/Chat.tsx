'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Message from './Message'
import ResetButton from './ResetButton'
import { Send, Loader2, Bot, Sun, Moon, Sparkles, MessageSquare, Zap, Lightbulb, Code } from 'lucide-react'
import { storage } from '@/lib/utils'

interface Message {
  content: string
  isUser: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Get assistant ID from query param or subdomain, or fallback to backend default
async function getAssistantIdWithDefault(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const url = new URL(window.location.href)
  const queryId = url.searchParams.get('assistant')
  if (queryId) return queryId

  const hostname = window.location.hostname


  // Fallback: fetch default assistant from backend
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/assistants`)
    const data = await res.json()
    if (data && data.defaultAssistant) {
      return data.defaultAssistant
    }
  } catch (e) {
    // If fetch fails, return null
  }
  return null
}

const SUGGESTED_PROMPTS = [
  {
    title: "Explain a concept",
    description: "Help me understand something complex",
    prompt: "Can you explain quantum computing in simple terms?",
    icon: Lightbulb
  },
  {
    title: "Write code",
    description: "Help me with programming",
    prompt: "Write a function to sort an array in JavaScript",
    icon: Code
  },
  {
    title: "Brainstorm ideas",
    description: "Generate creative solutions",
    prompt: "Give me 10 ideas for a weekend project",
    icon: Sparkles
  },
  {
    title: "Analyze something",
    description: "Get insights and analysis",
    prompt: "Analyze the pros and cons of remote work",
    icon: MessageSquare
  }
]

// Typing animation component
function TypingAnimation() {
  return (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  )
}

// Pre-process bot output: remove citations and clean double-backtick inline code
function cleanBotOutput(text: string): string {
  // Remove OpenAI citation artifacts
  let cleaned = text.replace(/【\d+:?\d*†[^】]+】/g, '')
  // Remove double-backtick for inline code: `\`something\`` => `something`
  // Only for inline code, so we do this in the MarkdownViewer inline code renderer
  return cleaned
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [assistantName, setAssistantName] = useState<string | null>(null)
  const [assistantDescription, setAssistantDescription] = useState<string | null>(null)
  const [assistantId, setAssistantId] = useState<string | null>(null)
  const [loadingAssistantInfo, setLoadingAssistantInfo] = useState(true)
  const [assistantInfoError, setAssistantInfoError] = useState(false)
  const [assistantIdError, setAssistantIdError] = useState<boolean>(false)

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
    getAssistantIdWithDefault().then(id => {
      if (id) {
        setAssistantId(id)
        setAssistantIdError(false)
      } else {
        setAssistantIdError(true)
      }
    })
  }, [])

  // Load threadId and messages from localStorage on component mount (client-side only)
  useEffect(() => {
    if (!isClient) return

    console.log('Loading from localStorage...')
    
    // Use assistant-specific storage keys
    const storageKey = `cd_assistant_${assistantId}`
    const savedThreadId = storage.get(`${storageKey}_thread_id`)
    const savedMessages = storage.get(`${storageKey}_messages`)
    const savedDarkMode = storage.get('cd_assistant_dark_mode')
    
    console.log('Saved data:', { savedThreadId, savedMessages, savedDarkMode })
    
    if (savedThreadId) {
      setThreadId(savedThreadId)
    }
    
    if (savedMessages && Array.isArray(savedMessages)) {
      setMessages(savedMessages)
      console.log('Loaded messages:', savedMessages.length)
    }
    
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode)
    }
  }, [isClient, assistantId])

  // Save messages to localStorage whenever they change (client-side only)
  useEffect(() => {
    if (!isClient) return
    console.log('Saving messages to localStorage:', messages.length)
    const storageKey = `cd_assistant_${assistantId}`
    storage.set(`${storageKey}_messages`, messages)
  }, [messages, isClient, assistantId])

  // Save dark mode preference to localStorage (client-side only)
  useEffect(() => {
    if (!isClient) return
    storage.set('cd_assistant_dark_mode', isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode, isClient])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input])

  // Fetch assistant info on mount
  useEffect(() => {
    setLoadingAssistantInfo(true)
    setAssistantInfoError(false)
    async function fetchInfo() {
      let id = assistantId
      if (!id) {
        setAssistantIdError(true)
        setLoadingAssistantInfo(false)
        return
      } else {
        setAssistantIdError(false)
      }
      fetch(`${API_URL}/assistants/${id}/info`)
        .then(res => res.json())
        .then(data => {
          if (data && data.name) {
            setAssistantName(data.name)
            document.title = data.name
            setAssistantDescription(data.description)
            setAssistantInfoError(false)
          } else {
            setAssistantName(null)
            setAssistantDescription(null)
            setAssistantInfoError(true)
          }
        })
        .catch(() => {
          setAssistantName(null)
          setAssistantDescription(null)
          setAssistantInfoError(true)
          document.title = 'AI Assistant'
        })
        .finally(() => setLoadingAssistantInfo(false))
    }
    fetchInfo()
  }, [assistantId])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim()
    if (!content || isLoading) return

    setInput('')
    setIsLoading(true)

    // Add user message to UI immediately
    setMessages(prev => [...prev, { content, isUser: true }])

    try {
      let id = assistantId
      if (!id) {
        id = await getAssistantIdWithDefault()
        setAssistantId(id)
      }
      const response = await fetch(`${API_URL}/assistants/${id}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          threadId: threadId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from assistant')
      }

      const data = await response.json()
      
      // Update threadId if it's a new thread
      if (data.threadId && data.threadId !== threadId) {
        setThreadId(data.threadId)
        if (isClient) {
          const storageKey = `cd_assistant_${assistantId}`
          storage.set(`${storageKey}_thread_id`, data.threadId)
        }
      }

      // Add assistant response to UI
      setMessages(prev => [...prev, { content: data.reply, isUser: false }])

    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, { 
        content: 'Sorry, I encountered an error. Please try again.', 
        isUser: false 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setMessages([])
    setThreadId(null)
    if (isClient) {
      const storageKey = `cd_assistant_${assistantId}`
      storage.remove(`${storageKey}_thread_id`)
      storage.remove(`${storageKey}_messages`)
    }
  }

  // Update handleKeyDown for textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt)
  }

  // Loading skeleton for chat UI
  function ChatLoadingSkeleton() {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between p-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          <div className="w-full max-w-xl mt-8">
            <div className="flex items-end gap-2 bg-white dark:bg-[#343541] rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loadingAssistantInfo) {
    return (
      <ChatLoadingSkeleton />
    )
  }

  if (assistantInfoError) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600">Assistant configuration error</h1>
        <p className="text-gray-500 mt-2">Could not load assistant info. Please check your backend and environment variables.</p>
      </div>
    )
  }

  if (assistantIdError) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600">Assistant configuration error</h1>
        <p className="text-gray-500 mt-2">Could not determine the default assistant. Please check your backend and environment variables.</p>
      </div>
    )
  }

  // Show init phase when no messages
  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{assistantName}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="w-8 h-8 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </div>

        {/* Welcome Screen */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-center max-w-2xl mx-auto">
            {/* Logo/Icon */}
            <div className="mb-8">
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                How can I help you today?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                {assistantDescription}
              </p>
            </div>

            {/* Suggested Prompts (optional, can be added back if needed) */}
            {/* ... */}

            {/* Unified Input Area */}
            <div className="max-w-xl mx-auto mt-8">
              <div className="flex items-end gap-2 bg-white dark:bg-[#343541] rounded-2xl px-4 py-3 shadow-sm">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${assistantName}...`}
                  rows={1}
                  className="flex-1 resize-none bg-transparent outline-none border-0 text-base py-2 px-0 focus:ring-0 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  style={{ minHeight: '40px', maxHeight: '120px', overflow: 'auto' }}
                  disabled={isLoading}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="rounded-full bg-transparent hover:bg-blue-500 text-blue-500 hover:text-white p-0 w-10 h-10 flex items-center justify-center border-none shadow-none transition-colors"
                  style={{ minWidth: 40, minHeight: 40 }}
                >
                  <Send size={18} />
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show conversation interface
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{assistantName}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="w-8 h-8 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <ResetButton onReset={handleReset} disabled={isLoading} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div key={index} className="message-enter">
              <Message
                message={message.isUser ? message.content : cleanBotOutput(message.content)}
                isUser={message.isUser}
              />
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start py-6 px-4">
              <div className="flex items-start gap-3 max-w-4xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <TypingAnimation />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pt-4 pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-white dark:bg-[#343541] rounded-2xl px-4 py-3 shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${assistantName}...`}
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none border-0 text-base py-2 px-0 focus:ring-0 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              style={{ minHeight: '40px', maxHeight: '120px', overflow: 'auto' }}
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="rounded-full bg-transparent hover:bg-blue-500 text-blue-500 hover:text-white p-0 w-10 h-10 flex items-center justify-center border-none shadow-none transition-colors"
              style={{ minWidth: 40, minHeight: 40 }}
            >
              <Send size={18} />
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
} 
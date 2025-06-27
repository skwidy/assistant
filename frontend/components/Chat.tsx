'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Message from './Message'
import ResetButton from './ResetButton'
import { Send, Loader2, Bot } from 'lucide-react'

interface Message {
  content: string
  isUser: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load threadId from localStorage on component mount
  useEffect(() => {
    const savedThreadId = localStorage.getItem('cd_assistant_thread_id')
    if (savedThreadId) {
      setThreadId(savedThreadId)
    }
  }, [])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message to UI immediately
    setMessages(prev => [...prev, { content: userMessage, isUser: true }])

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
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
        localStorage.setItem('cd_assistant_thread_id', data.threadId)
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
    localStorage.removeItem('cd_assistant_thread_id')
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold">Assistant</h1>
        <ResetButton onReset={handleReset} disabled={isLoading} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation with the AI assistant</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <Message
            key={index}
            message={message.content}
            isUser={message.isUser}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
} 
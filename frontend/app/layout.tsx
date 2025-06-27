import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'AI Assistant',
  description: 'AI-powered chat assistant powered by OpenAI',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
} 
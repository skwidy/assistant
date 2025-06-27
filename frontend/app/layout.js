import './globals.css'

export const metadata = {
  title: 'AI Assistant',
  description: 'AI-powered chat assistant powered by OpenAI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
} 
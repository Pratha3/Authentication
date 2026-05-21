'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  eventSlug: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export function EventAIChat({ eventSlug }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: 'Hi! I am the Gemini Event Assistant. Ask me anything about this event!' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventSlug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Server responded with an error')
      }

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ai', 
        content: data.reply || 'Sorry, I could not generate a response.' 
      }])
    } catch (err) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : 'I am having trouble connecting to the server. Please try again later.'
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ai', 
        content: errorMessage
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-background border border-border shadow-xl rounded-2xl overflow-hidden z-50 flex flex-col"
            style={{ height: '450px' }}
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="font-medium text-sm">Gemini Assistant</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/20 text-primary-foreground" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
              {messages.map(msg => (
                <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border/50 text-card-foreground rounded-tl-sm shadow-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-background border-t">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder="Ask about this event..." 
                  className="flex-1 rounded-full bg-muted/50 focus-visible:ring-1"
                />
                <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!input.trim() || isLoading}>
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50 hover:shadow-xl transition-shadow"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </>
  )
}

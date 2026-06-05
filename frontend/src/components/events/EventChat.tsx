'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { subscribeToEventChat, type ChatMessageData } from '@/services/realtime/subscriptions'
import { useAuthStore } from '@/store/auth.store'

interface EventChatProps {
  eventId: string
  eventTitle: string
}

export function EventChat({ eventId, eventTitle }: EventChatProps) {
  const { user, profile } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sendMessageRef = useRef<((userName: string, text: string) => void) | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (!isOpen || !user) return

    setIsLoading(true)
    const subscription = subscribeToEventChat(
      eventId,
      user.id,
      (history) => {
        setMessages(history)
        setIsLoading(false)
      },
      (newMsg) => {
        setMessages((prev) => [...prev, newMsg])
      }
    )

    sendMessageRef.current = subscription.sendMessage

    return () => {
      subscription.unsubscribe()
      sendMessageRef.current = null
    }
  }, [isOpen, eventId, user])

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || !sendMessageRef.current || !user) return

    const userName = profile?.full_name || user.name || user.email.split('@')[0] || 'Anonymous'
    sendMessageRef.current(userName, input.trim())
    setInput('')
  }

  if (!user) return null

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-xl font-bold py-5 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex gap-2 items-center"
      >
        <MessageCircle className="h-5 w-5" />
        Open Event Chatroom
      </Button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative z-10 w-full max-w-[400px] h-full bg-card/95 backdrop-blur-xl border-l border-border/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-border/20 bg-primary/10 px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground truncate max-w-[220px]">{eventTitle}</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold">Attendee Discussion Room</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full cursor-pointer" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs font-semibold animate-pulse">Connecting to chat...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground/40 gap-2">
                  <MessageCircle className="h-10 w-10 stroke-[1.25]" />
                  <span className="text-xs font-semibold">No messages yet. Say hello!</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.userId === user.id
                  return (
                    <div
                      key={msg._id}
                      className={cn("flex flex-col max-w-[85%] gap-0.5", isOwn ? "ml-auto items-end" : "mr-auto items-start")}
                    >
                      {!isOwn && (
                        <span className="text-[9px] font-bold text-muted-foreground/80 px-1">{msg.userName}</span>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2 text-xs shadow-sm break-all",
                          isOwn 
                            ? "bg-primary text-primary-foreground rounded-tr-sm" 
                            : "bg-muted text-foreground rounded-tl-sm border border-border/50"
                        )}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-muted-foreground/40 px-1 mt-0.5">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border/20 bg-background/40 p-3 backdrop-blur-md">
              <form onSubmit={handleSend} className="relative flex items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="pr-12 rounded-full border-border/50 bg-background/50 focus-visible:ring-primary/50 text-xs py-5"
                  disabled={isLoading}
                  maxLength={500}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 top-1 bottom-1 h-8 w-8 rounded-full transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

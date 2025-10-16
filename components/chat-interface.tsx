"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Calendar, Sprout, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { useUser } from "@/lib/hooks/use-user"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  onNavigate: (view: "chat" | "check-in" | "garden" | "journal") => void
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ChatInterface({ onNavigate }: ChatInterfaceProps) {
  const { user } = useUser()
  const [conversationId, setConversationId] = useState<number | null>(null)

  const { data, mutate } = useSWR(
    user ? `/api/messages?userId=${user.id}${conversationId ? `&conversationId=${conversationId}` : ""}` : null,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  )

  const messages: Message[] =
    data?.messages?.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })) || []

  useEffect(() => {
    if (data?.conversationId && !conversationId) {
      setConversationId(data.conversationId)
    }
  }, [data, conversationId])

  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !user) return

    const userMessageContent = input
    setInput("")
    setIsTyping(true)

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          userId: user.id,
          role: "user",
          content: userMessageContent,
        }),
      })

      const result = await response.json()
      setConversationId(result.conversationId)

      setTimeout(async () => {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: result.conversationId,
            userId: user.id,
            role: "assistant",
            content:
              "Thank you for sharing that with me. I'm here to listen and support you. Remember, every step forward, no matter how small, is progress worth celebrating.",
          }),
        })

        mutate()
        setIsTyping(false)
      }, 1500)
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="glass-strong border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#10B981]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Welcome back, {user?.name}</h1>
              <p className="text-sm text-muted-foreground">Always here for you 24/7</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("check-in")}
              className="h-10 w-10 rounded-full hover:bg-[#3B82F6]/10"
              aria-label="Morning check-in"
            >
              <Calendar className="h-5 w-5 text-[#3B82F6]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("garden")}
              className="h-10 w-10 rounded-full hover:bg-[#10B981]/10"
              aria-label="Progress garden"
            >
              <Sprout className="h-5 w-5 text-[#10B981]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("journal")}
              className="h-10 w-10 rounded-full hover:bg-[#F59E0B]/10"
              aria-label="Journal"
            >
              <BookOpen className="h-5 w-5 text-[#F59E0B]" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex animate-in fade-in slide-in-from-bottom-4 duration-500",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  "glass max-w-[80%] rounded-2xl px-6 py-4 shadow-lg transition-all hover:shadow-xl md:max-w-[70%]",
                  message.role === "assistant"
                    ? "rounded-tl-sm bg-[#3B82F6]/10 text-foreground"
                    : "rounded-tr-sm bg-muted/50 text-foreground",
                )}
              >
                <p className="text-pretty leading-relaxed">{message.content}</p>
                <time className="mt-2 block text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex animate-in fade-in slide-in-from-bottom-4 justify-start duration-300">
              <div className="glass max-w-[80%] rounded-2xl rounded-tl-sm bg-[#3B82F6]/10 px-6 py-4 shadow-lg md:max-w-[70%]">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#3B82F6] [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#3B82F6] [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#3B82F6]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="glass-strong border-t border-border/50 px-4 py-4">
        <div className="mx-auto flex max-w-4xl gap-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share what's on your mind..."
            className="h-14 flex-1 rounded-2xl border-border/50 bg-background/50 px-6 text-base shadow-sm transition-all focus:shadow-md"
            aria-label="Message input"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#10B981] text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

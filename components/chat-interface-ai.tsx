"use client"

import type React from "react"

import { useRef, useEffect, useState, type FormEvent } from "react"
import { Send, Sparkles, Calendar, Sprout, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { useChat } from "@ai-sdk/react"

interface ChatInterfaceProps {
  onNavigate: (view: "chat" | "check-in" | "garden" | "journal") => void
}

export function ChatInterface({ onNavigate }: ChatInterfaceProps) {
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState("")

  const { messages, sendMessage, status } = useChat({
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const messageText = input.trim()

    // Clear input immediately for better UX
    setInput("")

    // Send message
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: messageText }],
    })

    // Refocus input after sending
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-scroll when loading state changes
  useEffect(() => {
    if (isLoading) {
      scrollToBottom()
    }
  }, [isLoading])

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
          {messages.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="glass max-w-md rounded-2xl px-8 py-6 text-center">
                <Sparkles className="mx-auto mb-4 h-12 w-12 text-[#3B82F6]" />
                <h2 className="mb-2 text-xl font-semibold text-foreground">
                  Welcome to Next Moment
                </h2>
                <p className="text-sm text-muted-foreground">
                  I'm here to support you on your journey. Share what's on your mind, and let's talk.
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1
            const isStreaming = isLastMessage && status === "streaming"

            return (
              <div
                key={message.id}
                className={cn(
                  "flex animate-in fade-in slide-in-from-bottom-4 duration-300",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "glass max-w-[80%] rounded-2xl px-6 py-4 shadow-lg transition-all hover:shadow-xl md:max-w-[70%]",
                    message.role === "assistant"
                      ? "rounded-tl-sm bg-[#3B82F6]/10 text-foreground"
                      : "rounded-tr-sm bg-muted/50 text-foreground",
                    isStreaming && "animate-pulse",
                  )}
                >
                  <p className="text-pretty leading-relaxed whitespace-pre-wrap">
                    {message.parts
                      .filter((part) => part.type === "text")
                      .map((part, idx) => (
                        <span key={idx}>{part.type === "text" ? part.text : ""}</span>
                      ))}
                  </p>
                </div>
              </div>
            )
          })}

          {status === "submitted" && (
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
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-4xl gap-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            className="h-14 flex-1 rounded-2xl border-border/50 bg-background/50 px-6 text-base shadow-sm transition-all focus:shadow-md"
            aria-label="Message input"
            disabled={isLoading}
            autoFocus
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#10B981] text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}

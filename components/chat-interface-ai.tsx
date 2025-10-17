"use client"

import type React from "react"

import { useRef, useEffect, useState, type FormEvent } from "react"
import { Send, Sparkles, Calendar, Sprout, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { useChat } from "@ai-sdk/react"
import { motion } from "framer-motion"
import { MarkdownMessage } from "@/components/markdown-message"
import { StageProgressIndicator } from "@/components/stage-progress-indicator"
import { getStageConfig, isIconActiveForStage, getSuggestedReplyIcon, getSuggestedReplyColor } from "@/lib/stage-ui-config"
import type { RecoveryStage } from "@/lib/types"

interface SuggestedReply {
  text: string
  type?: "quick" | "detailed"
}

interface ChatInterfaceProps {
  onNavigate: (view: "chat" | "check-in" | "garden" | "journal") => void
}

export function ChatInterface({ onNavigate }: ChatInterfaceProps) {
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState("")
  const [currentStage, setCurrentStage] = useState<RecoveryStage>("greeting")
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [suggestedReplies, setSuggestedReplies] = useState<SuggestedReply[]>([
    { text: "Yes, let's check in", type: "quick" },
    { text: "Tell me more about how this works", type: "detailed" },
    { text: "I'm ready to start", type: "quick" },
  ])
  const fetchStageTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastStageFetchRef = useRef<number>(0)
  const [stageFetchError, setStageFetchError] = useState(false)
  const [previousStage, setPreviousStage] = useState<RecoveryStage | null>(null)
  const [justTransitioned, setJustTransitioned] = useState(false)

  const { messages, sendMessage, status } = useChat({
    onError: (error) => {
      console.error("Chat error:", error)
    },
    onFinish: async () => {
      // Clear any pending fetch timeout
      if (fetchStageTimeoutRef.current) {
        clearTimeout(fetchStageTimeoutRef.current)
      }

      // Debounce: only fetch if at least 1 second has passed since last fetch
      const now = Date.now()
      const timeSinceLastFetch = now - lastStageFetchRef.current
      const minFetchInterval = 1000 // 1 second minimum between fetches

      if (timeSinceLastFetch < minFetchInterval) {
        console.log(`Skipping stage fetch - only ${timeSinceLastFetch}ms since last fetch`)
        return
      }

      // After the AI finishes responding, fetch the latest stage info
      // Increased delay to 1500ms to ensure DB writes complete and AI detection finishes
      fetchStageTimeoutRef.current = setTimeout(async () => {
        lastStageFetchRef.current = Date.now()

        try {
          const response = await fetch("/api/chat/stage", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
            cache: 'no-cache'
          })

          if (response.ok) {
            const data = await response.json()

            // Check if stage changed (transition occurred)
            if (data.stage && data.stage !== currentStage) {
              setPreviousStage(currentStage)
              setCurrentStage(data.stage)
              setJustTransitioned(true)

              // Clear transition animation after 3 seconds
              setTimeout(() => setJustTransitioned(false), 3000)
            } else if (data.stage) {
              setCurrentStage(data.stage)
            }

            if (data.suggestedReplies) {
              setSuggestedReplies(data.suggestedReplies)
            }
            if (data.conversationId) {
              setConversationId(data.conversationId)
            }

            // Clear any previous errors
            setStageFetchError(false)
          } else {
            console.error("Failed to fetch stage info, status:", response.status)
            setStageFetchError(true)

            // Auto-clear error after 5 seconds
            setTimeout(() => setStageFetchError(false), 5000)
          }
        } catch (error) {
          console.error("Failed to fetch stage info:", error)
          setStageFetchError(true)

          // Auto-clear error after 5 seconds
          setTimeout(() => setStageFetchError(false), 5000)
        }
      }, 1500)
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const messageText = input.trim()

    // Clear input immediately for better UX
    setInput("")

    // Send message with conversationId if available
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: messageText }],
    }, {
      body: conversationId ? { conversationId } : undefined,
    })

    // Refocus input after sending
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSuggestedReplyClick = (replyText: string) => {
    if (isLoading) return

    // Send the suggested reply as a message with conversationId if available
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: replyText }],
    }, {
      body: conversationId ? { conversationId } : undefined,
    })
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

  // Fetch initial stage on mount - only once
  useEffect(() => {
    let isMounted = true
    let hasFetched = false

    const fetchInitialStage = async () => {
      // Only fetch if user is authenticated and we haven't fetched yet
      if (!user || hasFetched) {
        if (!user) {
          console.log("User not authenticated, skipping stage fetch")
        }
        return
      }

      hasFetched = true

      try {
        const response = await fetch("/api/chat/stage", {
          credentials: 'include',
          cache: 'no-cache'
        })
        if (response.ok && isMounted) {
          const data = await response.json()
          if (data.stage) {
            setCurrentStage(data.stage)
          }
          if (data.suggestedReplies) {
            setSuggestedReplies(data.suggestedReplies)
          }
          if (data.conversationId) {
            setConversationId(data.conversationId)
          }
        } else if (isMounted) {
          console.error("Failed to fetch stage, status:", response.status)
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch initial stage:", error)
        }
      }
    }

    fetchInitialStage()

    return () => {
      isMounted = false
    }
  }, [user?.id])

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchStageTimeoutRef.current) {
        clearTimeout(fetchStageTimeoutRef.current)
      }
    }
  }, [])

  const stageConfig = getStageConfig(currentStage)

  return (
    <div className="flex h-full flex-col">
      <header className="glass-strong border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${stageConfig.color}, ${stageConfig.color}dd)`,
                boxShadow: `0 0 20px ${stageConfig.color}40`
              }}
            >
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Welcome back, {user?.name}</h1>
              <p
                className="text-sm font-medium transition-colors duration-300"
                style={{ color: stageConfig.color }}
              >
                {stageConfig.subtitle}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("check-in")}
              className={cn(
                "h-10 w-10 rounded-full transition-all duration-300",
                isIconActiveForStage("check-in", currentStage)
                  ? "bg-[#14B8A6]/20 ring-2 ring-[#14B8A6]/50 shadow-lg hover:bg-[#14B8A6]/30"
                  : "hover:bg-[#3B82F6]/10"
              )}
              aria-label="Morning check-in"
              style={
                isIconActiveForStage("check-in", currentStage)
                  ? { boxShadow: "0 0 20px #14B8A640" }
                  : undefined
              }
            >
              <Calendar
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isIconActiveForStage("check-in", currentStage)
                    ? "text-[#14B8A6] animate-pulse"
                    : "text-[#3B82F6]"
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("garden")}
              className={cn(
                "h-10 w-10 rounded-full transition-all duration-300",
                isIconActiveForStage("garden", currentStage)
                  ? "bg-[#F43F5E]/20 ring-2 ring-[#F43F5E]/50 shadow-lg hover:bg-[#F43F5E]/30"
                  : "hover:bg-[#10B981]/10"
              )}
              aria-label="Progress garden"
              style={
                isIconActiveForStage("garden", currentStage)
                  ? { boxShadow: "0 0 20px #F43F5E40" }
                  : undefined
              }
            >
              <Sprout
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isIconActiveForStage("garden", currentStage)
                    ? "text-[#F43F5E] animate-pulse"
                    : "text-[#10B981]"
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("journal")}
              className={cn(
                "h-10 w-10 rounded-full transition-all duration-300",
                isIconActiveForStage("journal", currentStage)
                  ? "bg-[#F59E0B]/20 ring-2 ring-[#F59E0B]/50 shadow-lg hover:bg-[#F59E0B]/30"
                  : "hover:bg-[#F59E0B]/10"
              )}
              aria-label="Journal"
              style={
                isIconActiveForStage("journal", currentStage)
                  ? { boxShadow: "0 0 20px #F59E0B40" }
                  : undefined
              }
            >
              <BookOpen
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isIconActiveForStage("journal", currentStage)
                    ? "text-[#F59E0B] animate-pulse"
                    : "text-[#F59E0B]"
                )}
              />
            </Button>
          </div>
        </div>
      </header>

      {/* Stage Progress Indicator */}
      <StageProgressIndicator currentStage={currentStage} />

      {/* Stage Transition Celebration */}
      {justTransitioned && previousStage && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="mx-auto max-w-4xl px-6 py-3"
        >
          <div
            className="glass rounded-2xl px-6 py-4 text-center shadow-lg border-2"
            style={{
              borderColor: stageConfig.color,
              background: `linear-gradient(135deg, ${stageConfig.color}15, ${stageConfig.color}05)`,
              boxShadow: `0 0 30px ${stageConfig.color}30`,
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.2, 1.2, 1.2, 1],
                }}
                transition={{ duration: 0.6 }}
                className="text-2xl"
              >
                🎉
              </motion.div>
              <div>
                <p className="text-sm font-semibold" style={{ color: stageConfig.color }}>
                  Moving to {stageConfig.name}!
                </p>
                <p className="text-xs text-muted-foreground">{stageConfig.subtitle}</p>
              </div>
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.2, 1.2, 1.2, 1],
                }}
                transition={{ duration: 0.6 }}
                className="text-2xl"
              >
                ✨
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Banner */}
      {stageFetchError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mx-auto max-w-4xl px-6 py-2"
        >
          <div className="glass rounded-lg px-4 py-3 bg-yellow-50/50 border border-yellow-200/50 dark:bg-yellow-900/20 dark:border-yellow-700/50">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Having trouble syncing progress
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Don't worry, your conversation is saved and will sync automatically.
                </p>
              </div>
              <button
                onClick={() => setStageFetchError(false)}
                className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}

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
                  {message.role === "assistant" ? (
                    <MarkdownMessage
                      content={message.parts
                        .filter((part) => part.type === "text")
                        .map((part) => (part.type === "text" ? part.text : ""))
                        .join("")}
                    />
                  ) : (
                    <p className="text-pretty leading-relaxed whitespace-pre-wrap">
                      {message.parts
                        .filter((part) => part.type === "text")
                        .map((part, idx) => (
                          <span key={idx}>{part.type === "text" ? part.text : ""}</span>
                        ))}
                    </p>
                  )}
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
        <div className="mx-auto max-w-4xl">
          {/* Suggested Replies */}
          {suggestedReplies.length > 0 && !isLoading && (
            <div className="mb-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {suggestedReplies.map((reply, index) => {
                const icon = getSuggestedReplyIcon(reply.text)
                const colorClass = getSuggestedReplyColor(reply.text, reply.type)

                return (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleSuggestedReplyClick(reply.text)}
                    className={cn(
                      "rounded-full bg-background/50 text-sm transition-all duration-300 hover:scale-105",
                      colorClass,
                      reply.type === "quick" && "px-4 py-2",
                      reply.type === "detailed" && "px-5 py-2.5"
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {icon && <span className="mr-1.5">{icon}</span>}
                    {reply.text}
                  </Button>
                )
              })}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-3">
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
    </div>
  )
}

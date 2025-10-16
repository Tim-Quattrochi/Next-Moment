"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Save, Sparkles, Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { useUser } from "@/lib/hooks/use-user"

interface JournalInterfaceProps {
  onBack: () => void
}

type JournalEntry = {
  id: string
  date: Date
  title?: string
  content: string
  wordCount: number
  aiInsights?: any
}

const prompts = [
  "What am I grateful for today?",
  "What challenged me, and how did I respond?",
  "What small victory can I celebrate?",
  "How am I feeling right now, and why?",
  "What do I need to let go of?",
  "What gives me hope today?",
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function JournalInterface({ onBack }: JournalInterfaceProps) {
  const { user } = useUser()
  const { data, mutate } = useSWR(user ? `/api/journal?userId=${user.id}` : null, fetcher)

  const [content, setContent] = useState("")
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [wordCount, setWordCount] = useState(0)

  const savedEntries: JournalEntry[] =
    data?.entries?.map((e: any) => ({
      id: e.id.toString(),
      date: new Date(e.date),
      title: e.title,
      content: e.content,
      wordCount: e.wordCount,
      aiInsights: e.aiInsights,
    })) || []

  useEffect(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    setWordCount(words.length)

    // Simulate AI suggestions as user types
    if (content.length > 50 && !aiSuggestion) {
      const timer = setTimeout(() => {
        setAiSuggestion("Consider exploring: What emotions are behind these thoughts?")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [content, aiSuggestion])

  const handleSave = async () => {
    if (!content.trim() || !user) return

    setIsGeneratingInsight(true)

    try {
      const aiInsight =
        "Your reflection shows courage and self-awareness. Remember, every entry is a step forward in understanding yourself better."

      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          content,
          wordCount,
          aiInsights: { suggestion: aiInsight },
        }),
      })

      await mutate()
      setContent("")
      setAiSuggestion(null)
      setShowHistory(true)
    } catch (error) {
      console.error("[v0] Error saving journal entry:", error)
    } finally {
      setIsGeneratingInsight(false)
    }
  }

  const handlePromptSelect = (prompt: string) => {
    setContent((prev) => (prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`))
    setShowPrompts(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Button onClick={onBack} variant="ghost" className="gap-2 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
            Back to Chat
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Journal</h1>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="ghost"
            className="gap-2 rounded-xl text-[#F59E0B] hover:bg-[#F59E0B]/10"
          >
            <Calendar className="h-5 w-5" />
            History
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main journal area */}
          <div className="lg:col-span-2">
            <div className="glass-strong rounded-3xl p-8 shadow-xl">
              {/* Date and word count */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <span>
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">{wordCount} words</span>
              </div>

              {/* Writing prompts dropdown */}
              <div className="mb-4">
                <button
                  onClick={() => setShowPrompts(!showPrompts)}
                  className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-[#F59E0B]/10 to-[#F59E0B]/5 px-4 py-3 text-left transition-all hover:from-[#F59E0B]/20 hover:to-[#F59E0B]/10"
                >
                  <span className="flex items-center gap-2 font-medium text-[#F59E0B]">
                    <Sparkles className="h-4 w-4" />
                    Writing Prompts
                  </span>
                  <ChevronDown
                    className={cn("h-5 w-5 text-[#F59E0B] transition-transform", showPrompts && "rotate-180")}
                  />
                </button>

                {showPrompts && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-2 space-y-2 rounded-xl bg-muted/50 p-3 duration-300">
                    {prompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handlePromptSelect(prompt)}
                        className="w-full rounded-lg px-4 py-2 text-left text-sm transition-all hover:bg-background hover:shadow-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text area */}
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing... Let your thoughts flow freely. This is your safe space."
                className="min-h-[400px] resize-none border-0 bg-transparent text-base leading-relaxed focus-visible:ring-0"
              />

              {/* AI suggestion */}
              {aiSuggestion && (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 rounded-xl bg-gradient-to-r from-[#3B82F6]/10 to-[#10B981]/10 p-4 duration-500">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#3B82F6]">
                    <Sparkles className="h-4 w-4" />
                    AI Suggestion
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{aiSuggestion}</p>
                </div>
              )}

              {/* Save button */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={!content.trim() || isGeneratingInsight}
                  className="h-12 gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] px-8 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isGeneratingInsight ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save Entry
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar - Tips and History */}
          <div className="space-y-6">
            {/* Journaling tips */}
            <div className="glass-strong rounded-2xl p-6 shadow-lg">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <Sparkles className="h-5 w-5 text-[#F59E0B]" />
                Journaling Tips
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-[#10B981]">•</span>
                  <span>Write without judgment</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#3B82F6]">•</span>
                  <span>Focus on feelings, not just events</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F59E0B]">•</span>
                  <span>Be honest with yourself</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#8B5CF6]">•</span>
                  <span>Celebrate small wins</span>
                </li>
              </ul>
            </div>

            {/* Recent entries preview */}
            {showHistory && savedEntries.length > 0 && (
              <div className="glass-strong animate-in fade-in slide-in-from-right-4 rounded-2xl p-6 shadow-lg duration-500">
                <h3 className="mb-4 font-semibold text-foreground">Recent Entries</h3>
                <div className="space-y-3">
                  {savedEntries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="rounded-xl bg-muted/50 p-4 transition-all hover:bg-muted">
                      <div className="mb-2 text-xs text-muted-foreground">
                        {entry.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <p className="line-clamp-3 text-sm leading-relaxed text-foreground">{entry.content}</p>
                      {entry.aiInsights?.suggestion && (
                        <div className="mt-2 border-l-2 border-[#3B82F6] pl-3 text-xs italic text-muted-foreground">
                          {entry.aiInsights.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

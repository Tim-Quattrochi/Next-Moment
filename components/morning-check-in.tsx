"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"

interface MorningCheckInProps {
  onComplete: () => void
}

type Mood = {
  id: string
  label: string
  color: string
  gradient: string
  description: string
}

const moods: Mood[] = [
  {
    id: "peaceful",
    label: "Peaceful",
    color: "#10B981",
    gradient: "from-[#059669] to-[#10B981]",
    description: "Calm and centered",
  },
  {
    id: "hopeful",
    label: "Hopeful",
    color: "#3B82F6",
    gradient: "from-[#1E3A8A] to-[#3B82F6]",
    description: "Optimistic about today",
  },
  {
    id: "grateful",
    label: "Grateful",
    color: "#F59E0B",
    gradient: "from-[#F59E0B] to-[#FBBF24]",
    description: "Appreciating the moment",
  },
  {
    id: "struggling",
    label: "Struggling",
    color: "#8B5CF6",
    gradient: "from-[#7C3AED] to-[#8B5CF6]",
    description: "Having a tough time",
  },
  {
    id: "uncertain",
    label: "Uncertain",
    color: "#6B7280",
    gradient: "from-[#4B5563] to-[#6B7280]",
    description: "Not quite sure",
  },
]

const questions = [
  {
    id: "sleep",
    question: "How did you sleep last night?",
    options: ["Restful", "Okay", "Restless", "Didn't sleep well"],
  },
  {
    id: "energy",
    question: "What's your energy level?",
    options: ["Energized", "Moderate", "Low", "Exhausted"],
  },
  {
    id: "intention",
    question: "What's your intention for today?",
    options: ["Stay present", "Connect with others", "Practice self-care", "Take it one step at a time"],
  },
]

export function MorningCheckIn({ onComplete }: MorningCheckInProps) {
  const { user } = useUser()
  const [step, setStep] = useState(0)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId)
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = async () => {
    if (step === 0 && selectedMood) {
      setStep(1)
    } else if (step > 0 && step < questions.length) {
      setStep(step + 1)
    } else if (step === questions.length && user) {
      setIsSubmitting(true)
      try {
        await fetch("/api/check-ins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            mood: selectedMood,
            sleepQuality: questions[0].options.indexOf(answers.sleep) + 1,
            energyLevel: questions[1].options.indexOf(answers.energy) + 1,
            intentions: answers.intention,
          }),
        })
        onComplete()
      } catch (error) {
        console.error("[v0] Error submitting check-in:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const canProceed = step === 0 ? selectedMood !== null : answers[questions[step - 1]?.id] !== undefined

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8 flex justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-12 rounded-full transition-all duration-500",
                i <= step ? "bg-gradient-to-r from-[#3B82F6] to-[#10B981]" : "bg-muted",
              )}
            />
          ))}
        </div>

        {/* Content area */}
        <div className="glass-strong min-h-[500px] rounded-3xl p-8 shadow-2xl">
          {step === 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="mb-3 text-center text-3xl font-semibold text-foreground">Good morning</h2>
              <p className="mb-8 text-center text-lg text-muted-foreground">How are you feeling today?</p>

              <div className="grid gap-4 md:grid-cols-2">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl",
                      selectedMood === mood.id ? "ring-4 ring-offset-2" : "hover:shadow-lg",
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${mood.color}15, ${mood.color}25)`,
                      ringColor: selectedMood === mood.id ? mood.color : "transparent",
                    }}
                  >
                    <div
                      className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity", mood.gradient)}
                      style={{ opacity: selectedMood === mood.id ? 0.1 : 0 }}
                    />
                    <div className="relative">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xl font-semibold" style={{ color: mood.color }}>
                          {mood.label}
                        </h3>
                        {selectedMood === mood.id && (
                          <div
                            className="flex h-6 w-6 items-center justify-center rounded-full"
                            style={{ backgroundColor: mood.color }}
                          >
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{mood.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : step <= questions.length ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="mb-8 text-center text-2xl font-semibold text-foreground">
                {questions[step - 1].question}
              </h2>

              <div className="space-y-3">
                {questions[step - 1].options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(questions[step - 1].id, option)}
                    className={cn(
                      "glass w-full rounded-2xl p-5 text-left text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                      answers[questions[step - 1].id] === option
                        ? "bg-gradient-to-r from-[#3B82F6]/20 to-[#10B981]/20 ring-2 ring-[#3B82F6]"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">{option}</span>
                      {answers[questions[step - 1].id] === option && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3B82F6]">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between gap-4">
            <Button
              onClick={handleBack}
              disabled={step === 0}
              variant="outline"
              className="h-12 rounded-xl px-6 disabled:opacity-0 bg-transparent"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="h-12 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#10B981] px-8 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? "Saving..." : step === questions.length ? "Complete" : "Continue"}
              {step < questions.length && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Encouragement message */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Taking time to check in with yourself is an act of self-care
        </p>
      </div>
    </div>
  )
}

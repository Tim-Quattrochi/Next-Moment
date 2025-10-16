"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Sparkles, Trophy, Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { useUser } from "@/lib/hooks/use-user"

interface ProgressGardenProps {
  onBack: () => void
}

type Plant = {
  id: string
  name: string
  stage: number
  maxStage: number
  color: string
  milestone: string
  daysActive: number
}

type Achievement = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  date?: Date
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ProgressGarden({ onBack }: ProgressGardenProps) {
  const { user } = useUser()
  const { data } = useSWR(user ? `/api/milestones?userId=${user.id}` : null, fetcher)

  const [selectedPlant, setSelectedPlant] = useState<string | null>(null)

  const plants: Plant[] =
    data?.milestones?.map((m: any) => ({
      id: m.id.toString(),
      name: m.name,
      stage: Math.floor((m.progress / 100) * 5),
      maxStage: 5,
      color: m.type === "mindfulness" ? "#3B82F6" : m.type === "gratitude" ? "#F59E0B" : "#10B981",
      milestone: m.description,
      daysActive: Math.floor((Date.now() - new Date(m.unlockedAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
    })) || []

  const achievements: Achievement[] = [
    {
      id: "1",
      title: "First Step",
      description: "Completed your first check-in",
      icon: <Heart className="h-5 w-5" />,
      unlocked: plants.length > 0,
      date: plants.length > 0 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined,
    },
    {
      id: "2",
      title: "Week Warrior",
      description: "7 consecutive days of engagement",
      icon: <Trophy className="h-5 w-5" />,
      unlocked: plants.some((p) => p.daysActive >= 7),
      date: plants.some((p) => p.daysActive >= 7) ? new Date() : undefined,
    },
    {
      id: "3",
      title: "Reflection Master",
      description: "Complete 10 journal entries",
      icon: <Star className="h-5 w-5" />,
      unlocked: false,
    },
    {
      id: "4",
      title: "Growth Champion",
      description: "30 days of continuous progress",
      icon: <Sparkles className="h-5 w-5" />,
      unlocked: false,
    },
  ]

  const selectedPlantData = plants.find((p) => p.id === selectedPlant)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Button onClick={onBack} variant="ghost" className="gap-2 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
            Back to Chat
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Your Growth Garden</h1>
          <div className="w-24" /> {/* Spacer for alignment */}
        </div>

        {/* Garden visualization */}
        <div className="glass-strong mb-8 rounded-3xl p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-xl font-semibold text-foreground">Watch Your Progress Bloom</h2>
            <p className="text-muted-foreground">Each plant represents a different aspect of your recovery journey</p>
          </div>

          {plants.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>Start your journey to see your garden grow!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {plants.map((plant, index) => (
                <button
                  key={plant.id}
                  onClick={() => setSelectedPlant(plant.id)}
                  className={cn(
                    "glass group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-500 hover:scale-105 hover:shadow-xl",
                    selectedPlant === plant.id && "ring-4 ring-offset-2",
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    ringColor: selectedPlant === plant.id ? plant.color : "transparent",
                  }}
                >
                  {/* Plant visualization */}
                  <div className="mb-4 flex justify-center">
                    <div className="relative h-32 w-32">
                      {/* Pot */}
                      <div
                        className="absolute bottom-0 left-1/2 h-12 w-20 -translate-x-1/2 rounded-b-lg"
                        style={{ backgroundColor: `${plant.color}30` }}
                      />

                      {/* Plant stages */}
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                        {Array.from({ length: plant.stage }).map((_, i) => (
                          <div
                            key={i}
                            className="animate-in fade-in zoom-in duration-700"
                            style={{
                              animationDelay: `${i * 200}ms`,
                            }}
                          >
                            {i === plant.stage - 1 && plant.stage === plant.maxStage ? (
                              // Full bloom
                              <div
                                className="mx-auto h-16 w-16 animate-pulse rounded-full shadow-lg"
                                style={{
                                  backgroundColor: plant.color,
                                  boxShadow: `0 0 30px ${plant.color}80`,
                                }}
                              />
                            ) : (
                              // Growing stages
                              <div
                                className="mx-auto mb-1 rounded-full transition-all"
                                style={{
                                  width: `${8 + i * 4}px`,
                                  height: `${8 + i * 4}px`,
                                  backgroundColor: plant.color,
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Plant info */}
                  <h3 className="mb-2 font-semibold text-foreground">{plant.name}</h3>
                  <p className="mb-3 text-sm text-muted-foreground">{plant.milestone}</p>

                  {/* Progress bar */}
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(plant.stage / plant.maxStage) * 100}%`,
                        backgroundColor: plant.color,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Stage {plant.stage} of {plant.maxStage}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Selected plant details */}
          {selectedPlantData && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 rounded-2xl bg-gradient-to-br from-background to-muted/30 p-6 duration-500">
              <h3 className="mb-2 text-lg font-semibold" style={{ color: selectedPlantData.color }}>
                {selectedPlantData.name}
              </h3>
              <p className="mb-4 text-muted-foreground">
                You've been nurturing this for {selectedPlantData.daysActive} days. Keep going!
              </p>
              <div className="flex gap-2">
                <div
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: selectedPlantData.color }}
                >
                  {selectedPlantData.daysActive} days active
                </div>
                <div className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground">
                  {Math.round((selectedPlantData.stage / selectedPlantData.maxStage) * 100)}% complete
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="glass-strong rounded-3xl p-8 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Milestones & Achievements</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className={cn(
                  "glass rounded-2xl p-5 transition-all duration-500",
                  achievement.unlocked ? "bg-gradient-to-br from-[#10B981]/10 to-[#3B82F6]/10" : "opacity-50 grayscale",
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      achievement.unlocked
                        ? "bg-gradient-to-br from-[#3B82F6] to-[#10B981] text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold text-foreground">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {achievement.unlocked && achievement.date && (
                      <p className="mt-2 text-xs text-[#10B981]">Unlocked {achievement.date.toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Encouragement */}
        <div className="mt-6 text-center">
          <p className="text-balance text-muted-foreground">
            Every small step you take helps your garden grow. You're doing amazing.
          </p>
        </div>
      </div>
    </div>
  )
}

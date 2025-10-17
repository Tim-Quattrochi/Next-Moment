"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getStageConfig, getStageIndex, getStageProgress, STAGE_ORDER } from "@/lib/stage-ui-config"
import type { RecoveryStage } from "@/lib/types"

interface StageProgressIndicatorProps {
  currentStage: RecoveryStage
  className?: string
}

export function StageProgressIndicator({
  currentStage,
  className,
}: StageProgressIndicatorProps) {
  const currentIndex = getStageIndex(currentStage)
  const config = getStageConfig(currentStage)
  const progress = getStageProgress(currentStage)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={cn("w-full px-6 py-3", className)}>
      <div className="mx-auto max-w-4xl">
        {/* Mobile Compact View (hidden on md and up) */}
        <div className="md:hidden">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="glass mx-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-full px-5 py-3 shadow-lg transition-all hover:shadow-xl"
            style={{
              borderLeft: `4px solid ${config.color}`,
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
                  boxShadow: `0 0 15px ${config.color}40`,
                }}
              >
                <div className="h-3 w-3 rounded-full bg-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-foreground">
                  {config.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1}/{STAGE_ORDER.length} • {progress}%
                </span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </motion.button>

          {/* Expandable Stage Map for Mobile */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="glass mt-3 rounded-2xl p-4 shadow-lg">
                  <p className="mb-4 text-center text-xs font-medium text-muted-foreground">
                    Your Journey Progress
                  </p>
                  <div className="space-y-3">
                    {STAGE_ORDER.map((stage, index) => {
                      const stageConfig = getStageConfig(stage)
                      const isActive = index === currentIndex
                      const isCompleted = index < currentIndex
                      const isFuture = index > currentIndex

                      return (
                        <motion.div
                          key={stage}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "flex items-center gap-3 rounded-xl p-3 transition-all",
                            isActive && "bg-muted/50",
                            !isActive && "opacity-60"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                              isActive && "border-2 shadow-lg",
                              isCompleted && "border-emerald-500 bg-emerald-500",
                              isFuture && "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800"
                            )}
                            style={
                              isActive
                                ? {
                                    borderColor: stageConfig.color,
                                    background: `linear-gradient(135deg, ${stageConfig.color}, ${stageConfig.color}dd)`,
                                    boxShadow: `0 0 15px ${stageConfig.color}40`,
                                  }
                                : undefined
                            }
                          >
                            {isCompleted ? (
                              <svg
                                className="h-5 w-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <div
                                className={cn(
                                  "h-4 w-4 rounded-full",
                                  isActive ? "bg-white" : "bg-gray-400 dark:bg-gray-600"
                                )}
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={cn(
                                "text-sm font-medium",
                                isActive && "font-semibold"
                              )}
                              style={isActive ? { color: stageConfig.color } : undefined}
                            >
                              {stageConfig.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {stageConfig.description}
                            </p>
                          </div>
                          {isActive && (
                            <motion.div
                              className="shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-2 py-1 text-xs font-medium text-white"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              Now
                            </motion.div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Description (when collapsed) */}
          {!isExpanded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-center text-xs text-muted-foreground"
            >
              {config.description}
            </motion.p>
          )}
        </div>

        {/* Desktop Full View (hidden on mobile) */}
        <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {STAGE_ORDER.map((stage, index) => {
            const stageConfig = getStageConfig(stage)
            const isActive = index === currentIndex
            const isCompleted = index < currentIndex
            const isFuture = index > currentIndex

            return (
              <div key={stage} className="flex flex-1 items-center">
                <div className="relative flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: isActive ? 1.2 : 1,
                      opacity: 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                        isActive &&
                          `border-[${stageConfig.color}] bg-gradient-to-br ${stageConfig.gradient} shadow-lg`,
                        isCompleted && "border-emerald-500 bg-emerald-500",
                        isFuture && "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800"
                      )}
                      style={
                        isActive
                          ? {
                              borderColor: stageConfig.color,
                              boxShadow: `0 0 20px ${stageConfig.color}40`,
                            }
                          : undefined
                      }
                    >
                      {isCompleted ? (
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full",
                            isActive ? "bg-white" : "bg-gray-400 dark:bg-gray-600"
                          )}
                        />
                      )}
                    </div>

                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${stageConfig.color}40 0%, transparent 70%)`,
                        }}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </motion.div>

                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: isActive ? 1 : 0.5, y: 0 }}
                    className={cn(
                      "mt-2 text-xs font-medium transition-all",
                      isActive && "text-foreground",
                      !isActive && "text-muted-foreground"
                    )}
                    style={isActive ? { color: stageConfig.color } : undefined}
                  >
                    {stageConfig.name}
                  </motion.span>
                </div>

                {index < STAGE_ORDER.length - 1 && (
                  <div className="relative flex-1 px-2">
                    <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        initial={{ width: "0%" }}
                        animate={{
                          width: index < currentIndex ? "100%" : "0%",
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Current stage description */}
        <motion.div
          key={currentStage}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 text-center"
        >
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </motion.div>
      </div>
    </div>
    </div>
  )
}

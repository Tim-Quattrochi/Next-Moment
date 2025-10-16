"use client"

import { Shield } from "lucide-react"

interface CrisisButtonProps {
  onClick: () => void
}

export function CrisisButton({ onClick }: CrisisButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-2xl transition-all hover:scale-110 hover:shadow-[#8B5CF6]/50 focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/50 active:scale-95"
      aria-label="Crisis support - Get immediate help"
    >
      <Shield className="h-7 w-7" />
    </button>
  )
}

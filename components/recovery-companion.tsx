"use client"

import { useState } from "react"
import { ChatInterface } from "./chat-interface"
import { CrisisButton } from "./crisis-button"
import { MorningCheckIn } from "./morning-check-in"
import { ProgressGarden } from "./progress-garden"
import { JournalInterface } from "./journal-interface"

type View = "chat" | "check-in" | "garden" | "journal"

export function RecoveryCompanion() {
  const [currentView, setCurrentView] = useState<View>("chat")
  const [showCrisisModal, setShowCrisisModal] = useState(false)

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#1E3A8A]/5 via-background to-[#059669]/5">
      {/* Main content area */}
      <div className="h-full w-full">
        {currentView === "chat" && <ChatInterface onNavigate={setCurrentView} />}
        {currentView === "check-in" && <MorningCheckIn onComplete={() => setCurrentView("chat")} />}
        {currentView === "garden" && <ProgressGarden onBack={() => setCurrentView("chat")} />}
        {currentView === "journal" && <JournalInterface onBack={() => setCurrentView("chat")} />}
      </div>

      {/* Floating crisis support button - always accessible */}
      <CrisisButton onClick={() => setShowCrisisModal(true)} />

      {/* Crisis modal */}
      {showCrisisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-strong w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="mb-4 text-2xl font-semibold text-[#8B5CF6]">Crisis Support</h2>
            <p className="mb-6 leading-relaxed text-foreground">You're not alone. Help is available 24/7.</p>
            <div className="space-y-3">
              <a
                href="tel:988"
                className="block w-full rounded-xl bg-[#8B5CF6] px-6 py-4 text-center font-semibold text-white transition-all hover:bg-[#7C3AED] hover:shadow-lg"
              >
                Call 988 - Suicide & Crisis Lifeline
              </a>
              <a
                href="sms:741741"
                className="block w-full rounded-xl border-2 border-[#8B5CF6] px-6 py-4 text-center font-semibold text-[#8B5CF6] transition-all hover:bg-[#8B5CF6]/10"
              >
                Text HOME to 741741 - Crisis Text Line
              </a>
              <button
                onClick={() => setShowCrisisModal(false)}
                className="w-full rounded-xl px-6 py-4 text-center font-medium text-muted-foreground transition-all hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

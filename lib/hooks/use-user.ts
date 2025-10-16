"use client"

import { useUser as useStackUser } from "@stackframe/stack"

export function useUser() {
  const user = useStackUser({ or: "redirect" })

  return {
    user: user
      ? {
          id: user.id,
          email: user.primaryEmail || "",
          name: user.displayName || user.primaryEmail?.split("@")[0] || "User",
        }
      : null,
    isLoading: false,
  }
}

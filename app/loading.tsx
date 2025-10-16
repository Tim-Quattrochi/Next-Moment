export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#1E3A8A]/5 via-background to-[#059669]/5">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#3B82F6] border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading your wellness journey...</p>
      </div>
    </div>
  )
}

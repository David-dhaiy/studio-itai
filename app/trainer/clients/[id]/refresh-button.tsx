"use client"

import { useRouter } from "next/navigation"
import { RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RefreshButton({ label }: { label: string }) {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.refresh()}
      className="h-7 gap-1.5 text-xs"
    >
      <RefreshCwIcon className="size-3.5" />
      {label}
    </Button>
  )
}

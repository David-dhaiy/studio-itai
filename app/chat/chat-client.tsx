"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id?: string
  role: "user" | "assistant"
  content: string
  created_at?: string | null
}

// ─── Bubble ───────────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user"
  return (
    <div className={cn("flex", isUser ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "rounded-ts-sm bg-primary text-primary-foreground"
            : "rounded-te-sm bg-muted text-foreground"
        )}
      >
        {msg.content}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatClient({
  clientId,
  clientName,
  initialMessages,
}: {
  clientId: string
  clientName: string
  initialMessages: ChatMessage[]
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput("")
    setError(null)

    // Optimistically add user message
    const userMsg: ChatMessage = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, message: text }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? "שגיאה לא ידועה")
        // Remove optimistic user message on error
        setMessages((prev) => prev.slice(0, -1))
        setInput(text) // restore input
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ])
    } catch {
      setError("שגיאת רשת. בדוק חיבור לאינטרנט ונסה שוב.")
      setMessages((prev) => prev.slice(0, -1))
      setInput(text)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h1 className="text-base font-semibold">מאמן AI אישי</h1>
        <p className="text-xs text-muted-foreground">שלום, {clientName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-lg space-y-3">
          {messages.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm font-medium">שלום, {clientName}!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                אפשר לשאול על תרגילים, טכניקה, עומס או התאמות לתוכנית שלך.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={msg.id ?? i} msg={msg} />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-te-sm bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                <span className="animate-pulse">המאמן חושב...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border-t bg-destructive/5 px-4 py-2 text-center text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Safety notice */}
      <div className="border-t bg-muted/40 px-4 py-1.5 text-center text-xs text-muted-foreground">
        AI מאמן ייעוץ בלבד — לא תחליף לרופא. בכאב חד, עצור ופנה לאיש מקצוע.
      </div>

      {/* Input */}
      <div className="border-t bg-background px-4 py-3">
        <div className="mx-auto flex max-w-lg gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="שאל שאלה על האימון שלך..."
            disabled={isLoading}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="default"
          >
            שלח
          </Button>
        </div>
      </div>
    </div>
  )
}

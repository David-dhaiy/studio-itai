"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import ClientLogoutButton from "@/components/ui/client-logout-button"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id?: string
  role: "user" | "assistant"
  content: string
  created_at?: string | null
}

const EXAMPLE_QUESTIONS = [
  "איך עושים שכיבות סמיכה נכון?",
  "כמה זמן לנוח בין סטים?",
  "מה לעשות אם קשה לי בתרגיל?",
  "איך לדעת אם המשקל מתאים?",
]

// ─── Bubble ───────────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user"
  return (
    <div className={cn("flex", isUser ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
          isUser
            ? "rounded-ts-none bg-emerald-600 text-white"
            : "rounded-te-none bg-white border text-foreground dark:bg-muted dark:border-muted"
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

  const sendMessage = async (override?: string) => {
    const text = (override ?? input).trim()
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
        body: JSON.stringify({ message: text }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        const rawErr: string = data.error ?? ""
        const friendly =
          res.status === 401
            ? "נדרשת התחברות מחדש — כנס/י שוב לחשבון."
            : res.status === 404
              ? "לא נמצא חשבון לקוח. פנה/י למאמן שלך."
              : rawErr.includes("ANTHROPIC_API_KEY")
                ? "שירות ה-AI לא זמין כרגע. נסה/י שוב מאוחר יותר."
                : rawErr || "שגיאה בשליחת ההודעה. נסה/י שוב."
        setError(friendly)
        setMessages((prev) => prev.slice(0, -1))
        setInput(text)
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
    <div className="flex h-svh flex-col bg-slate-50 dark:bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white dark:bg-card px-4 py-3 shadow-sm">
        <div className="min-w-0 flex items-center gap-2.5">
          <span className="text-xl" aria-hidden="true">🤖</span>
          <div>
            <h1 className="text-sm font-bold">מאמן AI אישי</h1>
            <p className="text-xs text-muted-foreground">
              טכניקה, עומס, תרגילים או התאמות
            </p>
          </div>
        </div>
        <ClientLogoutButton />
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label="שיחה עם מאמן AI"
      >
        <div className="mx-auto max-w-lg space-y-3">
          {messages.length === 0 && (
            <div className="py-8">
              <div className="text-center space-y-2">
                <p className="text-2xl" aria-hidden="true">🤖</p>
                <p className="font-semibold">שלום, {clientName}!</p>
                <p className="text-sm text-muted-foreground">
                  שאלו על תרגילים, טכניקה, עומס או התאמות לתוכנית שלכם.
                </p>
              </div>
              <div className="mt-5 space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground text-center tracking-wide">
                  שאלות נפוצות
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      disabled={isLoading}
                      className="rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:bg-muted/60 disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={msg.id ?? i} msg={msg} />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-end" role="status" aria-live="polite">
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
        <div
          role="alert"
          className="border-t bg-destructive/5 px-4 py-2 text-center text-xs text-destructive"
        >
          {error}
        </div>
      )}

      {/* Safety notice */}
      <div className="border-t bg-amber-50/80 px-4 py-1.5 text-center text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
        ייעוץ בלבד — לא תחליף לרופא. בכאב חד, עצור ופנה לאיש מקצוע.
      </div>

      {/* Input */}
      <div className="border-t bg-white dark:bg-card px-4 py-3 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-lg gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="שאל שאלה על האימון שלך..."
            aria-label="שאלה לשליחה"
            disabled={isLoading}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            size="default"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            שלח
          </Button>
        </div>
      </div>
    </div>
  )
}

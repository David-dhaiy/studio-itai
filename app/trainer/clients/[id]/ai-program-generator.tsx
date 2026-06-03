"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { GeneratedPlan } from "@/app/api/programs/generate/route"
import { saveAiPlan } from "./actions"

// ─── Sub-components ───────────────────────────────────────────────────────────

function SafetyNotice({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-900/50 dark:bg-yellow-900/20">
      <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">
        הערות בטיחות
      </p>
      <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">{text}</p>
    </div>
  )
}

function ExerciseRow({
  ex,
}: {
  ex: { name: string; sets: number; reps: string; rest_seconds: number; instructions: string }
}) {
  const meta = [
    ex.sets ? `${ex.sets} סטים` : null,
    ex.reps,
    ex.rest_seconds ? `מנוחה ${ex.rest_seconds}″` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{ex.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>
      </div>
      {ex.instructions && (
        <p className="text-xs text-muted-foreground">{ex.instructions}</p>
      )}
    </div>
  )
}

function PlanPreview({ plan }: { plan: GeneratedPlan }) {
  return (
    <div className="space-y-4">
      {/* Plan header */}
      <div className="space-y-1">
        <h3 className="font-semibold">{plan.title}</h3>
        {plan.goal && <p className="text-sm text-muted-foreground">{plan.goal}</p>}
        {plan.notes && <p className="text-sm text-muted-foreground">{plan.notes}</p>}
      </div>

      {/* Safety notice */}
      {plan.safety_notes && <SafetyNotice text={plan.safety_notes} />}

      {/* Days */}
      {plan.days.map((day, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{day.day_title}</p>
              <Badge variant="secondary" className="text-xs">
                {day.day_of_week}
              </Badge>
            </div>
            <div className="space-y-2.5">
              {day.exercises.map((ex, j) => (
                <ExerciseRow key={j} ex={ex} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-muted-foreground text-center">
        זוהי תוכנית המלצה בלבד — יש לבדוק ולאשר לפני העברה ללקוח.
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AiProgramGenerator({ clientId }: { clientId: string }) {
  const router = useRouter()

  // Generate state
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [plan, setPlan] = useState<GeneratedPlan | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setStatus("loading")
    setErrorMsg(null)
    setPlan(null)
    setSaveStatus("idle")
    setSaveError(null)

    try {
      const res = await fetch("/api/programs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        const rawErr: string = data.error ?? ""
        const friendly =
          res.status === 401
            ? "נדרשת התחברות מחדש."
            : res.status === 404
              ? "לקוח לא נמצא."
              : rawErr.includes("ANTHROPIC_API_KEY")
                ? "שירות ה-AI לא מוגדר בשרת. פנה/י למנהל."
                : rawErr || "שגיאה ביצירת התוכנית. נסה/י שוב."
        setErrorMsg(friendly)
        setStatus("error")
        return
      }

      setPlan(data.plan)
      setStatus("success")
    } catch {
      setErrorMsg("בעיית חיבור. בדוק/י את האינטרנט ונסה/י שוב.")
      setStatus("error")
    }
  }

  const handleSave = async () => {
    if (!plan) return
    setSaveStatus("saving")
    setSaveError(null)

    const result = await saveAiPlan(clientId, plan)

    if (result.success) {
      setSaveStatus("saved")
      router.refresh()
    } else {
      setSaveError(result.error ?? "שגיאה בשמירה. נסה שוב.")
      setSaveStatus("error")
    }
  }

  return (
    <div className="space-y-4">
      {/* Generate button — shown when idle, error, or not yet saved */}
      {status !== "success" && (
        <Button
          onClick={handleGenerate}
          disabled={status === "loading"}
          variant={status === "error" ? "outline" : "default"}
          className={cn("w-full", status === "error" && "border-destructive text-destructive")}
        >
          {status === "loading"
            ? "יוצר תוכנית מותאמת..."
            : status === "error"
              ? "נסה שוב"
              : "צור תוכנית עם AI"}
        </Button>
      )}

      {/* Loading indicator */}
      {status === "loading" && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground animate-pulse">
              Claude מנתח את פרופיל הלקוח ויוצר תוכנית מותאמת...
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              זה עשוי לקחת 15–30 שניות
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generate error */}
      {status === "error" && errorMsg && (
        <Card className="border-destructive/50">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-destructive">{errorMsg}</p>
          </CardContent>
        </Card>
      )}

      {/* Plan preview + save */}
      {status === "success" && plan && (
        <div className="space-y-4">
          {/* Preview header */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {saveStatus === "saved" ? "תוכנית נשמרה" : "תצוגה מקדימה — טרם נשמר"}
            </p>
            {saveStatus !== "saved" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPlan(null)
                  setStatus("idle")
                  setSaveStatus("idle")
                }}
              >
                צור מחדש
              </Button>
            )}
          </div>

          <PlanPreview plan={plan} />

          {/* Save area */}
          {saveStatus === "saved" ? (
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
              <CheckIcon className="size-4 shrink-0 text-primary" />
              <span>התוכנית נשמרה בהצלחה ומופיעה בדשבורד</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {saveStatus === "error" && saveError && (
                <p className="text-center text-xs text-destructive">{saveError}</p>
              )}
              <Button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className="w-full"
              >
                {saveStatus === "saving" ? "שומר תוכנית..." : "שמור תוכנית"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { logWorkoutCompletion } from "./actions"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Exercise = {
  id: string
  name: string
  sets: number | null
  reps: string | null
  rest_seconds: number | null
  instructions: string | null
  sort_order: number | null
}

export type WorkoutDay = {
  id: string
  title: string
  day_of_week: string
  sort_order: number | null
  exercises: Exercise[]
}

// ─── Exercise Row ──────────────────────────────────────────────────────────────

function ExerciseRow({ ex }: { ex: Exercise }) {
  const tags = [
    ex.sets ? `${ex.sets} סטים` : null,
    ex.reps ?? null,
    ex.rest_seconds ? `מנוחה ${ex.rest_seconds}″` : null,
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-snug">{ex.name}</span>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      {ex.instructions && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {ex.instructions}
        </p>
      )}
    </div>
  )
}

// ─── Workout Day Card ──────────────────────────────────────────────────────────

export default function WorkoutDayCard({
  day,
  clientId,
  isCompleted: initialCompleted,
}: {
  day: WorkoutDay
  clientId: string
  isCompleted: boolean
}) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedExercises = [...day.exercises].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  const handleComplete = async () => {
    setIsLogging(true)
    setError(null)
    const result = await logWorkoutCompletion(clientId, day.id)
    if (result.success) {
      setIsCompleted(true)
    } else {
      setError(result.error ?? "שגיאה. נסה שוב.")
    }
    setIsLogging(false)
  }

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-sm transition-opacity",
        isCompleted && "opacity-80"
      )}
    >
      {/* Colored top strip */}
      <div className={cn("h-1 w-full", isCompleted ? "bg-green-400" : "bg-primary")} />

      <CardContent className="space-y-4 pt-4 pb-4">
        {/* Day header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold">{day.title}</h3>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {day.day_of_week}
          </Badge>
        </div>

        {/* Exercises */}
        <div className="divide-y">
          {sortedExercises.map((ex) => (
            <div key={ex.id} className="py-2.5 first:pt-0 last:pb-0">
              <ExerciseRow ex={ex} />
            </div>
          ))}
        </div>

        {/* Action area */}
        {error && <p className="text-xs text-destructive">{error}</p>}

        {isCompleted ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/50 dark:bg-green-900/20">
            <CheckIcon className="size-5 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                אימון הושלם!
              </p>
              <p className="text-xs text-green-600/80 dark:text-green-400/80">
                כל הכבוד, כך ממשיכים
              </p>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={isLogging}
            className="w-full h-11 text-base font-semibold"
            size="lg"
          >
            {isLogging ? "שומר..." : "✓  סיימתי אימון"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

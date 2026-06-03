"use client"

import { useState } from "react"
import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { logWorkoutCompletion } from "./actions"

// ─── Types (shared with page.tsx) ─────────────────────────────────────────────

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
  const meta = [
    ex.sets ? `${ex.sets} סטים` : null,
    ex.reps ? `${ex.reps}` : null,
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
    <Card className={cn(isCompleted && "opacity-80")}>
      <CardContent className="space-y-4 py-4">
        {/* Day Header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">{day.title}</h3>
          <Badge variant="secondary" className="shrink-0">
            {day.day_of_week}
          </Badge>
        </div>

        {/* Exercises */}
        <div className="space-y-3 divide-y">
          {sortedExercises.map((ex) => (
            <div key={ex.id} className="pt-3 first:pt-0">
              <ExerciseRow ex={ex} />
            </div>
          ))}
        </div>

        {/* Action Area */}
        {error && <p className="text-xs text-destructive">{error}</p>}

        {isCompleted ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-900/50 dark:bg-green-900/20">
            <CheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
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
            className="w-full"
            size="sm"
          >
            {isLogging ? "שומר..." : "סיימתי אימון"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

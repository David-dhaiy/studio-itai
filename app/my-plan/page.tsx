import { createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import WorkoutDayCard, { type WorkoutDay } from "./workout-day-card"

export const metadata = {
  title: "התוכנית שלי — סטודיו איתי",
}

// ─── Empty States ──────────────────────────────────────────────────────────────

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-10 text-center">
          <p className="font-medium">{title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function MyPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client: clientId } = await searchParams

  if (!clientId) {
    return (
      <EmptyCard
        title="קישור לא תקין"
        body="חסר מזהה לקוח. פנה למאמן שלך לקבלת קישור."
      />
    )
  }

  const supabase = await createAdminClient()

  // Fetch client info and workout in parallel
  const [{ data: client }, { data: workout }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, full_name, goal, fitness_level")
      .eq("id", clientId)
      .maybeSingle(),

    supabase
      .from("workouts")
      .select(
        `id, title, goal,
         workout_days (
           id, title, day_of_week, sort_order,
           exercises (
             id, name, sets, reps, rest_seconds, instructions, sort_order
           )
         )`
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!client) {
    return (
      <EmptyCard
        title="לקוח לא נמצא"
        body="המזהה שקיבלת אינו תקין. פנה למאמן שלך."
      />
    )
  }

  // Fetch completed workout_day ids for this client
  const { data: logs } = await supabase
    .from("workout_logs")
    .select("workout_day_id")
    .eq("client_id", clientId)

  const completedIds = new Set(
    (logs ?? []).map((l: { workout_day_id: string }) => l.workout_day_id)
  )

  // Sort days by sort_order
  const rawDays = (workout?.workout_days ?? []) as WorkoutDay[]
  const sortedDays = [...rawDays].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-lg space-y-6 p-4 pb-12">

        {/* Page Header */}
        <div className="pt-2 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">התוכנית שלי</h1>
          <p className="text-muted-foreground text-sm">שלום, {client.full_name}</p>
          {client.goal && (
            <p className="text-sm text-muted-foreground">מטרה: {client.goal}</p>
          )}
        </div>

        {/* Plan Content */}
        {!workout || sortedDays.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-medium">תוכנית האימון בדרך אליך</p>
              <p className="mt-2 text-sm text-muted-foreground">
                המאמן שלך יכין לך תוכנית בקרוב.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold">{workout.title}</h2>
              {workout.goal && (
                <p className="text-sm text-muted-foreground">{workout.goal}</p>
              )}
            </div>

            {sortedDays.map((day) => (
              <WorkoutDayCard
                key={day.id}
                day={day}
                clientId={clientId}
                isCompleted={completedIds.has(day.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

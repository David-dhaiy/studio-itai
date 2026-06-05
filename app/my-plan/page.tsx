import Link from "next/link"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import WorkoutDayCard, { type WorkoutDay } from "./workout-day-card"
import ClientLogoutButton from "@/components/ui/client-logout-button"

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

function NotLoggedIn() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="py-10 text-center space-y-4">
          <div className="space-y-1">
            <p className="font-semibold text-lg">ברוך/ה הבא/ה לסטודיו איתי</p>
            <p className="text-sm text-muted-foreground">
              כניסה לתוכנית האימון שלך
            </p>
          </div>
          <Link
            href="/client/login"
            className={buttonVariants({ variant: "default" }) + " w-full"}
          >
            כניסה לחשבון
          </Link>
          <p className="text-xs text-muted-foreground">
            עדיין לא נרשמת? פנה/י למאמן שלך לקבלת קישור הצטרפות.
          </p>
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
  const { client: devClientParam } = await searchParams

  // ── Primary: client session ──────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let clientId: string | null = null
  let isWrongRole = false   // logged in but has no client record

  if (user) {
    const { data: sessionClient } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
    if (sessionClient?.id) {
      clientId = sessionClient.id
    } else {
      isWrongRole = true
    }
  }

  // ── Dev fallback: ?client= query param ──────────────────────────────────────
  // TODO: Remove this fallback once all clients are migrated to auth
  if (!clientId && devClientParam) {
    clientId = devClientParam
  }

  if (!clientId && isWrongRole) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-4">
            <div className="space-y-1.5">
              <p className="font-semibold">החשבון שלך אינו חשבון לקוח</p>
              <p className="text-sm text-muted-foreground">
                אתה מחובר לחשבון שאינו לקוח.
                כדי לראות תוכנית אימון, התנתק/י והתחבר/י עם חשבון לקוח.
              </p>
            </div>
            <div className="space-y-2">
              <Link
                href="/client/login"
                className={cn(buttonVariants({ variant: "default" }), "w-full")}
              >
                כניסת לקוח
              </Link>
              <ClientLogoutButton redirectTo="/client/login" variant="outline" className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!clientId) {
    return <NotLoggedIn />
  }

  const admin = await createAdminClient()

  // Fetch client info and workout in parallel
  const [{ data: client }, { data: workout }] = await Promise.all([
    admin
      .from("clients")
      .select("id, full_name, goal, fitness_level")
      .eq("id", clientId)
      .maybeSingle(),

    admin
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
  const { data: logs } = await admin
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

  // Check if all current-plan days are completed
  const currentPlanCompletedCount = sortedDays.filter((d) =>
    completedIds.has(d.id)
  ).length
  const allDaysCompleted =
    sortedDays.length > 0 && currentPlanCompletedCount >= sortedDays.length

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-lg space-y-6 p-4 pb-12">

        {/* Page Header */}
        <div className="pt-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">התוכנית שלי</h1>
              <p className="text-muted-foreground text-sm">שלום, {client.full_name}</p>
              {client.goal && (
                <p className="text-sm text-muted-foreground">מטרה: {client.goal}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <ClientLogoutButton />
              {workout && (
                <a
                  href="/api/pdf/my-plan"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5"
                  )}
                >
                  <span aria-hidden>⬇</span>
                  הורד תוכנית כ-PDF
                </a>
              )}
            </div>
          </div>
        </div>

        {/* AI Coach CTA card */}
        <div className="rounded-xl border bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl">
              🤖
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">שאלה למאמן ה-AI</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                לא בטוחים איך לבצע תרגיל? שאלו כאן ותקבלו הסבר מיידי.
              </p>
            </div>
          </div>
          <Link
            href="/chat"
            className={buttonVariants({ variant: "default" }) + " mt-3 w-full"}
          >
            פתח צ׳אט עם מאמן AI
          </Link>
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

            {/* All workouts completed card */}
            {allDaysCompleted && (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-900/20">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ✓
                </div>
                <h3 className="mt-2 text-base font-bold text-green-700 dark:text-green-300">
                  השלמת את כל אימוני השבוע!
                </h3>
                <p className="mt-1 text-sm text-green-600/80 dark:text-green-400/80">
                  עבודה מצוינת. פנה/י למאמן שלך לתוכנית הבאה.
                </p>
                <Link
                  href="/chat"
                  className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-4"}
                >
                  שוחח/י עם מאמן ה-AI
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

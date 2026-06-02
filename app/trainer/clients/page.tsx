import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "לקוחות — סטודיו איתי",
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FITNESS_LABELS: Record<string, string> = {
  beginner: "מתחיל/ה",
  intermediate: "בינוני/ת",
  advanced: "מתקדם/ת",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActivityStatus(monthlyCount: number) {
  if (monthlyCount >= 8)
    return {
      label: "מתאמן סדיר",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    }
  if (monthlyCount >= 3)
    return {
      label: "פעילות חלקית",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    }
  return {
    label: "דורש מעקב",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function daysAgo(dateStr: string | null) {
  if (!dateStr) return "—"
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days === 0) return "היום"
  if (days === 1) return "אתמול"
  return `לפני ${days} ימים`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ message, body }: { message: string; body?: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-10 text-center">
          <p className="font-medium">{message}</p>
          {body && (
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-3 text-center">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function TrainerClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t: trainerId } = await searchParams

  // ── MVP auth guard ──────────────────────────────────────────────────────────
  // TODO (Task #7): Replace with real Supabase Auth session check.
  // For now, trainer_id is passed via ?t=[trainer_id] for development only.
  if (!trainerId) {
    return (
      <EmptyState
        message="חסר מזהה מאמן"
        body={`לצורך בדיקה, פתח את העמוד עם ?t=[trainer_id]`}
      />
    )
  }

  const supabase = await createAdminClient()

  // Validate trainer exists
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, full_name")
    .eq("id", trainerId)
    .maybeSingle()

  if (!trainer) {
    return (
      <EmptyState
        message="מאמן לא נמצא"
        body="המזהה שסופק אינו תקין. בדוק את ה-trainer_id."
      />
    )
  }

  // Fetch all clients for this trainer
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, goal, fitness_level, created_at, status")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false })

  if (clientsError) {
    return (
      <EmptyState
        message="שגיאה בטעינת הנתונים"
        body="נסה לרענן את הדף."
      />
    )
  }

  const clientList = clients ?? []
  const clientIds = clientList.map((c) => c.id)

  // Workout log stats (only if there are clients)
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )

  let monthCountByClient: Record<string, number> = {}
  let lastWorkoutByClient: Record<string, string> = {}

  if (clientIds.length > 0) {
    const [{ data: monthLogs }, { data: allLogs }] = await Promise.all([
      // Logs this calendar month
      supabase
        .from("workout_logs")
        .select("client_id, completed_at")
        .in("client_id", clientIds)
        .gte("completed_at", startOfMonth.toISOString()),

      // All logs — ordered desc so first per client = most recent
      supabase
        .from("workout_logs")
        .select("client_id, completed_at")
        .in("client_id", clientIds)
        .order("completed_at", { ascending: false }),
    ])

    for (const log of monthLogs ?? []) {
      monthCountByClient[log.client_id] =
        (monthCountByClient[log.client_id] ?? 0) + 1
    }

    for (const log of allLogs ?? []) {
      if (!lastWorkoutByClient[log.client_id]) {
        lastWorkoutByClient[log.client_id] = log.completed_at
      }
    }
  }

  // Derived summary stats
  const activeThisMonth = clientList.filter(
    (c) => (monthCountByClient[c.id] ?? 0) > 0
  ).length
  const needsAttention = clientList.filter(
    (c) => (monthCountByClient[c.id] ?? 0) <= 2
  ).length

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-2xl space-y-6 p-4 pb-12">

        {/* MVP dev notice */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-xs text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-300">
          <span className="font-semibold">מצב פיתוח:</span> גישה דרך{" "}
          <span dir="ltr" className="font-mono">?t=[trainer_id]</span> — Auth מלא יתווסף במטלה הבאה.
        </div>

        {/* Header */}
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">לקוחות סטודיו איתי</h1>
          <p className="text-sm text-muted-foreground">
            מעקב אחרי לקוחות, תוכניות והתקדמות
          </p>
          {trainer.full_name && (
            <p className="text-sm text-muted-foreground">
              מאמן: {trainer.full_name}
            </p>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="סה״כ לקוחות" value={clientList.length} />
          <StatCard label="פעילים החודש" value={activeThisMonth} />
          <StatCard label="דורשים מעקב" value={needsAttention} />
        </div>

        {/* Join link hint */}
        <div className="rounded-lg border bg-muted/40 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            קישור הצטרפות ללקוחות חדשים:
          </p>
          <p className="mt-0.5 font-mono text-xs select-all" dir="ltr">
            /join?t={trainerId}
          </p>
        </div>

        {/* Client list */}
        {clientList.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-medium">עדיין אין לקוחות</p>
              <p className="mt-2 text-sm text-muted-foreground">
                שלח ללקוחות שלך את קישור ההצטרפות למעלה.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {clientList.map((client) => {
              const monthCount = monthCountByClient[client.id] ?? 0
              const lastWorkout = lastWorkoutByClient[client.id] ?? null
              const status = getActivityStatus(monthCount)
              const fitnessLabel =
                FITNESS_LABELS[client.fitness_level] ?? client.fitness_level

              return (
                <Card key={client.id}>
                  <CardContent className="space-y-3 py-4">
                    {/* Name + status badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{client.full_name}</p>
                        {client.phone && (
                          <p
                            className="text-sm text-muted-foreground"
                            dir="ltr"
                          >
                            {client.phone}
                          </p>
                        )}
                        {client.email && (
                          <p
                            className="text-xs text-muted-foreground"
                            dir="ltr"
                          >
                            {client.email}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Goal + level badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {client.goal && (
                        <Badge variant="secondary" className="text-xs">
                          {client.goal}
                        </Badge>
                      )}
                      {fitnessLabel && (
                        <Badge variant="outline" className="text-xs">
                          {fitnessLabel}
                        </Badge>
                      )}
                    </div>

                    {/* Activity stats row */}
                    <div className="grid grid-cols-3 divide-x divide-x-reverse gap-0 rounded-lg bg-muted/50 text-center text-xs">
                      <div className="py-2 px-1">
                        <p className="text-base font-bold">{monthCount}</p>
                        <p className="text-muted-foreground">אימונים החודש</p>
                      </div>
                      <div className="py-2 px-1">
                        <p className="font-semibold">{daysAgo(lastWorkout)}</p>
                        <p className="text-muted-foreground">אימון אחרון</p>
                      </div>
                      <div className="py-2 px-1">
                        <p className="font-semibold">
                          {formatDate(client.created_at)}
                        </p>
                        <p className="text-muted-foreground">הצטרף/ה</p>
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/trainer/clients/${client.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "w-full"
                      )}
                    >
                      צפה בדשבורד
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

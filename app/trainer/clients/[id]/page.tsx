import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import AiProgramGenerator from "./ai-program-generator"
import RefreshButton from "./refresh-button"

// ─── Constants ────────────────────────────────────────────────────────────────

const FITNESS_LABELS: Record<string, string> = {
  beginner: "מתחיל/ה",
  intermediate: "בינוני/ת",
  advanced: "מתקדם/ת",
}

const SOURCE_LABELS: Record<string, string> = {
  demo: "דמו",
  manual: "ידני",
  ai: "AI",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActivityStatus(monthCount: number) {
  if (monthCount >= 8)
    return { label: "מתאמן סדיר", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" }
  if (monthCount >= 3)
    return { label: "פעילות חלקית", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" }
  return { label: "דורש מעקב", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function daysAgo(dateStr: string | null) {
  if (!dateStr) return "—"
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return "היום"
  if (days === 1) return "אתמול"
  return `לפני ${days} ימים`
}

function formatWhatsApp(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  if (!digits) return null
  return digits.startsWith("0") ? "972" + digits.slice(1) : digits
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value, dir }: { label: string; value: string | null; dir?: "ltr" }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className={cn("flex-1", dir === "ltr" && "font-mono text-start")} dir={dir}>
        {value}
      </span>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="shadow-sm bg-white dark:bg-card overflow-hidden">
      <div className="h-0.5 w-full bg-blue-400" />
      <CardContent className="py-3 text-center">
        <p className="text-2xl font-extrabold">{value}</p>
        {sub && <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{sub}</p>}
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pb-0.5">
      <div className="h-4 w-1 rounded-full bg-blue-500" />
      <h2 className="text-sm font-bold tracking-wide">{children}</h2>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <SectionHeader>{children}</SectionHeader>
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ClientDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: clientId } = await params

  // ── Auth + trainer ──────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/trainer/login")

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!trainer) redirect("/trainer/login")

  // ── Fetch all data in parallel ──────────────────────────────────────────────
  const admin = await createAdminClient()
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [
    { data: client },
    { data: workout },
    { data: recentLogs, count: totalCount },
    { data: monthLogs },
    { data: chatMessages },
  ] = await Promise.all([
    admin
      .from("clients")
      .select("id, full_name, phone, email, goal, fitness_level, limitations, available_days, created_at, status, trainer_id")
      .eq("id", clientId)
      .maybeSingle(),

    admin
      .from("workouts")
      .select(`id, title, goal, notes, source, created_at,
        workout_days(id, title, day_of_week, sort_order,
          exercises(id, name, sets, reps, rest_seconds, instructions, sort_order)
        )`)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    admin
      .from("workout_logs")
      .select("id, workout_day_id, completed_at, feedback, difficulty, workout_days(title)", {
        count: "exact",
      })
      .eq("client_id", clientId)
      .order("completed_at", { ascending: false })
      .limit(10),

    admin
      .from("workout_logs")
      .select("id")
      .eq("client_id", clientId)
      .gte("completed_at", startOfMonth.toISOString()),

    admin
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  // ── Security: client must belong to this trainer ────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!client || (client as any).trainer_id !== trainer.id) notFound()

  // ── Derived stats ───────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any
  const monthCount = monthLogs?.length ?? 0
  const lastWorkoutDate = recentLogs?.[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (recentLogs[0] as any).completed_at
    : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedDays = ((workout as any)?.workout_days ?? []).sort(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )
  const weeklyTarget = sortedDays.length
  const monthlyTarget = weeklyTarget * 4
  const completionPct =
    monthlyTarget > 0 ? Math.min(100, Math.round((monthCount / monthlyTarget) * 100)) : null

  const status = getActivityStatus(monthCount)
  const waPhone = formatWhatsApp(c.phone)
  const fitnessLabel = FITNESS_LABELS[c.fitness_level] ?? c.fitness_level

  return (
    <div className="min-h-svh bg-slate-50 dark:bg-background">
      <div className="mx-auto max-w-2xl space-y-6 p-4 pb-12">

        {/* Back + header */}
        <div className="space-y-3 pt-2">
          <Link
            href="/trainer/clients"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-me-2 -ms-2 text-blue-600 hover:text-blue-700")}
          >
            ← חזרה לרשימת לקוחות
          </Link>

          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight">{c.full_name}</h1>
              {c.phone && (
                <p className="text-sm text-muted-foreground" dir="ltr">{c.phone}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
                {status.label}
              </span>
              {waPhone && (
                <a
                  href={`https://wa.me/${waPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 1: Profile ──────────────────────────────────────────── */}
        <div className="space-y-2">
          <SectionTitle>פרופיל לקוח</SectionTitle>
          <Card>
            <CardContent className="space-y-2 py-4">
              <InfoRow label="אימייל" value={c.email} dir="ltr" />
              <InfoRow label="מטרה" value={c.goal} />
              <InfoRow label="רמת כושר" value={fitnessLabel} />
              {c.available_days?.length > 0 && (
                <InfoRow label="ימים פנויים" value={c.available_days.join(", ")} />
              )}
              {c.limitations && (
                <div className="flex gap-2 text-sm">
                  <span className="w-28 shrink-0 text-muted-foreground">מגבלות</span>
                  <span className="flex-1 whitespace-pre-line">{c.limitations}</span>
                </div>
              )}
              <InfoRow label="הצטרף/ה" value={formatDate(c.created_at)} />
            </CardContent>
          </Card>
        </div>

        {/* ── Section 2: Progress stats ───────────────────────────────────── */}
        <div className="space-y-2">
          <SectionTitle>התקדמות</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="אימונים החודש" value={monthCount} />
            <StatCard label="סה״כ אימונים" value={totalCount ?? 0} />
            <StatCard label="אימון אחרון" value={daysAgo(lastWorkoutDate)} />
            <StatCard
              label="השלמת יעד חודשי"
              value={completionPct !== null ? `${completionPct}%` : "—"}
              sub={completionPct !== null ? `${monthCount}/${monthlyTarget}` : undefined}
            />
          </div>

          {/* Progress bar */}
          {completionPct !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>יעד חודשי: {monthlyTarget} אימונים</span>
                <span>{completionPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    completionPct >= 80
                      ? "bg-green-500"
                      : completionPct >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  )}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Section 3: Current plan ─────────────────────────────────────── */}
        <div className="space-y-2">
          <SectionTitle>תוכנית נוכחית</SectionTitle>

          {!workout ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                עדיין אין תוכנית אימון ללקוח זה.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Workout header */}
              <Card>
                <CardContent className="space-y-1 py-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p className="font-semibold">{(workout as any).title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {SOURCE_LABELS[(workout as any).source] ?? (workout as any).source}
                    </Badge>
                  </div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(workout as any).goal && (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <p className="text-sm text-muted-foreground">{(workout as any).goal}</p>
                  )}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(workout as any).notes && (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <p className="text-xs text-muted-foreground">{(workout as any).notes}</p>
                  )}
                </CardContent>
              </Card>

              {/* Workout days */}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {sortedDays.map((day: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sortedEx = [...(day.exercises ?? [])].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                return (
                  <Card key={day.id}>
                    <CardContent className="space-y-3 py-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{day.title}</p>
                        <Badge variant="outline" className="text-xs">{day.day_of_week}</Badge>
                      </div>
                      <div className="space-y-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {sortedEx.map((ex: any) => {
                          const meta = [
                            ex.sets ? `${ex.sets} סטים` : null,
                            ex.reps,
                            ex.rest_seconds ? `מנוחה ${ex.rest_seconds}″` : null,
                          ].filter(Boolean).join(" · ")
                          return (
                            <div key={ex.id} className="space-y-0.5">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-sm font-medium">{ex.name}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>
                              </div>
                              {ex.instructions && (
                                <p className="text-xs text-muted-foreground">{ex.instructions}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Section 4: Workout log ──────────────────────────────────────── */}
        <div className="space-y-2">
          <SectionTitle>יומן אימונים</SectionTitle>

          {!recentLogs || recentLogs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                עדיין לא הושלמו אימונים.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y py-0">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recentLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start justify-between gap-2 py-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {log.workout_days?.title ?? "אימון"}
                      </p>
                      {log.feedback && (
                        <p className="text-xs text-muted-foreground">{log.feedback}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(log.completed_at)}
                      </p>
                      {log.difficulty != null && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          קושי: {log.difficulty}/5
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Section 5: AI Program Generator ────────────────────────────── */}
        <div className="space-y-2">
          <SectionTitle>יצירת תוכנית עם AI</SectionTitle>
          <AiProgramGenerator clientId={clientId} />
        </div>

        {/* ── Section 6: Chat preview ─────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle>שאלות אחרונות שהלקוח שאל את מאמן ה-AI</SectionTitle>
            <RefreshButton label="רענן שאלות" />
          </div>
          <p className="text-xs text-muted-foreground">
            כאן איתי יכול לראות במה הלקוח התקשה ומה כדאי לבדוק איתו באימון הבא.
          </p>

          {!chatMessages || chatMessages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                עדיין אין שאלות מהלקוח בצ׳אט.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y py-0">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {chatMessages.map((msg: any) => {
                  const isUser = msg.role === "user"
                  return (
                    <div
                      key={msg.id}
                      className={cn("py-3", !isUser && "opacity-70")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={isUser ? "default" : "outline"}
                          className="text-xs"
                        >
                          {isUser ? "הלקוח שאל" : "תשובת AI"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(msg.created_at)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-1.5 line-clamp-2 text-sm",
                          isUser ? "font-medium" : "text-muted-foreground"
                        )}
                      >
                        {msg.content}
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  )
}

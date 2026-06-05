import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ClientLogoutButton from "@/components/ui/client-logout-button"

export const metadata = {
  title: "סטודיו איתי — מערכת חכמה לניהול אימונים אישיים",
}

// ─── Logged-in states ─────────────────────────────────────────────────────────

function TrainerDashboard({ fullName }: { fullName: string }) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-blue-50/60 to-background">
      <div className="mx-auto max-w-md space-y-5 p-4 py-10 sm:py-16">
        <div className="text-center space-y-1">
          <p className="text-4xl">👨‍🏫</p>
          <h1 className="text-2xl font-bold tracking-tight">סטודיו איתי</h1>
        </div>
        <Card className="border-blue-200 bg-white shadow-sm">
          <CardContent className="py-6 space-y-4">
            <div className="rounded-lg bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-600 font-medium">מחובר/ת כמאמן</p>
              <p className="text-lg font-bold text-blue-900 mt-0.5">{fullName}</p>
            </div>
            <Link
              href="/trainer/clients"
              className={cn(buttonVariants({ variant: "default" }), "w-full min-h-11 bg-blue-600 hover:bg-blue-700")}
            >
              פאנל לקוחות
            </Link>
            <ClientLogoutButton redirectTo="/" variant="outline" className="w-full min-h-11" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ClientDashboard({ fullName }: { fullName: string }) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-emerald-50/60 to-background">
      <div className="mx-auto max-w-md space-y-5 p-4 py-10 sm:py-16">
        <div className="text-center space-y-1">
          <p className="text-4xl">🏋️‍♂️</p>
          <h1 className="text-2xl font-bold tracking-tight">סטודיו איתי</h1>
        </div>
        <Card className="border-emerald-200 bg-white shadow-sm">
          <CardContent className="py-6 space-y-4">
            <div className="rounded-lg bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-600 font-medium">מחובר/ת כלקוח</p>
              <p className="text-lg font-bold text-emerald-900 mt-0.5">{fullName}</p>
            </div>
            <div className="space-y-3">
              <Link
                href="/my-plan"
                className={cn(buttonVariants({ variant: "default" }), "w-full min-h-11 bg-emerald-600 hover:bg-emerald-700")}
              >
                התוכנית שלי
              </Link>
              <Link
                href="/chat"
                className={cn(buttonVariants({ variant: "outline" }), "w-full min-h-11 border-emerald-300 text-emerald-700 hover:bg-emerald-50")}
              >
                🤖 שאל את מאמן ה-AI
              </Link>
            </div>
            <ClientLogoutButton redirectTo="/" variant="outline" className="w-full min-h-11" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Guest home ───────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "1", text: "לקוח מצטרף דרך קישור מהמאמן" },
  { step: "2", text: "מקבל תוכנית אימון מותאמת אישית" },
  { step: "3", text: "מסמן אימונים שהושלמו" },
  { step: "4", text: "המאמן עוקב, מעדכן ומשפר" },
]

function GuestHome() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-50 to-background">
      <div className="mx-auto max-w-md space-y-6 p-4 py-10 sm:py-14">

        {/* Hero */}
        <div className="text-center space-y-2">
          <p className="text-5xl leading-none">🏋️‍♂️</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">סטודיו איתי</h1>
          <p className="text-base font-medium text-muted-foreground">
            מערכת חכמה לניהול אימונים אישיים
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            לקוחות מקבלים תוכנית אימון, מאמנים עוקבים אחרי התקדמות, וה-AI עוזר בשאלות יומיומיות.
          </p>
        </div>

        {/* Client card */}
        <Card className="border-emerald-200 bg-white shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-emerald-500" />
          <CardContent className="space-y-3 py-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏋️‍♂️</span>
              <h2 className="text-lg font-bold">לקוחות</h2>
            </div>
            <div className="space-y-3">
              <Link
                href="/client/login"
                className={cn(buttonVariants({ variant: "default" }), "w-full min-h-11 bg-emerald-600 hover:bg-emerald-700")}
              >
                כניסת לקוח
              </Link>
              <Link
                href="/my-plan"
                className={cn(buttonVariants({ variant: "outline" }), "w-full min-h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50")}
              >
                התוכנית שלי
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Trainer card */}
        <Card className="border-blue-200 bg-white shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-blue-500" />
          <CardContent className="space-y-3 py-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👨‍🏫</span>
              <h2 className="text-lg font-bold">מאמנים</h2>
            </div>
            <div className="space-y-3">
              <Link
                href="/trainer/login"
                className={cn(buttonVariants({ variant: "default" }), "w-full min-h-11 bg-blue-600 hover:bg-blue-700")}
              >
                כניסת מאמן
              </Link>
              <Link
                href="/trainer/register"
                className={cn(buttonVariants({ variant: "outline" }), "w-full min-h-11 border-blue-200 text-blue-700 hover:bg-blue-50")}
              >
                הרשמת מאמן
              </Link>
              <Link
                href="/trainer/clients"
                className={cn(buttonVariants({ variant: "outline" }), "w-full min-h-11 border-blue-200 text-blue-700 hover:bg-blue-50")}
              >
                פאנל לקוחות
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="bg-white shadow-sm">
          <CardContent className="py-5 space-y-3">
            <h3 className="font-bold text-sm text-muted-foreground tracking-wide">איך זה עובד?</h3>
            <ol className="space-y-3">
              {HOW_IT_WORKS.map(({ step, text }) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {step}
                  </span>
                  <span className="text-sm text-muted-foreground leading-snug">{text}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Help */}
        <div className="text-center space-y-1 pb-2">
          <Link
            href="/forgot-password"
            className="inline-block py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            🔐 שכחתי סיסמה
          </Link>
          <p className="text-xs text-muted-foreground">
            לקוח חדש? בקש קישור הצטרפות מהמאמן שלך.
          </p>
        </div>

      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: trainer } = await supabase
      .from("trainers")
      .select("id, full_name")
      .eq("user_id", user.id)
      .maybeSingle()

    if (trainer) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <TrainerDashboard fullName={(trainer as any).full_name ?? "מאמן"} />
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id, full_name")
      .eq("user_id", user.id)
      .maybeSingle()

    if (client) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <ClientDashboard fullName={(client as any).full_name ?? "לקוח"} />
    }
  }

  return <GuestHome />
}

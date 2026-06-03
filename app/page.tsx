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
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-md space-y-5 p-4 py-10">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">סטודיו איתי</h1>
        </div>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-5 space-y-4">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">מחובר/ת כ</p>
              <p className="font-semibold">מאמן — {fullName}</p>
            </div>
            <div className="space-y-2">
              <Link
                href="/trainer/clients"
                className={cn(buttonVariants({ variant: "default" }), "w-full")}
              >
                פאנל לקוחות
              </Link>
              <ClientLogoutButton redirectTo="/" variant="outline" className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ClientDashboard({ fullName }: { fullName: string }) {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-md space-y-5 p-4 py-10">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">סטודיו איתי</h1>
        </div>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-5 space-y-4">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">מחובר/ת כ</p>
              <p className="font-semibold">לקוח — {fullName}</p>
            </div>
            <div className="space-y-2">
              <Link
                href="/my-plan"
                className={cn(buttonVariants({ variant: "default" }), "w-full")}
              >
                התוכנית שלי
              </Link>
              <Link
                href="/chat"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                צ׳אט AI
              </Link>
              <ClientLogoutButton redirectTo="/" variant="outline" className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Guest home ───────────────────────────────────────────────────────────────

function SectionCard({
  emoji,
  title,
  children,
}: {
  emoji: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="space-y-2">{children}</div>
      </CardContent>
    </Card>
  )
}

function GuestHome() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-md space-y-6 p-4 py-10">

        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">סטודיו איתי</h1>
          <p className="text-muted-foreground">
            מערכת חכמה לניהול אימונים אישיים
          </p>
        </div>

        <SectionCard emoji="🏋️‍♂️" title="לקוחות">
          <Link
            href="/client/login"
            className={cn(buttonVariants({ variant: "default" }), "w-full")}
          >
            כניסת לקוח
          </Link>
          <Link
            href="/my-plan"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            התוכנית שלי
          </Link>
        </SectionCard>

        <SectionCard emoji="👨‍🏫" title="מאמנים">
          <Link
            href="/trainer/login"
            className={cn(buttonVariants({ variant: "default" }), "w-full")}
          >
            כניסת מאמן
          </Link>
          <Link
            href="/trainer/register"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            הרשמת מאמן
          </Link>
          <Link
            href="/trainer/clients"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            פאנל לקוחות
          </Link>
        </SectionCard>

        <SectionCard emoji="🔐" title="עזרה">
          <Link
            href="/forgot-password"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            שכחתי סיסמה
          </Link>
        </SectionCard>

        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">
            🤖 לקוח חדש מצטרף דרך קישור הצטרפות אישי שמקבל מהמאמן.
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
    // Check trainer role (RLS: user_id = auth.uid())
    const { data: trainer } = await supabase
      .from("trainers")
      .select("id, full_name")
      .eq("user_id", user.id)
      .maybeSingle()

    if (trainer) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <TrainerDashboard fullName={(trainer as any).full_name ?? "מאמן"} />
    }

    // Check client role
    const { data: client } = await supabase
      .from("clients")
      .select("id, full_name")
      .eq("user_id", user.id)
      .maybeSingle()

    if (client) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <ClientDashboard fullName={(client as any).full_name ?? "לקוח"} />
    }

    // Logged in but no role — show guest home (edge case)
    return <GuestHome />
  }

  return <GuestHome />
}

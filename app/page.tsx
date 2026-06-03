import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "סטודיו איתי — מערכת חכמה לניהול אימונים אישיים",
}

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

export default function HomePage() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-md space-y-6 p-4 py-10">

        {/* Hero */}
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">סטודיו איתי</h1>
          <p className="text-muted-foreground">
            מערכת חכמה לניהול אימונים אישיים
          </p>
        </div>

        {/* Clients */}
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

        {/* Trainers */}
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

        {/* Help */}
        <SectionCard emoji="🔐" title="עזרה">
          <Link
            href="/forgot-password"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            שכחתי סיסמה
          </Link>
        </SectionCard>

        {/* Client onboarding note */}
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">
            🤖 לקוח חדש מצטרף דרך קישור הצטרפות אישי שמקבל מהמאמן.
          </p>
        </div>

      </div>
    </div>
  )
}

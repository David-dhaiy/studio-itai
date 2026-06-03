import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import ResetPasswordForm from "./reset-password-form"

export const metadata = {
  title: "סיסמה חדשה — סטודיו איתי",
}

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No valid recovery session — show friendly message with link back
  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-4">
            <p className="font-semibold text-lg">הקישור שגוי או פג תוקף</p>
            <p className="text-sm text-muted-foreground">
              קישורי איפוס תקפים לשעה אחת ולשימוש חד-פעמי בלבד.
            </p>
            <Link
              href="/forgot-password"
              className={buttonVariants({ variant: "default" }) + " w-full"}
            >
              שלחו לי קישור חדש
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <ResetPasswordForm />
}

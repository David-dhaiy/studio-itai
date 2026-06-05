"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordForm({
  error,
}: {
  error?: string
}) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [submitError, setSubmitError] = useState<string | null>(
    error === "invalid_link" ? "הקישור שגוי או פג תוקפו. נסה/י שוב." : null
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setSubmitError("יש להזין כתובת אימייל.")
      return
    }
    setSubmitError(null)
    setStatus("sending")

    const supabase = createClient()
    // Uses token_hash flow via /auth/confirm (more reliable than PKCE /auth/callback)
    const redirectTo = `${window.location.origin}/auth/confirm?next=/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    )

    // Always show generic success — do not reveal whether the email exists
    setStatus("sent")
  }

  if (status === "sent") {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-2xl font-bold">בדוק/י את תיבת הדואר</p>
            <p className="text-sm text-muted-foreground">
              אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס הסיסמה.
            </p>
            <p className="text-xs text-muted-foreground">
              לא קיבלת? בדוק/י את תיקיית הספאם.
            </p>
            <Link
              href="/client/login"
              className="block text-sm text-primary hover:underline mt-2"
            >
              חזרה לכניסה
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">איפוס סיסמה</h1>
          <p className="text-sm text-muted-foreground">
            הזן/י את כתובת האימייל שלך ונשלח לך קישור לאיפוס.
          </p>
        </div>

        <Card>
          <CardContent className="pt-5 pb-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="israel@example.com"
                  autoComplete="email"
                  disabled={status === "sending"}
                  className="text-start"
                />
              </div>

              {submitError && (
                <p role="alert" className="text-sm text-destructive text-center">{submitError}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={status === "sending"}
              >
                {status === "sending" ? "שולח..." : "שלחו לי קישור איפוס"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/client/login" className="text-primary hover:underline">
            חזרה לכניסה
          </Link>
        </p>
      </div>
    </div>
  )
}

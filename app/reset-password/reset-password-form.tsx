"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { updatePassword } from "./actions"

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError("סיסמה חייבת להכיל לפחות 6 תווים.")
      return
    }
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות.")
      return
    }
    setError(null)
    setStatus("saving")

    const result = await updatePassword(password)

    if (result.success) {
      setStatus("done")
    } else {
      setError(result.error ?? "שגיאה לא ידועה")
      setStatus("idle")
    }
  }

  if (status === "done") {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-2xl font-bold">הסיסמה עודכנה!</p>
            <p className="text-sm text-muted-foreground">
              כעת תוכל/י להתחבר עם הסיסמה החדשה.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/client/login"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                כניסה ללקוח
              </Link>
              <Link
                href="/trainer/login"
                className="inline-flex h-8 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted transition-colors"
              >
                כניסה למאמן
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">סיסמה חדשה</h1>
          <p className="text-sm text-muted-foreground">
            הזן/י סיסמה חדשה לחשבון שלך.
          </p>
        </div>

        <Card>
          <CardContent className="pt-5 pb-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">סיסמה חדשה</Label>
                <PasswordInput
                  id="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="לפחות 6 תווים"
                  autoComplete="new-password"
                  disabled={status === "saving"}
                  className="text-start"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">אישור סיסמה</Label>
                <PasswordInput
                  id="confirm"
                  dir="ltr"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="הקלד/י שוב"
                  autoComplete="new-password"
                  disabled={status === "saving"}
                  className="text-start"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={status === "saving"}
              >
                {status === "saving" ? "שומר..." : "עדכן סיסמה"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

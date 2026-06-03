"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { loginClient } from "./actions"

export default function ClientLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError("יש למלא אימייל וסיסמה.")
      return
    }
    setError(null)
    setIsSubmitting(true)

    const result = await loginClient(email, password)

    if (result.success) {
      router.push("/my-plan")
      router.refresh()
    } else {
      setError(result.error ?? "שגיאה לא ידועה")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">כניסה לתוכנית שלי</h1>
          <p className="text-sm text-muted-foreground">סטודיו איתי</p>
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
                  disabled={isSubmitting}
                  className="text-start"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">סיסמה</Label>
                <PasswordInput
                  id="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="text-start"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "מתחבר..." : "כניסה"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-1.5">
          <Link
            href="/forgot-password"
            className="block text-sm text-primary hover:underline"
          >
            שכחתי סיסמה
          </Link>
          <p className="text-sm text-muted-foreground">
            עדיין לא נרשמת?{" "}
            <span className="text-foreground">
              פנה/י למאמן שלך לקבלת קישור הצטרפות.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

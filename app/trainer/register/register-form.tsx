"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { registerTrainer } from "./actions"

type FormData = {
  full_name: string
  email: string
  phone: string
  password: string
  confirm_password: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

const initial: FormData = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
}

function validate(form: FormData): FormErrors {
  const errors: FormErrors = {}
  if (!form.full_name.trim()) errors.full_name = "שם מלא הוא שדה חובה"
  if (!form.email.trim()) errors.email = "אימייל הוא שדה חובה"
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "כתובת אימייל לא תקינה"
  if (!form.password) errors.password = "סיסמה היא שדה חובה"
  else if (form.password.length < 6) errors.password = "סיסמה חייבת להכיל לפחות 6 תווים"
  if (form.password !== form.confirm_password)
    errors.confirm_password = "הסיסמאות אינן תואמות"
  return errors
}

export default function RegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(initial)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fieldErrors = validate(form)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setSubmitError(null)
    setIsSubmitting(true)

    const result = await registerTrainer({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      password: form.password,
    })

    if (result.success) {
      router.push("/trainer/clients")
    } else {
      setSubmitError(result.error ?? "שגיאה לא ידועה")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-b from-blue-50/60 to-background p-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-2 text-center">
          <p className="text-4xl">👨‍🏫</p>
          <h1 className="text-2xl font-bold tracking-tight">הרשמת מאמן</h1>
          <p className="text-sm text-muted-foreground">
            צרו חשבון מאמן וקבלו גישה מלאה לניהול לקוחות ותוכניות אימון.
          </p>
        </div>

        <Card>
          <CardContent className="pt-5 pb-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name */}
              <div className="space-y-1.5">
                <Label htmlFor="full_name">
                  שם מלא <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  placeholder="איתי אביבי"
                  autoComplete="name"
                  disabled={isSubmitting}
                />
                {errors.full_name && (
                  <p className="text-xs text-destructive">{errors.full_name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  אימייל <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="itay@studio.co.il"
                  autoComplete="email"
                  disabled={isSubmitting}
                  className="text-start"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  טלפון{" "}
                  <span className="text-xs text-muted-foreground">(אופציונלי)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="050-0000000"
                  autoComplete="tel"
                  disabled={isSubmitting}
                  className="text-start"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">
                  סיסמה <span className="text-destructive">*</span>
                </Label>
                <PasswordInput
                  id="password"
                  dir="ltr"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="לפחות 6 תווים"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="text-start"
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm_password">
                  אישור סיסמה <span className="text-destructive">*</span>
                </Label>
                <PasswordInput
                  id="confirm_password"
                  dir="ltr"
                  value={form.confirm_password}
                  onChange={(e) => update("confirm_password", e.target.value)}
                  placeholder="הקלד/י שוב את הסיסמה"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="text-start"
                />
                {errors.confirm_password && (
                  <p className="text-xs text-destructive">{errors.confirm_password}</p>
                )}
              </div>

              {submitError && (
                <p className="text-sm text-destructive text-center">{submitError}</p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "יוצר חשבון..." : "צור חשבון מאמן"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          כבר יש לך חשבון?{" "}
          <Link href="/trainer/login" className="text-primary hover:underline">
            התחבר/י כאן
          </Link>
        </p>
      </div>
    </div>
  )
}

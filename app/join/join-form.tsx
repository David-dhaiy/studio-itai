"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckIcon,
  TrendingDownIcon,
  DumbbellIcon,
  FlameIcon,
  ActivityIcon,
  HeartPulseIcon,
  HelpCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { submitJoinForm } from "./actions"

// ─── Constants ────────────────────────────────────────────────────────────────

const GOALS: { value: string; Icon: React.ElementType }[] = [
  { value: "ירידה במשקל",               Icon: TrendingDownIcon },
  { value: "עלייה במסת שריר",            Icon: DumbbellIcon },
  { value: "חיטוב",                      Icon: FlameIcon },
  { value: "כושר כללי",                  Icon: ActivityIcon },
  { value: "שיקום / חזרה לפעילות",       Icon: HeartPulseIcon },
  { value: "אחר",                        Icon: HelpCircleIcon },
]

const FITNESS_LEVELS = [
  { value: "beginner", label: "מתחיל/ה", desc: "חדש/ה בעולם הכושר" },
  { value: "intermediate", label: "בינוני/ת", desc: "מתאמן/ת לפעמים" },
  { value: "advanced", label: "מתקדם/ת", desc: "מתאמן/ת באופן קבוע" },
]

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]
const SESSIONS = ["2", "3", "4", "5"]

const STEP_LABELS = [
  "פרטים אישיים",
  "מטרת האימון",
  "כושר וזמינות",
  "בריאות ומגבלות",
  "אישור ושליחה",
]

const TOTAL_STEPS = STEP_LABELS.length

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  full_name: string
  phone: string
  email: string
  password: string
  confirm_password: string
  goal: string
  fitness_level: string
  available_days: string[]
  sessions_per_week: string
  limitations: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

const initialForm: FormData = {
  full_name: "",
  phone: "",
  email: "",
  password: "",
  confirm_password: "",
  goal: "",
  fitness_level: "",
  available_days: [],
  sessions_per_week: "3",
  limitations: "",
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, form: FormData): FormErrors {
  const errors: FormErrors = {}
  if (step === 1) {
    if (!form.full_name.trim()) errors.full_name = "שם מלא הוא שדה חובה"
    if (!form.phone.trim()) errors.phone = "מספר טלפון הוא שדה חובה"
    if (!form.email.trim()) errors.email = "אימייל הוא שדה חובה לצורך כניסה עתידית"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "כתובת אימייל לא תקינה"
    if (!form.password) errors.password = "סיסמה היא שדה חובה"
    else if (form.password.length < 6) errors.password = "סיסמה חייבת להכיל לפחות 6 תווים"
    if (form.password !== form.confirm_password) errors.confirm_password = "הסיסמאות אינן תואמות"
  }
  if (step === 2) {
    if (!form.goal) errors.goal = "יש לבחור מטרת אימון"
  }
  if (step === 3) {
    if (!form.fitness_level) errors.fitness_level = "יש לבחור רמת כושר"
    if (form.available_days.length === 0) errors.available_days = "יש לבחור לפחות יום אחד"
  }
  return errors
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const pct = ((current - 1) / (TOTAL_STEPS - 1)) * 100
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{STEP_LABELS[current - 1]}</span>
        <span>שלב {current} / {TOTAL_STEPS}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Step 1: Personal Info ────────────────────────────────────────────────────

function Step1({
  form,
  errors,
  update,
}: {
  form: FormData
  errors: FormErrors
  update: (f: keyof FormData, v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">
          שם מלא <span className="text-destructive">*</span>
        </Label>
        <Input
          id="full_name"
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          placeholder="ישראל ישראלי"
          autoComplete="name"
        />
        {errors.full_name && (
          <p className="text-xs text-destructive">{errors.full_name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">
          טלפון <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          dir="ltr"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="050-0000000"
          autoComplete="tel"
          className="text-start"
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone}</p>
        )}
      </div>

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
          placeholder="israel@example.com"
          autoComplete="email"
          className="text-start"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        האימייל והסיסמה ישמשו לכניסה עתידית לתוכנית שלך.
      </div>

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
          className="text-start"
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

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
          className="text-start"
        />
        {errors.confirm_password && (
          <p className="text-xs text-destructive">{errors.confirm_password}</p>
        )}
      </div>
    </div>
  )
}

// ─── Step 2: Goal ─────────────────────────────────────────────────────────────

function Step2({
  form,
  errors,
  update,
}: {
  form: FormData
  errors: FormErrors
  update: (f: keyof FormData, v: string) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        מה מטרת האימון שלך? <span className="text-destructive">*</span>
      </p>
      {errors.goal && (
        <p className="text-xs text-destructive">{errors.goal}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {GOALS.map(({ value, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => update("goal", value)}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-start text-sm leading-snug transition-colors",
              form.goal === value
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border hover:border-primary/40 hover:bg-muted/50"
            )}
          >
            <Icon className="size-4 opacity-70" />
            <span>{value}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 3: Fitness Level + Days ─────────────────────────────────────────────

function Step3({
  form,
  errors,
  update,
  toggleDay,
}: {
  form: FormData
  errors: FormErrors
  update: (f: keyof FormData, v: string) => void
  toggleDay: (day: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Fitness Level */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          רמת הכושר שלך <span className="text-destructive">*</span>
        </p>
        {errors.fitness_level && (
          <p className="text-xs text-destructive">{errors.fitness_level}</p>
        )}
        <div className="space-y-2">
          {FITNESS_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => update("fitness_level", level.value)}
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 text-start transition-colors",
                form.fitness_level === level.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <span className="block text-sm font-medium">{level.label}</span>
              <span className="text-xs text-muted-foreground">{level.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Available Days */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          אילו ימים פנויים לאימון? <span className="text-destructive">*</span>
        </p>
        {errors.available_days && (
          <p className="text-xs text-destructive">{errors.available_days}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                form.available_days.includes(day)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/40"
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions per week */}
      <div className="space-y-2">
        <p className="text-sm font-medium">כמה אימונים בשבוע?</p>
        <div className="flex gap-2">
          {SESSIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update("sessions_per_week", s)}
              className={cn(
                "flex-1 rounded-lg border py-2 text-sm font-medium transition-colors",
                form.sessions_per_week === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/40"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Health / Limitations ────────────────────────────────────────────

function Step4({
  form,
  update,
}: {
  form: FormData
  update: (f: keyof FormData, v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="limitations">מגבלות גופניות / כאבים / פציעות</Label>
        <Textarea
          id="limitations"
          value={form.limitations}
          onChange={(e) => update("limitations", e.target.value)}
          placeholder="לדוגמה: כאב גב תחתון, בעיית ברך, לחץ דם גבוה..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          מידע זה חשוב לבניית תוכנית בטוחה ומתאימה. אפשר להשאיר ריק אם אין מגבלות.
        </p>
      </div>
    </div>
  )
}

// ─── Step 5: Summary ─────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  dir,
  onEdit,
}: {
  label: string
  value: string
  dir?: "ltr"
  onEdit: () => void
}) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span
        className={cn("flex-1 text-sm break-words", dir === "ltr" && "font-mono text-start")}
        dir={dir}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs text-primary hover:underline"
      >
        ערוך
      </button>
    </div>
  )
}

function Step5({
  form,
  onEdit,
}: {
  form: FormData
  onEdit: (step: number) => void
}) {
  const fitnessLabel =
    FITNESS_LEVELS.find((l) => l.value === form.fitness_level)?.label ?? form.fitness_level

  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-medium">בדוק/י שהפרטים נכונים לפני השליחה</p>
      <div className="divide-y rounded-lg border text-sm">
        <SummaryRow label="שם מלא" value={form.full_name} onEdit={() => onEdit(1)} />
        <SummaryRow label="טלפון" value={form.phone} dir="ltr" onEdit={() => onEdit(1)} />
        {form.email && (
          <SummaryRow label="אימייל" value={form.email} dir="ltr" onEdit={() => onEdit(1)} />
        )}
        <SummaryRow label="מטרה" value={form.goal} onEdit={() => onEdit(2)} />
        <SummaryRow label="רמת כושר" value={fitnessLabel} onEdit={() => onEdit(3)} />
        <SummaryRow
          label="ימי אימון"
          value={form.available_days.join(", ")}
          onEdit={() => onEdit(3)}
        />
        <SummaryRow
          label="אימונים/שבוע"
          value={form.sessions_per_week}
          onEdit={() => onEdit(3)}
        />
        {form.limitations && (
          <SummaryRow label="מגבלות" value={form.limitations} onEdit={() => onEdit(4)} />
        )}
      </div>
    </div>
  )
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CheckIcon className="size-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">ברוך/ה הבא/ה!</h2>
            <p className="text-sm text-muted-foreground">
              הפרטים שלך נשמרו בהצלחה.
            </p>
            <p className="text-sm text-muted-foreground">
              המאמן יצור איתך קשר בקרוב עם תוכנית האימון האישית שלך.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Invalid Link Screen ──────────────────────────────────────────────────────

function InvalidLinkScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-10 text-center">
          <p className="text-base font-medium text-destructive">קישור הצטרפות לא תקין</p>
          <p className="mt-2 text-sm text-muted-foreground">
            פנה למאמן שלך לקבלת קישור תקין.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function JoinForm({ trainerId }: { trainerId?: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  if (!trainerId) return <InvalidLinkScreen />
  if (isDone) return <SuccessScreen />

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter((d) => d !== day)
        : [...prev.available_days, day],
    }))
    if (errors.available_days) setErrors((prev) => ({ ...prev, available_days: undefined }))
  }

  const goNext = () => {
    const stepErrors = validateStep(step, form)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setStep((s) => s + 1)
  }

  const goBack = () => {
    setErrors({})
    setSubmitError(null)
    setStep((s) => s - 1)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    const limitationsParts = [
      `מספר אימונים מבוקש בשבוע: ${form.sessions_per_week}`,
      form.limitations.trim(),
    ].filter(Boolean)

    const result = await submitJoinForm({
      trainer_id: trainerId,
      full_name: form.full_name,
      phone: form.phone,
      email: form.email.trim(),
      password: form.password,
      goal: form.goal,
      fitness_level: form.fitness_level,
      available_days: form.available_days,
      limitations: limitationsParts.length > 0 ? limitationsParts.join("\n") : null,
      sessions_per_week: form.sessions_per_week,
    })

    if (result.success) {
      // Session cookie was set server-side — navigate without query params
      router.push("/my-plan")
      return
    } else {
      setSubmitError(result.error ?? "שגיאה לא ידועה. נסה שוב.")
    }
    setIsSubmitting(false)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-5">
        {/* Page Header */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">הצטרפות לסטודיו איתי</h1>
          <p className="text-sm text-muted-foreground">
            כמה שאלות קצרות כדי שנוכל להתאים לך תוכנית אימון אישית
          </p>
        </div>

        {/* Progress */}
        <StepIndicator current={step} />

        {/* Form Card */}
        <Card>
          <CardContent className="pt-2 pb-2 space-y-1">
            {step === 1 && <Step1 form={form} errors={errors} update={update} />}
            {step === 2 && <Step2 form={form} errors={errors} update={update} />}
            {step === 3 && (
              <Step3 form={form} errors={errors} update={update} toggleDay={toggleDay} />
            )}
            {step === 4 && <Step4 form={form} update={update} />}
            {step === 5 && <Step5 form={form} onEdit={(s) => { setErrors({}); setStep(s) }} />}
          </CardContent>
        </Card>

        {/* Submit Error */}
        {submitError && (
          <p className="text-center text-sm text-destructive">{submitError}</p>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 ? (
            <Button variant="outline" onClick={goBack} className="flex-1">
              חזור
            </Button>
          ) : (
            <div className="flex-1" />
          )}

          {step < TOTAL_STEPS ? (
            <Button onClick={goNext} className="flex-1">
              הבא
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "שומר..." : "שמור והמשך לתוכנית שלי"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

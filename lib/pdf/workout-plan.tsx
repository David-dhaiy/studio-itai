import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"
import path from "path"

// ─── Font Registration ─────────────────────────────────────────────────────────

const fontPath = path.join(process.cwd(), "public/fonts/Heebo-Full.ttf")

Font.register({
  family: "Heebo",
  fonts: [
    { src: fontPath, fontWeight: "normal" },
    { src: fontPath, fontWeight: "bold" },
  ],
})

Font.registerHyphenationCallback((word) => [word])

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Heebo",
    backgroundColor: "#ffffff",
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 48,
  },

  // Header
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#111827",
  },
  studioName: {
    fontSize: 9,
    color: "#6b7280",
    textAlign: "right",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "right",
    color: "#111827",
    lineHeight: 1.2,
  },
  clientGoal: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 4,
  },

  // Plan metadata
  planMeta: {
    marginBottom: 20,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
    color: "#111827",
    marginBottom: 4,
  },
  planGoal: {
    fontSize: 10,
    color: "#4b5563",
    textAlign: "right",
  },

  // Day card
  dayCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  dayHeader: {
    backgroundColor: "#111827",
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "right",
  },
  dayOfWeek: {
    fontSize: 10,
    color: "#d1d5db",
    textAlign: "left",
  },
  exerciseList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },

  // Exercise
  exerciseRow: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  exerciseRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  exerciseName: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "right",
    color: "#111827",
    marginBottom: 3,
  },
  exerciseMeta: {
    fontSize: 9,
    color: "#6b7280",
    textAlign: "right",
    marginBottom: 3,
  },
  exerciseInstructions: {
    fontSize: 9,
    color: "#4b5563",
    textAlign: "right",
    lineHeight: 1.5,
  },

  // Safety note
  safetyNote: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fefce8",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  safetyText: {
    fontSize: 8.5,
    color: "#78350f",
    textAlign: "right",
    lineHeight: 1.6,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
})

// ─── Types ─────────────────────────────────────────────────────────────────────

type Exercise = {
  id: string
  name: string
  sets: number | null
  reps: string | null
  rest_seconds: number | null
  instructions: string | null
  sort_order: number | null
}

type WorkoutDay = {
  id: string
  title: string
  day_of_week: string
  sort_order: number | null
  exercises: Exercise[]
}

export type WorkoutPlanPDFProps = {
  clientName: string
  clientGoal: string | null
  workoutTitle: string
  workoutGoal: string | null
  days: WorkoutDay[]
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function WorkoutPlanPDF({
  clientName,
  clientGoal,
  workoutTitle,
  workoutGoal,
  days,
}: WorkoutPlanPDFProps) {
  const today = new Date().toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Document title={`תוכנית אימון — ${clientName}`} language="he">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.studioName}>סטודיו איתי</Text>
          <Text style={s.clientName}>{clientName}</Text>
          {clientGoal ? (
            <Text style={s.clientGoal}>מטרה: {clientGoal}</Text>
          ) : null}
        </View>

        {/* Plan metadata */}
        <View style={s.planMeta}>
          <Text style={s.planTitle}>{workoutTitle}</Text>
          {workoutGoal ? (
            <Text style={s.planGoal}>{workoutGoal}</Text>
          ) : null}
        </View>

        {/* Workout days */}
        {days.map((day, dayIdx) => {
          const sorted = [...day.exercises].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          )

          return (
            <View key={day.id} style={s.dayCard} wrap={false}>
              <View style={s.dayHeader}>
                <Text style={s.dayTitle}>{day.title}</Text>
                <Text style={s.dayOfWeek}>{day.day_of_week}</Text>
              </View>

              <View style={s.exerciseList}>
                {sorted.map((ex, exIdx) => {
                  const isLast = exIdx === sorted.length - 1
                  const metaParts = [
                    ex.sets ? `${ex.sets} סטים` : null,
                    ex.reps ?? null,
                    ex.rest_seconds ? `מנוחה ${ex.rest_seconds} שניות` : null,
                  ].filter(Boolean)

                  return (
                    <View
                      key={ex.id}
                      style={isLast ? s.exerciseRowLast : s.exerciseRow}
                    >
                      <Text style={s.exerciseName}>{ex.name}</Text>
                      {metaParts.length > 0 ? (
                        <Text style={s.exerciseMeta}>
                          {metaParts.join("  |  ")}
                        </Text>
                      ) : null}
                      {ex.instructions ? (
                        <Text style={s.exerciseInstructions}>
                          {ex.instructions}
                        </Text>
                      ) : null}
                    </View>
                  )
                })}
              </View>
            </View>
          )
        })}

        {/* Safety note */}
        <View style={s.safetyNote}>
          <Text style={s.safetyText}>
            {"הערת בטיחות: התחממ/י לפני כל אימון ושמור/י על טכניקה נכונה. " +
              "במקרה של כאב, הפסק/י את התרגיל ופנה/י לגורם מקצועי. " +
              "אל תאמן/י אם אינך מרגיש/ה טוב."}
          </Text>
        </View>

        {/* Footer */}
        <Text style={s.footer} fixed>
          {`נוצר ב-${today} | סטודיו איתי`}
        </Text>
      </Page>
    </Document>
  )
}

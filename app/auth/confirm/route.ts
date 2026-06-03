import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Handles token_hash-based OTP verification for:
// - Password reset (type=recovery)
// Called from the Supabase email template:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/reset-password"

  if (token_hash && type === "recovery") {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash,
    })

    if (!error) {
      console.info("[auth/confirm] recovery OTP verified, redirecting to:", next)
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error(
      "[auth/confirm] verifyOtp failed:",
      error.status,
      error.message,
      "| token prefix:", token_hash.substring(0, 8) + "..."
    )
  } else {
    console.warn("[auth/confirm] missing or wrong params:", {
      hasToken: !!token_hash,
      type,
    })
  }

  return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`)
}

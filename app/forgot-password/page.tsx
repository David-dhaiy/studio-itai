import ForgotPasswordForm from "./forgot-password-form"

export const metadata = {
  title: "איפוס סיסמה — סטודיו איתי",
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return <ForgotPasswordForm error={error} />
}

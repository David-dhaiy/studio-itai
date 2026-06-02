import JoinForm from "./join-form"

export const metadata = {
  title: "הצטרפות לסטודיו איתי",
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t: trainerId } = await searchParams
  return <JoinForm trainerId={trainerId} />
}

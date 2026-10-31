import { redirect } from 'next/navigation'

export default async function LegacyMockTestsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = searchParams ? await searchParams : undefined
  const search = params ? new URLSearchParams() : null

  if (params && search) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        search.set(key, value)
      } else if (Array.isArray(value)) {
        for (const item of value) {
          search.append(key, item)
        }
      }
    }
  }

  const query = search && search.toString() ? `?${search.toString()}` : ''
  redirect(`/app/mock-tests${query}`)
}

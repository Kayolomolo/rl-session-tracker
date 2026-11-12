const PAGE = 1000

type Page<T> = { data: T[] | null; error: { message: string } | null }

/** Supabase geeft standaard maximaal 1000 rijen per verzoek; haal daarom pagina voor pagina op. */
export async function fetchAllRows<T>(fetchPage: (from: number, to: number) => PromiseLike<Page<T>>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await fetchPage(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) return rows
  }
}

interface FetcherOptions {
  url: string
  method: string
  query?: Record<string, unknown>
  body?: Record<string, unknown> | Record<string, unknown>[]
}
export async function apiFetcher<T = any>(options: FetcherOptions) {
  const response = await fetch(options.url, {method: options.method})
  const result = await response.json()
  return result as T
}
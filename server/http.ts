import 'server-only'
import type { ApiError } from '../lib/types'

export class ApiFailure extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export const apiError = (message: string, status: number): ApiFailure => new ApiFailure(message, status)

export const fail = (error: string, status: number): Response =>
  Response.json({ error } satisfies ApiError, { status })

export async function readJson<T extends object>(req: Request): Promise<Partial<T>> {
  try {
    const body: unknown = await req.json()
    if (body && typeof body === 'object') return body as Partial<T>
  } catch {}
  throw apiError('Invalid JSON body', 400)
}

// Maps thrown ApiFailures to their status; anything else is logged and returned as a 500.
export async function handleApi(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run()
  } catch (e) {
    if (e instanceof ApiFailure) return fail(e.message, e.status)
    console.error(e)
    return fail('Internal server error', 500)
  }
}

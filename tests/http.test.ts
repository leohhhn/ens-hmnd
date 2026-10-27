import { describe, expect, it, vi } from 'vitest'
import { apiError, handleApi, readJson } from '../server/http'

describe('handleApi', () => {
  it('passes responses through', async () => {
    const res = await handleApi(async () => Response.json({ ok: 1 }))
    expect(await res.json()).toEqual({ ok: 1 })
  })
  it('maps ApiFailure to its status', async () => {
    const res = await handleApi(async () => { throw apiError('taken', 409) })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'taken' })
  })
  it('turns unexpected errors into a logged, generic 500', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await handleApi(async () => { throw new Error('boom') })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
    spy.mockRestore()
  })
})

describe('readJson', () => {
  it('rejects bodies that are not JSON objects', async () => {
    await expect(readJson(new Request('http://x', { method: 'POST', body: 'nope' }))).rejects.toMatchObject({ status: 400 })
    await expect(readJson(new Request('http://x', { method: 'POST', body: '"s"' }))).rejects.toMatchObject({ status: 400 })
  })
})

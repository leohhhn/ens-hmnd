// viem errors carry a short, readable `shortMessage`; fall back to the normal message.
export function errMsg(e: unknown): string {
  if (e instanceof Error) {
    const short = (e as Error & { shortMessage?: unknown }).shortMessage
    return typeof short === 'string' ? short : e.message
  }
  return String(e)
}

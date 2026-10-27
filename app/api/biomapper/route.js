import { isAddress } from 'viem'
import { getConfig } from '../../../lib/config'
import { checkBiomapped } from '../../../lib/biomapper'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lets the UI show verification status before the user signs a claim. The claim route re-checks.
export async function GET(req) {
  const c = getConfig()
  if (!c.biomapperLog) return Response.json({ enabled: false })
  const address = new URL(req.url).searchParams.get('address')
  if (!isAddress(address ?? '')) return Response.json({ error: 'Invalid address' }, { status: 400 })
  try {
    const { ok, generation } = await checkBiomapped(c, address)
    return Response.json({ enabled: true, verified: ok, generation: String(generation) })
  } catch (e) {
    return Response.json({ error: `Could not check Biomapper: ${e?.shortMessage ?? e?.message ?? e}` }, { status: 502 })
  }
}

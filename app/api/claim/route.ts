import { isAddress, isHex, verifyMessage } from 'viem'
import { createOffchainClient, ChainName } from '@thenamespace/offchain-manager'
import { getConfig, type Config } from '../../../lib/config'
import { claimMessage } from '../../../lib/message'
import { errMsg } from '../../../lib/errors'
import type { ApiError, ClaimRequest, ClaimResponse } from '../../../lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Experimental: the SDK only takes ChainName values, the REST API takes a raw `coin` number.
// Field names follow the published OpenAPI spec; unverified for this endpoint.
async function writeRawCoinRecord(c: Config, label: string, address: string): Promise<string> {
  if (!c.restUrl) return 'skipped'
  const r = await fetch(`${c.restUrl}/api/v1/subnames`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-auth-token': c.apiKey ?? '' },
    body: JSON.stringify({
      parentName: c.parent,
      label,
      owner: address,
      addresses: [{ coin: c.coinType, value: address }],
    }),
  })
  return r.ok ? 'ok' : `failed (${r.status}): ${await r.text()}`
}

const fail = (error: string, status: number) => Response.json({ error } satisfies ApiError, { status })

export async function POST(req: Request) {
  const c = getConfig()
  if (!c.apiKey || !c.parent) return fail('Server not configured', 500)

  try {
    const { label, address, signature, issuedAt } = (await req.json()) as Partial<ClaimRequest>

    if (typeof label !== 'string' || !/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(label))
      return fail('Label: 3-32 chars, a-z 0-9 and hyphens, no leading/trailing hyphen', 400)
    if (typeof address !== 'string' || !isAddress(address)) return fail('Invalid address', 400)
    if (
      typeof signature !== 'string' || !isHex(signature) ||
      typeof issuedAt !== 'number' || !Number.isFinite(issuedAt) ||
      Math.abs(Date.now() - issuedAt) > 5 * 60_000
    )
      return fail('Missing signature or stale request', 400)

    const valid = await verifyMessage({ address, message: claimMessage(label, c.parent, address, issuedAt), signature })
    if (!valid) return fail('Bad signature', 401)

    const ns = createOffchainClient({ mode: 'sepolia', timeout: 10000, defaultApiKey: c.apiKey })
    const name = `${label}.${c.parent}`
    const { isAvailable } = await ns.isSubnameAvailable(name)
    if (!isAvailable) return fail(`${name} is taken`, 409)

    // A public demo with a real API key: one name per address so it can't be spammed
    // (Namespace caps a parent at 2,000 subnames).
    const existing = await ns.getFilteredSubnames({ parentName: c.parent, owner: address, page: 1, size: 1 })
    if (existing.totalItems > 0) return fail('This address already claimed a name', 409)

    // Humanode has no ChainName entry: write Ethereum (coin 60) + Default EVM so wallets that
    // only ask for coin 60 still land on a working address (same key on every EVM chain).
    await ns.createSubname({
      label,
      parentName: c.parent,
      owner: address,
      addresses: [
        { chain: ChainName.Ethereum, value: address },
        { chain: ChainName.Default, value: address },
      ],
      texts: [{ key: 'description', value: 'Claimed via Humanode ENS demo' }],
      metadata: [{ key: 'sender', value: address }],
    })
    return Response.json({ name, rawCoinRecord: await writeRawCoinRecord(c, label, address) } satisfies ClaimResponse)
  } catch (e) {
    console.error(e)
    return fail(errMsg(e), 500)
  }
}

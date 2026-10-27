import { getAddress, isAddress, isHex, verifyMessage } from 'viem'
import { createOffchainClient, ChainName } from '@thenamespace/offchain-manager'
import { features } from '../../../app.config'
import { getConfig } from '../../../server/config'
import { apiError, handleApi, readJson } from '../../../server/http'
import { claimMessage } from '../../../lib/message'
import { LABEL_RULE, isFresh, isLabel } from '../../../lib/validation'
import type { ClaimRequest, ClaimResponse } from '../../../lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  return handleApi(async () => {
    const c = getConfig()
    if (!c.apiKey || !c.parent) throw apiError('Server not configured', 500)

    const { label, address: rawAddress, signature, issuedAt } = await readJson<ClaimRequest>(req)

    if (!isLabel(label)) throw apiError(LABEL_RULE, 400)
    if (typeof rawAddress !== 'string' || !isAddress(rawAddress)) throw apiError('Invalid address', 400)
    const address = getAddress(rawAddress) // one canonical form, so the one-per-wallet check can't be dodged by casing
    if (typeof signature !== 'string' || !isHex(signature) || !isFresh(issuedAt))
      throw apiError('Missing signature or stale request', 400)

    const valid = await verifyMessage({ address, message: claimMessage(label, c.parent, address, issuedAt), signature })
    if (!valid) throw apiError('Bad signature', 401)

    const ns = createOffchainClient({ mode: 'sepolia', timeout: 10000, defaultApiKey: c.apiKey })
    const name = `${label}.${c.parent}`
    const { isAvailable } = await ns.isSubnameAvailable(name)
    if (!isAvailable) throw apiError(`${name} is taken`, 409)

    // A public demo with a real API key: one name per address so it can't be spammed
    // (Namespace caps a parent at 2,000 subnames).
    if (features.oneNamePerWallet) {
      const existing = await ns.getFilteredSubnames({ parentName: c.parent, owner: address, page: 1, size: 1 })
      if (existing.totalItems > 0) throw apiError('This address already claimed a name', 409)
    }

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
    return Response.json({ name } satisfies ClaimResponse)
  })
}

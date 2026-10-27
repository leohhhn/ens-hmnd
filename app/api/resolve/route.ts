import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { createOffchainClient } from '@thenamespace/offchain-manager'
import { getConfig } from '../../../lib/config'
import { errMsg } from '../../../lib/errors'
import type { ApiError, ResolveDebug, ResolveResponse } from '../../../lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Resolves against Sepolia ENS the way a Humanode dApp would: an L1 read, CCIP-Read handled by viem.
export async function GET(req: Request) {
  const c = getConfig()
  const name = (new URL(req.url).searchParams.get('name') || '').trim().toLowerCase()
  if (!name.includes('.')) return Response.json({ error: 'Pass a full name' } satisfies ApiError, { status: 400 })

  const l1 = createPublicClient({ chain: sepolia, transport: http(c.sepoliaRpc) })
  const look = async (coinType: number): Promise<string> => {
    try {
      return (await l1.getEnsAddress({ name, coinType: BigInt(coinType) })) ?? 'not set'
    } catch (e) {
      return `error: ${errMsg(e)}`
    }
  }
  const [humanode, ethereum, def, rawChainId] = await Promise.all([
    look(c.coinType),
    look(60),
    look(2 ** 31),
    // The SDK's ChainName enum stores EVM chains under the raw chain ID (Base = 8453), not the ENSIP-11 value.
    look(c.chainId),
  ])

  // Debug: separate "name missing in Namespace" from "resolver not wired up".
  const debug: ResolveDebug = { resolver: 'unknown', namespace: 'unknown' }
  try {
    debug.resolver = (await l1.getEnsResolver({ name })) ?? 'none'
  } catch (e) {
    debug.resolver = `error: ${errMsg(e)}`
  }
  try {
    const ns = createOffchainClient({ mode: 'sepolia', timeout: 10000 })
    const sub = await ns.getSingleSubname(name)
    debug.namespace = sub ? { owner: sub.owner, addresses: sub.addresses } : 'not found'
  } catch (e) {
    debug.namespace = `error: ${errMsg(e)}`
  }

  return Response.json({
    name,
    coinType: c.coinType,
    chainId: c.chainId,
    humanode,
    ethereum,
    default: def,
    rawChainId,
    debug,
  } satisfies ResolveResponse)
}

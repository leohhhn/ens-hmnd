import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { getConfig } from '../../../server/config'
import { apiError, handleApi } from '../../../server/http'
import { errMsg } from '../../../lib/errors'
import { DEFAULT_EVM_COIN_TYPE } from '../../../lib/validation'
import type { ResolveResponse } from '../../../lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Resolves against Sepolia ENS the way a Humanode dApp would: an L1 read, CCIP-Read handled by viem.
export async function GET(req: Request) {
  return handleApi(async () => {
    const c = getConfig()
    const name = (new URL(req.url).searchParams.get('name') || '').trim().toLowerCase()
    if (!name.includes('.')) throw apiError('Pass a full name', 400)

    const l1 = createPublicClient({ chain: sepolia, transport: http(c.sepoliaRpc) })
    const look = async (coinType: number): Promise<string> => {
      try {
        return (await l1.getEnsAddress({ name, coinType: BigInt(coinType) })) ?? 'not set'
      } catch (e) {
        return `error: ${errMsg(e)}`
      }
    }
    const [humanode, ethereum, def] = await Promise.all([look(c.coinType), look(60), look(DEFAULT_EVM_COIN_TYPE)])

    return Response.json({ name, coinType: c.coinType, humanode, ethereum, default: def } satisfies ResolveResponse)
  })
}

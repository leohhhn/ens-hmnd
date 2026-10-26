import { getConfig } from '../../../lib/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const c = getConfig()
  return Response.json({
    parent: c.parent, chainId: c.chainId, chainIdHex: c.chainIdHex,
    coinType: c.coinType, rpc: c.rpc, symbol: c.symbol,
  })
}

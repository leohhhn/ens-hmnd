import { createPublicClient, http, parseAbi } from 'viem'

// Read-only slice of BiomapperLog (humanode-network/biomapper-sdk, IBiomapperLogRead).
const abi = parseAbi([
  'function generationsHead() view returns (uint256)',
  'function generationBiomapping(address account, uint256 generationPtr) view returns (uint256)',
])

// Is `address` biomapped (one verified human, one address) in the CURRENT generation?
// Ignoring generations would let stale mappings through, so always check against the head.
// Throws if the RPC call fails, so callers fail closed.
export async function checkBiomapped(c, address) {
  const client = createPublicClient({ transport: http(c.rpc) })
  const log = c.biomapperLog
  const head = await client.readContract({ address: log, abi, functionName: 'generationsHead' })
  if (head === 0n) return { ok: false, generation: head }
  const mappedAt = await client.readContract({ address: log, abi, functionName: 'generationBiomapping', args: [address, head] })
  return { ok: mappedAt !== 0n, generation: head }
}

// Usage: npm run debug:resolve -- leon.hmnd-demo.eth [coinType]
// Traces one CCIP-Read lookup by hand: resolver call -> OffchainLookup revert -> gateway response.
import { createPublicClient, http, encodeFunctionData, decodeErrorResult, parseAbi, toHex, type Hex } from 'viem'
import { sepolia } from 'viem/chains'
import { namehash, normalize, packetToBytes } from 'viem/ens'

const [nameArg, coinArg] = process.argv.slice(2)
if (!nameArg) {
  console.error('Usage: npm run debug:resolve -- <full.name.eth> [coinType]')
  process.exit(1)
}
const name = normalize(nameArg)
const coin = BigInt(coinArg ?? 60)
const rpc = process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com'
const l1 = createPublicClient({ chain: sepolia, transport: http(rpc) })

const resolver = await l1.getEnsResolver({ name })
console.log('resolver:', resolver)

const inner = encodeFunctionData({
  abi: parseAbi(['function addr(bytes32,uint256) view returns (bytes)']),
  functionName: 'addr',
  args: [namehash(name), coin],
})
const resolveAbi = parseAbi(['function resolve(bytes name, bytes data) view returns (bytes)'])
const data = encodeFunctionData({
  abi: resolveAbi,
  functionName: 'resolve',
  args: [toHex(packetToBytes(name)), inner],
})

// Pull the revert payload out of viem's nested error chain.
function revertData(e: unknown): Hex | undefined {
  const walk = (e as { walk?: (fn: (x: unknown) => boolean) => unknown } | null)?.walk
  const hit = walk?.call(e, (x) => {
    const d = (x as { data?: unknown } | null)?.data
    return typeof d === 'string' && d.startsWith('0x')
  }) as { data?: Hex } | undefined
  return hit?.data
}

let payload: Hex | undefined
try {
  const r = await l1.call({ to: resolver ?? undefined, data })
  console.log('resolver answered directly (no CCIP-Read):', r.data)
} catch (e) {
  payload = revertData(e)
  if (!payload) {
    console.log('call failed, no revert data:', e instanceof Error ? e.message : e)
    process.exit(1)
  }
}
if (!payload) process.exit(0)

const offchain = parseAbi([
  'error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)',
])
const dec = decodeErrorResult({ abi: offchain, data: payload })
const [sender, urls, callData, callbackFunction] = dec.args as readonly [string, readonly string[], Hex, Hex, Hex]
console.log('OffchainLookup sender:', sender, '\nurls:', urls, '\ncallback:', callbackFunction)

for (const tpl of urls) {
  const url = tpl.replace('{sender}', sender).replace('{data}', callData)
  const post = !tpl.includes('{data}')
  const res = await fetch(
    url,
    post
      ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: callData, sender }) }
      : undefined,
  )
  console.log(`\n${post ? 'POST' : 'GET'} ${url.slice(0, 120)}...\n-> ${res.status}\n${(await res.text()).slice(0, 600)}`)
}

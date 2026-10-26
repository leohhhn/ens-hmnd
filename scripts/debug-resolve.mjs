// Usage: node scripts/debug-resolve.mjs leon.hmnd-demo.eth [coinType]
// Traces one CCIP-Read lookup by hand: resolver call -> OffchainLookup revert -> gateway response.
import { createPublicClient, http, encodeFunctionData, decodeErrorResult, parseAbi, toHex } from 'viem'
import { sepolia } from 'viem/chains'
import { namehash, normalize, packetToBytes } from 'viem/ens'

const name = normalize(process.argv[2])
const coin = BigInt(process.argv[3] ?? 60)
const rpc = process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com'
const l1 = createPublicClient({ chain: sepolia, transport: http(rpc) })

const resolver = await l1.getEnsResolver({ name })
console.log('resolver:', resolver)

const inner = encodeFunctionData({ abi: parseAbi(['function addr(bytes32,uint256) view returns (bytes)']), functionName: 'addr', args: [namehash(name), coin] })
const resolveAbi = parseAbi(['function resolve(bytes name, bytes data) view returns (bytes)'])
const data = encodeFunctionData({ abi: resolveAbi, functionName: 'resolve', args: [toHex(packetToBytes(name)), inner] })

let revertData
try {
  const r = await l1.call({ to: resolver, data })
  console.log('resolver answered directly (no CCIP-Read):', r.data)
} catch (e) {
  revertData = e.walk?.((x) => typeof x?.data === 'string' && x.data.startsWith('0x'))?.data
  if (!revertData) { console.log('call failed, no revert data:', e.shortMessage ?? e.message); process.exit(1) }
}
if (!revertData) process.exit(0)

const offchain = parseAbi(['error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)'])
const dec = decodeErrorResult({ abi: offchain, data: revertData })
const { sender, urls, callData } = dec.args
console.log('OffchainLookup sender:', sender, '\nurls:', urls, '\ncallback:', dec.args.callbackFunction)

for (const tpl of urls) {
  const url = tpl.replace('{sender}', sender).replace('{data}', callData)
  const post = !tpl.includes('{data}')
  const res = await fetch(url, post
    ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: callData, sender }) }
    : undefined)
  console.log(`\n${post ? 'POST' : 'GET'} ${url.slice(0, 120)}...\n-> ${res.status}\n${(await res.text()).slice(0, 600)}`)
}

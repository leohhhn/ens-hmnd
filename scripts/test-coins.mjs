// Usage (from the project root; reads your key from .env.local, nothing is printed):
//   node --env-file=.env.local scripts/test-coins.mjs base leon.hmnd-demo.eth
//   node --env-file=.env.local scripts/test-coins.mjs humanode-rest leon.hmnd-demo.eth
//
// base:           adds a Base address via the SDK, then resolves coin 8453 (what the SDK stores)
//                 and coin 2147492101 (ENSIP-11). Shows which convention clients can actually read.
// humanode-rest:  writes the ENSIP-11 Humanode coin type via the REST API (raw `coin` number).
//                 Needs NAMESPACE_REST_URL. The REST route is "create or update", so this sends the
//                 full address list to avoid dropping coin 60 / default.
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { createOffchainClient, ChainName } from '@thenamespace/offchain-manager'

const [mode, name] = process.argv.slice(2)
const { NAMESPACE_API_KEY, NAMESPACE_REST_URL, HUMANODE_CHAIN_ID = '14853' } = process.env
const rpc = process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com'
if (!NAMESPACE_API_KEY || !name || !['base', 'humanode-rest'].includes(mode)) {
  console.error('Usage: node --env-file=.env.local scripts/test-coins.mjs <base|humanode-rest> <full.name.eth>')
  process.exit(1)
}

const l1 = createPublicClient({ chain: sepolia, transport: http(rpc) })
const ns = createOffchainClient({ mode: 'sepolia', timeout: 10000, defaultApiKey: NAMESPACE_API_KEY })
const look = async (coin) => {
  try { return (await l1.getEnsAddress({ name, coinType: BigInt(coin) })) ?? 'not set' }
  catch (e) { return `error: ${e?.shortMessage ?? e?.message}` }
}

const sub = await ns.getSingleSubname(name)
if (!sub) { console.error(`${name} not found in Namespace`); process.exit(1) }
const addr = sub.owner

if (mode === 'base') {
  await ns.addAddressRecord(name, ChainName.Base, addr)
  console.log('wrote Base record. Resolving (the gateway may cache; rerun lookups if empty)...')
  console.log('coin 8453       (SDK convention):', await look(8453))
  console.log('coin 2147492101 (ENSIP-11):      ', await look(2 ** 31 + 8453))
} else {
  if (!NAMESPACE_REST_URL) { console.error('Set NAMESPACE_REST_URL'); process.exit(1) }
  const coin = 2 ** 31 + Number(HUMANODE_CHAIN_ID)
  const r = await fetch(`${NAMESPACE_REST_URL}/api/v1/subnames`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-auth-token': NAMESPACE_API_KEY },
    body: JSON.stringify({
      parentName: sub.parentName, label: sub.label, owner: addr,
      addresses: [{ coin: 60, value: addr }, { coin: 2 ** 31, value: addr }, { coin, value: addr }],
    }),
  })
  console.log('REST status:', r.status, (await r.text()).slice(0, 300))
  console.log(`coin ${coin} (Humanode ENSIP-11):`, await look(coin))
  console.log('coin 60 still set?:', await look(60))
}

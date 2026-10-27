// Usage: node --env-file=.env.local scripts/check-biomapper.mjs 0xAddress [0xAnotherAddress ...]
// Reads BiomapperLog on Humanode and reports whether each address is biomapped in the current generation.
// Run it with one address that completed the Biomapper scan and one that didn't, to confirm the reads.
import { createPublicClient, http, parseAbi, isAddress } from 'viem'

const { BIOMAPPER_LOG_ADDRESS, HUMANODE_RPC = 'https://explorer-rpc-http.testnet5.stages.humanode.io' } = process.env
const addrs = process.argv.slice(2)
if (!BIOMAPPER_LOG_ADDRESS || !addrs.length || !addrs.every(isAddress)) {
  console.error('Set BIOMAPPER_LOG_ADDRESS and pass one or more addresses')
  process.exit(1)
}
const abi = parseAbi([
  'function generationsHead() view returns (uint256)',
  'function generationsTail() view returns (uint256)',
  'function generationBiomapping(address account, uint256 generationPtr) view returns (uint256)',
  'function biomappingsHead(address account) view returns (uint256)',
])
const client = createPublicClient({ transport: http(HUMANODE_RPC) })
const read = (functionName, args) => client.readContract({ address: BIOMAPPER_LOG_ADDRESS, abi, functionName, args })

const head = await read('generationsHead')
console.log('generationsHead:', head, '(0 = no generation initialised)', '| tail:', await read('generationsTail'))
for (const a of addrs) {
  const inHead = head === 0n ? 0n : await read('generationBiomapping', [a, head])
  console.log(a, '\n  current generation:', inHead === 0n ? 'NOT biomapped' : `biomapped at block ${inHead}`,
    '\n  ever biomapped (biomappingsHead):', (await read('biomappingsHead', [a])) !== 0n)
}

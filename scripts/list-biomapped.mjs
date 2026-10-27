// Usage: node scripts/list-biomapped.mjs [pageSize]
// Lists addresses biomapped in the current generation (read-only), via the log's enumerator.
// Handy for finding a real verified address to test the check with, without any testnet funds.
import { createPublicClient, http, parseAbi, zeroAddress } from 'viem'

const { BIOMAPPER_LOG_ADDRESS = '0x3f2B3E471b207475519989369d5E4F2cAbd0A39F', HUMANODE_RPC = 'https://explorer-rpc-http.testnet5.stages.humanode.io' } = process.env
const abi = parseAbi([
  'function generationsHead() view returns (uint256)',
  'function listAddressesPerGeneration(uint256 generationPtr, address cursor, uint256 maxPageSize) view returns (address nextCursor, address[] biomappedAccounts)',
])
const client = createPublicClient({ transport: http(HUMANODE_RPC) })
const head = await client.readContract({ address: BIOMAPPER_LOG_ADDRESS, abi, functionName: 'generationsHead' })
const [next, accounts] = await client.readContract({
  address: BIOMAPPER_LOG_ADDRESS, abi, functionName: 'listAddressesPerGeneration',
  args: [head, zeroAddress, BigInt(process.argv[2] ?? 5)],
})
console.log('generation', head, '| addresses in first page:', accounts.length, '| more pages:', next !== zeroAddress)
accounts.forEach((a) => console.log(a))

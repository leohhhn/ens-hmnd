// Shared server-side config. Read lazily so `next build` works without env vars.
export function getConfig() {
  const chainId = Number(process.env.HUMANODE_CHAIN_ID || 14853)
  return {
    apiKey: process.env.NAMESPACE_API_KEY,
    parent: process.env.PARENT_NAME,
    sepoliaRpc: process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
    chainId,
    chainIdHex: '0x' + chainId.toString(16),
    // ENSIP-11: 0x80000000 | chainId. Plain arithmetic avoids JS's signed 32-bit bitwise ops.
    coinType: 2 ** 31 + chainId,
    rpc: process.env.HUMANODE_RPC || 'https://explorer-rpc-http.testnet5.stages.humanode.io',
    symbol: process.env.HUMANODE_SYMBOL || 'eHMND',
    restUrl: process.env.NAMESPACE_REST_URL || '',
  }
}

export const claimMessage = (label, parent, address, issuedAt) =>
  `Claim ${label}.${parent}\nAddress: ${address}\nIssued: ${issuedAt}`

import { defineChain, type Chain } from 'viem'
import type { PublicConfig } from './types'

// The Humanode chain as viem sees it, built from the server's public config so the
// page, wallet_addEthereumChain and sendTransaction all agree on one definition.
export function humanodeChain(cfg: PublicConfig): Chain {
  return defineChain({
    id: cfg.chainId,
    name: `Humanode ${cfg.chainId === 5234 ? 'Mainnet' : 'Testnet 5'}`,
    nativeCurrency: { name: cfg.symbol, symbol: cfg.symbol, decimals: 18 },
    rpcUrls: { default: { http: [cfg.rpc] } },
  })
}

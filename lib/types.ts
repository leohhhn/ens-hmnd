// Shapes shared by the API routes and the page.

export interface PublicConfig {
  parent: string | undefined
  chainId: number
  chainIdHex: `0x${string}`
  coinType: number
  rpc: string
  symbol: string
}

export interface ClaimRequest {
  label: string
  address: string
  signature: string
  issuedAt: number
}

export interface ClaimResponse {
  name: string
  rawCoinRecord: string
}

export interface ResolveDebug {
  resolver: string
  namespace: { owner?: string; addresses: Record<string, string> } | string
}

export interface ResolveResponse {
  name: string
  coinType: number
  chainId: number
  humanode: string
  ethereum: string
  default: string
  rawChainId: string
  debug: ResolveDebug
}

export interface ApiError {
  error: string
}

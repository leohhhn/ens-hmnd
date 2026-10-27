// Shapes shared by the API routes and the page.

export interface PublicConfig {
  parent: string | undefined
  productionParent: string
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
}

export interface ResolveResponse {
  name: string
  coinType: number
  humanode: string
  ethereum: string
  default: string
}

export interface ApiError {
  error: string
}

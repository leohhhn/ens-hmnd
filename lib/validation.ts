// Pure helpers shared by the page and the API routes.
export const LABEL_PATTERN = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/
export const LABEL_RULE = 'Label: 3-32 chars, a-z 0-9 and hyphens, no leading/trailing hyphen'
export const CLAIM_MAX_AGE_MS = 5 * 60_000

export const isLabel = (v: unknown): v is string => typeof v === 'string' && LABEL_PATTERN.test(v)
export const isAddr = (v: string): boolean => /^0x[0-9a-fA-F]{40}$/.test(v)
export const isFresh = (issuedAt: unknown, now = Date.now()): issuedAt is number =>
  typeof issuedAt === 'number' && Number.isFinite(issuedAt) && Math.abs(now - issuedAt) <= CLAIM_MAX_AGE_MS

/** ENSIP-19 default EVM coin type (0x80000000). */
export const DEFAULT_EVM_COIN_TYPE = 2 ** 31

/** ENSIP-11: 0x80000000 | chainId. Plain arithmetic avoids JS's signed 32-bit bitwise ops. */
export const evmCoinType = (chainId: number): number => DEFAULT_EVM_COIN_TYPE + chainId

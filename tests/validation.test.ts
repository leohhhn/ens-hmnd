import { describe, expect, it } from 'vitest'
import { claimMessage } from '../lib/message'
import { CLAIM_MAX_AGE_MS, evmCoinType, isAddr, isFresh, isLabel } from '../lib/validation'

describe('isLabel', () => {
  it.each(['alice', 'a-b', 'abc', 'a'.repeat(32)])('accepts %s', (l) => expect(isLabel(l)).toBe(true))
  it.each(['ab', '-abc', 'abc-', 'Alice', 'a_b', 'a.b', 'a'.repeat(33), '', 5, undefined])('rejects %s', (l) =>
    expect(isLabel(l)).toBe(false),
  )
})

describe('isFresh', () => {
  const now = 1_000_000_000
  it('accepts within the window, both directions', () => {
    expect(isFresh(now - CLAIM_MAX_AGE_MS, now)).toBe(true)
    expect(isFresh(now + 1000, now)).toBe(true)
  })
  it('rejects stale, future-skewed and non-numeric values', () => {
    expect(isFresh(now - CLAIM_MAX_AGE_MS - 1, now)).toBe(false)
    expect(isFresh(NaN, now)).toBe(false)
    expect(isFresh('1', now)).toBe(false)
  })
})

describe('evmCoinType', () => {
  it('follows ENSIP-11 for Humanode', () => {
    expect(evmCoinType(14853)).toBe(2147498501)
    expect(evmCoinType(5234)).toBe(2147488882)
  })
})

it('isAddr checks shape only', () => {
  expect(isAddr('0x' + 'a'.repeat(40))).toBe(true)
  expect(isAddr('0x123')).toBe(false)
})

it('claimMessage is stable (page and server must sign the same text)', () => {
  expect(claimMessage('leon', 'hmnd-demo.eth', '0xabc', 42)).toBe(
    'Claim leon.hmnd-demo.eth\nAddress: 0xabc\nIssued: 42',
  )
})

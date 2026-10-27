import { afterEach, describe, expect, it } from 'vitest'
import { assertAllowedParent, getConfig } from '../server/config'

describe('assertAllowedParent', () => {
  it('passes allowed parents and unset values', () => {
    expect(() => assertAllowedParent('hmnd-demo.eth', ['hmnd-demo.eth'])).not.toThrow()
    expect(() => assertAllowedParent(undefined, ['hmnd-demo.eth'])).not.toThrow()
  })
  it('rejects parents outside the allowlist', () => {
    expect(() => assertAllowedParent('other.eth', ['hmnd-demo.eth'])).toThrow(/allowedParents/)
  })
  it('accepts anything when the allowlist is null', () => {
    expect(() => assertAllowedParent('other.eth', null)).not.toThrow()
  })
})

describe('getConfig', () => {
  const env = { ...process.env }
  afterEach(() => { process.env = { ...env } })

  it('derives chain id hex and coin type', () => {
    process.env.HUMANODE_CHAIN_ID = '14853'
    delete process.env.PARENT_NAME
    const c = getConfig()
    expect(c.chainIdHex).toBe('0x3a05')
    expect(c.coinType).toBe(2147498501)
  })
  it('throws when PARENT_NAME is not allowed', () => {
    process.env.PARENT_NAME = 'evil.eth'
    expect(() => getConfig()).toThrow(/allowedParents/)
  })
})

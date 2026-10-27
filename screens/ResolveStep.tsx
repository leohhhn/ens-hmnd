'use client'

import { useState } from 'react'
import { useWallet } from '../context/WalletProvider'
import { errMsg } from '../lib/errors'
import type { ApiError, ResolveResponse } from '../lib/types'
import { isAddr } from '../lib/validation'
import { Out, type Status } from './Out'

export function ResolveStep({ name, setName, onTarget }: {
  name: string
  setName: (n: string) => void
  onTarget: (address: string | null) => void
}) {
  const { cfg } = useWallet()
  const [resolved, setResolved] = useState<Status | null>(null)

  async function doResolve() {
    const n = name.trim().toLowerCase()
    if (!n) return
    setResolved({ text: 'Resolving...' })
    try {
      const j = (await (await fetch('/api/resolve?name=' + encodeURIComponent(n))).json()) as ResolveResponse | ApiError
      if ('error' in j) return setResolved({ text: j.error, cls: 'bad' })
      setResolved({
        text:
          `${j.name}\n` +
          `Humanode (coin ${j.coinType}): ${j.humanode}\n` +
          `Ethereum (coin 60):        ${j.ethereum}\n` +
          `Default EVM (coin 2^31):   ${j.default}`,
      })
      // Prefer the chain-specific record; fall back to coin 60 (same EOA key works on every EVM chain).
      onTarget([j.humanode, j.ethereum, j.default].find(isAddr) ?? null)
    } catch (e) {
      setResolved({ text: errMsg(e), cls: 'bad' })
    }
  }

  return (
    <section>
      <h2>3. Resolve a name (reads Sepolia ENS)</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`alice.${cfg?.parent ?? 'yourdemo.eth'}`} autoComplete="off" />
      <button onClick={doResolve}>Resolve</button>
      <Out o={resolved} />
    </section>
  )
}

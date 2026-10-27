'use client'

import { useState } from 'react'
import { useWallet } from '../context/WalletProvider'
import { errMsg } from '../lib/errors'
import { claimMessage } from '../lib/message'
import type { ApiError, ClaimResponse } from '../lib/types'
import { Out, type Status } from './Out'

export function ClaimStep({ onClaimed }: { onClaimed: (name: string) => void }) {
  const { cfg, wallet, client } = useWallet()
  const [label, setLabel] = useState('')
  const [claim, setClaim] = useState<Status | null>(null)

  async function doClaim() {
    if (!cfg?.parent || !client?.account) return
    const l = label.trim().toLowerCase()
    if (!l) return setClaim({ text: 'Enter a label', cls: 'bad' })
    const issuedAt = Date.now()
    try {
      setClaim({ text: 'Waiting for signature...' })
      const signature = await client.signMessage({
        account: client.account,
        message: claimMessage(l, cfg.parent, client.account.address, issuedAt),
      })
      const r = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: l, address: client.account.address, signature, issuedAt }),
      })
      const j = (await r.json()) as ClaimResponse | ApiError
      if ('error' in j) return setClaim({ text: j.error, cls: 'bad' })
      setClaim({ text: `Claimed ${j.name}`, cls: 'ok' })
      onClaimed(j.name)
    } catch (e) {
      setClaim({ text: errMsg(e), cls: 'bad' })
    }
  }

  return (
    <section>
      <h2>2. Claim a name (no gas, just a signature)</h2>
      {cfg && cfg.parent !== cfg.productionParent && <p className="muted">Test registry: {cfg.parent}</p>}
      <div className="row">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="alice" autoComplete="off" />
        <span className="suffix">.{cfg?.parent}</span>
      </div>
      <button onClick={doClaim} disabled={wallet.status !== 'connected'}>Sign and claim</button>
      <Out o={claim} />
    </section>
  )
}

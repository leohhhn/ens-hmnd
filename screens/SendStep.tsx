'use client'

import { useState } from 'react'
import { parseEther } from 'viem'
import { useWallet } from '../context/WalletProvider'
import { errMsg } from '../lib/errors'
import { Out, type Status } from './Out'

export function SendStep({ target }: { target: string | null }) {
  const { client, chain } = useWallet()
  const [sent, setSent] = useState<Status | null>(null)

  async function doSend() {
    if (!target || !client?.account || !chain) return
    try {
      const hash = await client.sendTransaction({
        account: client.account,
        chain,
        to: target as `0x${string}`,
        value: parseEther('0.001'),
      })
      setSent({ text: `Sent to ${target}\ntx ${hash}`, cls: 'ok' })
    } catch (e) {
      setSent({ text: errMsg(e), cls: 'bad' })
    }
  }

  return (
    <section>
      <h2>4. Send on Humanode to the resolved name</h2>
      <p className="muted">Sends 0.001 of the native token to the resolved address. This is the only step that needs testnet gas.</p>
      <button onClick={doSend} disabled={!target || !client}>Send 0.001</button>
      <Out o={sent} />
    </section>
  )
}

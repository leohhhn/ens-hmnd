'use client'

import { useState } from 'react'
import { brand } from '../app.config'
import { WalletProvider } from '../context/WalletProvider'
import { ClaimStep } from '../screens/ClaimStep'
import { ConnectStep } from '../screens/ConnectStep'
import { ResolveStep } from '../screens/ResolveStep'
import { SendStep } from '../screens/SendStep'

export default function Page() {
  const [name, setName] = useState('')
  const [target, setTarget] = useState<string | null>(null)

  return (
    <WalletProvider>
      <main>
        <h1>{brand.name}</h1>
        <p className="sub">{brand.tagline}</p>
        <ConnectStep />
        <ClaimStep onClaimed={setName} />
        <ResolveStep name={name} setName={setName} onTarget={setTarget} />
        <SendStep target={target} />
      </main>
    </WalletProvider>
  )
}

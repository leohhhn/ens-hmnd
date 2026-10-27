'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createWalletClient, custom, type Chain, type WalletClient } from 'viem'
import { humanodeChain } from '../lib/chain'
import { errMsg } from '../lib/errors'
import type { ApiError, PublicConfig } from '../lib/types'

export type WalletState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected'; address: `0x${string}` }
  | { status: 'error'; message: string }

export interface WalletContext {
  cfg: PublicConfig | null
  cfgError: string | null
  chain: Chain | null
  wallet: WalletState
  /** Null until connected. Always bound to the Humanode chain. */
  client: WalletClient | null
  connect: () => Promise<void>
}

const Ctx = createContext<WalletContext | null>(null)

export function useWallet(): WalletContext {
  const v = useContext(Ctx)
  if (!v) throw new Error('useWallet must be used inside <WalletProvider>')
  return v
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [cfg, setCfg] = useState<PublicConfig | null>(null)
  const [cfgError, setCfgError] = useState<string | null>(null)
  const [wallet, setWallet] = useState<WalletState>({ status: 'disconnected' })

  useEffect(() => {
    fetch('/api/config')
      .then(async (r) => {
        const j = (await r.json()) as PublicConfig | ApiError
        if ('error' in j) throw new Error(j.error)
        setCfg(j)
      })
      .catch((e) => setCfgError(errMsg(e)))
  }, [])

  const chain = useMemo(() => (cfg ? humanodeChain(cfg) : null), [cfg])
  const client = useMemo(
    () =>
      chain && wallet.status === 'connected' && window.ethereum
        ? createWalletClient({ account: wallet.address, chain, transport: custom(window.ethereum) })
        : null,
    [chain, wallet],
  )

  const connect = useCallback(async () => {
    if (!chain) return
    setWallet({ status: 'connecting' })
    try {
      if (!window.ethereum) throw new Error('No browser wallet found')
      const probe = createWalletClient({ chain, transport: custom(window.ethereum) })
      const [address] = await probe.requestAddresses()
      try {
        await probe.switchChain({ id: chain.id })
      } catch {
        await probe.addChain({ chain })
      }
      setWallet({ status: 'connected', address })
    } catch (e) {
      setWallet({ status: 'error', message: errMsg(e) })
    }
  }, [chain])

  const value = useMemo(
    () => ({ cfg, cfgError, chain, wallet, client, connect }),
    [cfg, cfgError, chain, wallet, client, connect],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

'use client'

import { useWallet } from '../context/WalletProvider'
import { Out, type Status } from './Out'

export function ConnectStep() {
  const { cfg, cfgError, wallet, connect } = useWallet()
  const status: Status =
    cfgError ? { text: cfgError, cls: 'bad' }
    : wallet.status === 'connected' && cfg
      ? { text: `Connected ${wallet.address}\nChain ${cfg.chainId} (${cfg.chainIdHex})\nENS coin type ${cfg.coinType}`, cls: 'ok' }
    : wallet.status === 'error' ? { text: wallet.message, cls: 'bad' }
    : { text: wallet.status === 'connecting' ? 'Connecting...' : 'Not connected' }

  return (
    <section>
      <h2>1. Connect wallet (Humanode)</h2>
      <button onClick={connect} disabled={!cfg || wallet.status === 'connecting'}>Connect and switch network</button>
      <Out o={status} />
    </section>
  )
}

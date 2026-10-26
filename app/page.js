'use client'

import { useEffect, useState } from 'react'

const isAddr = (v) => typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v)
const claimMessage = (label, parent, address, issuedAt) =>
  `Claim ${label}.${parent}\nAddress: ${address}\nIssued: ${issuedAt}`

function Out({ o }) {
  return o ? <pre className={o.cls}>{o.text}</pre> : null
}

export default function Page() {
  const [cfg, setCfg] = useState(null)
  const [account, setAccount] = useState(null)
  const [label, setLabel] = useState('')
  const [name, setName] = useState('')
  const [target, setTarget] = useState(null)
  const [wallet, setWallet] = useState({ text: 'Not connected' })
  const [claim, setClaim] = useState(null)
  const [resolved, setResolved] = useState(null)
  const [sent, setSent] = useState(null)

  useEffect(() => {
    fetch('/api/config').then((r) => r.json()).then(setCfg)
  }, [])

  async function connect() {
    if (!window.ethereum) return setWallet({ text: 'No browser wallet found', cls: 'bad' })
    try {
      const [addr] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: cfg.chainIdHex }] })
      } catch {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: cfg.chainIdHex,
            chainName: 'Humanode ' + (cfg.chainId === 5234 ? 'Mainnet' : 'Testnet 5'),
            nativeCurrency: { name: cfg.symbol, symbol: cfg.symbol, decimals: 18 },
            rpcUrls: [cfg.rpc],
          }],
        })
      }
      setAccount(addr)
      setWallet({ text: `Connected ${addr}\nChain ${cfg.chainId} (${cfg.chainIdHex})\nENS coin type ${cfg.coinType}`, cls: 'ok' })
    } catch (e) {
      setWallet({ text: e.message || String(e), cls: 'bad' })
    }
  }

  async function doClaim() {
    const l = label.trim().toLowerCase()
    if (!l) return setClaim({ text: 'Enter a label', cls: 'bad' })
    const issuedAt = Date.now()
    try {
      setClaim({ text: 'Waiting for signature...' })
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [claimMessage(l, cfg.parent, account, issuedAt), account],
      })
      const r = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: l, address: account, signature, issuedAt }),
      })
      const j = await r.json()
      if (!r.ok) return setClaim({ text: j.error, cls: 'bad' })
      setClaim({ text: `Claimed ${j.name}\nRaw coin record: ${j.rawCoinRecord}`, cls: 'ok' })
      setName(j.name)
    } catch (e) {
      setClaim({ text: e.message || String(e), cls: 'bad' })
    }
  }

  async function doResolve() {
    const n = name.trim().toLowerCase()
    if (!n) return
    setResolved({ text: 'Resolving...' })
    const j = await (await fetch('/api/resolve?name=' + encodeURIComponent(n))).json()
    if (j.error) return setResolved({ text: j.error, cls: 'bad' })
    setResolved({
      text:
        `${j.name}\n` +
        `Humanode (coin ${j.coinType}): ${j.humanode}\n` +
        `Ethereum (coin 60):        ${j.ethereum}\n` +
        `Default EVM (coin 2^31):   ${j.default}\n` +
        `Raw chain ID (coin ${j.chainId}):  ${j.rawChainId}\n\n` +
        `Debug\n` +
        `Resolver on Sepolia: ${j.debug.resolver}\n` +
        `In Namespace: ${JSON.stringify(j.debug.namespace)}`,
    })
    // Prefer the chain-specific record; fall back to coin 60 (same EOA key works on every EVM chain).
    setTarget([j.humanode, j.ethereum, j.default].find(isAddr) || null)
  }

  async function doSend() {
    try {
      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: account, to: target, value: '0x38D7EA4C68000' }], // 0.001 * 1e18
      })
      setSent({ text: `Sent to ${target}\ntx ${hash}`, cls: 'ok' })
    } catch (e) {
      setSent({ text: e.message || String(e), cls: 'bad' })
    }
  }

  return (
    <main>
      <h1>Humanode ENS Demo</h1>
      <p className="sub">Claim a gasless offchain subname, then resolve it and send funds on Humanode.</p>

      <section>
        <h2>1. Connect wallet (Humanode)</h2>
        <button onClick={connect} disabled={!cfg}>Connect and switch network</button>
        <Out o={wallet} />
      </section>

      <section>
        <h2>2. Claim a name (no gas, just a signature)</h2>
        <div className="row">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="alice" autoComplete="off" />
          <span className="suffix">.{cfg?.parent}</span>
        </div>
        <button onClick={doClaim} disabled={!account}>Sign and claim</button>
        <Out o={claim} />
      </section>

      <section>
        <h2>3. Resolve a name (reads Sepolia ENS)</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`alice.${cfg?.parent ?? 'yourdemo.eth'}`} autoComplete="off" />
        <button onClick={doResolve}>Resolve</button>
        <Out o={resolved} />
      </section>

      <section>
        <h2>4. Send on Humanode to the resolved name</h2>
        <p className="muted">Sends 0.001 of the native token to the resolved address. This is the only step that needs testnet gas.</p>
        <button onClick={doSend} disabled={!target || !account}>Send 0.001</button>
        <Out o={sent} />
      </section>
    </main>
  )
}

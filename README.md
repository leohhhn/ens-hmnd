# Humanode ENS Demo

A small Next.js app showing how a Humanode user could get a human-readable ENS name, with no contracts deployed on Humanode and no gas to claim it. Names are offchain subnames issued through Namespace under a parent ENS name on Sepolia, and they resolve in any ENS-aware client.

## What it demonstrates

1. **Connect.** A wallet is added or switched to Humanode Testnet 5.
2. **Claim.** The user picks a label (`leon`) and signs a message. Nothing is sent onchain, so claiming costs no gas. The server checks the signature (it must be under 5 minutes old), checks the label is free and that the address hasn't already claimed a name (one per address, so a public demo can't exhaust the parent's 2,000-subname cap), then issues `leon.<parent>.eth` through Namespace's offchain subnames API. The API key stays server-side.
3. **Resolve.** The app reads Sepolia ENS the way any dApp would and shows the address records the name returns.
4. **Send.** The app sends 0.001 of the native token on Humanode to whatever the name resolved to. This is the only step that needs testnet gas.

The point it makes: Humanode users and dApps get working names today, and the only things ENS or Namespace need to know about Humanode are a chain ID and a coin type.

## How it works

- **ENS stays on Ethereum.** Resolution is an L1 read (Sepolia here), made by the app's server with viem. Humanode only receives the funds. A Humanode dApp therefore needs a mainnet or Sepolia RPC for lookups next to its Humanode RPC.
- **Names are offchain.** The parent name's resolver on Sepolia is Namespace's Hybrid Resolver. It answers lookups by sending the client to Namespace's gateway (CCIP-Read, EIP-3668), which returns the signed record. The user needs no ENS registration of their own.
- **Records written per claim.** Each claim stores the user's address under coin 60 (Ethereum) and under the default EVM coin type (`2^31`, ENSIP-19). Humanode is an EVM chain and an ordinary wallet has the same address on every EVM chain, so a client that asks for either one sends to a working address.
- **No Humanode-specific record.** Namespace's supported chain list doesn't include Humanode, so a REST write under the Humanode coin type is rejected (400). The Ethereum and default EVM records cover it.
- **Coin types.** A chain's record key is `0x80000000 | chainId` (ENSIP-11): `2147498501` for Testnet 5 and `2147488882` for mainnet.

## Networks

| | Chain ID | ENS coin type | RPC |
|---|---|---|---|
| Humanode Testnet 5 | 14853 (`0x3A05`) | 2147498501 | https://explorer-rpc-http.testnet5.stages.humanode.io |
| Humanode mainnet | 5234 (`0x1472`) | 2147488882 | https://explorer-rpc-http.mainnet.stages.humanode.io |

Source: https://gitbook.humanode.io/docs/chains.md. The same page lists Testnet 4 with chain ID 5234, which looks like a docs error. No EVM block explorer is listed (only Subscan on the Substrate side); transactions can be checked in the wallet or at https://evm-playground.testnet5.stages.humanode.io.

**Testnet gas.** Humanode's docs point to the Telegram faucet bot https://t.me/HumanodeTestnet5FaucetBot (`/gettokens`), which gives testnet HMND. A 2023 Humanode blog post says this must be swapped to the EVM-side token (eHMND); the swap page is https://gitbook.humanode.io/docs/evm/hmnd-ehmnd-swap.md. Faucet limits are not documented, and I did not confirm the swap requirement still applies.

## Where it stands

- **Working:** claim, resolution through the offchain resolver, and sending to the resolved address, using the Ethereum and default EVM records.
- **Missing:** a Humanode-specific record (the Resolve step shows "not set" for it). It matters only in the cases where one address per chain is required, such as a user who wants a different Humanode address, or a smart-contract wallet whose address isn't the same across chains. The remaining step is adding Humanode (chain IDs 5234 and 14853) to Namespace's supported chains, which would also give the SDK a `ChainName` entry.
- **Not covered:** reverse resolution (address to name), which Namespace's docs say offchain subnames don't support, and proof-of-personhood gating. The gating lives on the separate `biomapper` branch, which checks Humanode's Biomapper contract before allowing a claim. It is not part of `main`, and its files are still JavaScript.
- **Trust model:** Namespace's gateway and API key control the names. They aren't onchain assets.

## Not verified end to end

- Which testnet token symbol the wallet shows (HMND or eHMND); set by `HUMANODE_SYMBOL`.
- The one-name-per-address check in the claim route, which uses `getFilteredSubnames({ owner })`, was read from the SDK types but not exercised against the live API.
- The full signed-claim flow in a browser wallet on Humanode.

## Layout

Next.js 14 (App Router), React 18, viem and the Namespace offchain-manager SDK. Everything is TypeScript (`strict`), type-checked with `npm run typecheck`.

- `app.config.ts`: parent allowlist (`registry.allowedParents`, enforced at startup), brand copy and feature toggles.
- `app/page.tsx`: composes the four steps. `screens/` holds one component per step; `context/WalletProvider.tsx` owns the wallet state and a viem wallet client on the Humanode chain (`lib/chain.ts`).
- `app/api/claim/route.ts`: verifies the signature, issues the subname.
- `app/api/resolve/route.ts`: resolves against Sepolia.
- `app/api/config/route.ts`, `server/config.ts`: chain settings.
- `server/http.ts`: `handleApi`/`apiError`, the shared error handling for routes. `server/` imports `server-only` and never reaches the browser.
- `lib/`: code shared by page and routes: signed message format (`message.ts`), validation and coin-type math (`validation.ts`), types, error text.
- `global.d.ts`: types for the browser wallet (`window.ethereum`).
- `tests/`: vitest unit tests (`npm test`). `npm run lint`, and `npm run check:secrets` (after a build) scan for server code or the API key leaking into the client bundle. See `AGENTS.md` for the full check list.
- `scripts/check-client-boundary.mjs`: `npm run check:secrets`.
- `.env.example`: the server settings (Namespace API key, parent name, RPCs).

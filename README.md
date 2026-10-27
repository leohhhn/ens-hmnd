# Humanode ENS Demo

A small Next.js app showing how a Humanode user could get a human-readable ENS name, with no contracts deployed on Humanode and no gas to claim it. Names are offchain subnames issued through Namespace under a parent ENS name on Sepolia, and they resolve in any ENS-aware client.

## What it demonstrates

1. **Connect.** A wallet is added or switched to Humanode Testnet 5.
2. **Claim.** The user picks a label (`leon`) and signs a message. Nothing is sent onchain, so claiming costs no gas. The server verifies the signature and issues `leon.<parent>.eth` through Namespace's offchain subnames API.
3. **Resolve.** The app reads Sepolia ENS the way any dApp would and shows the address records the name returns, plus a debug line (the resolver in use and what Namespace holds for the name).
4. **Send.** The app sends 0.001 of the native token on Humanode to whatever the name resolved to. This is the only step that needs testnet gas.

The point it makes: Humanode users and dApps get working names today, and the only things ENS or Namespace need to know about Humanode are a chain ID and a coin type.

## How it works

- **ENS stays on Ethereum.** Resolution is an L1 read (Sepolia here), made by the app's server with viem. Humanode only receives the funds. A Humanode dApp therefore needs a mainnet or Sepolia RPC for lookups next to its Humanode RPC.
- **Names are offchain.** The parent name's resolver on Sepolia is Namespace's Hybrid Resolver. It answers lookups by sending the client to Namespace's gateway (CCIP-Read, EIP-3668), which returns the signed record. The user needs no ENS registration of their own.
- **Records written per claim.** Each claim stores the user's address under coin 60 (Ethereum) and under the default EVM coin type (`2^31`, ENSIP-19). Humanode is an EVM chain and an ordinary wallet has the same address on every EVM chain, so a client that asks for either one sends to a working address.
- **Coin types.** A chain's record key is `0x80000000 | chainId` (ENSIP-11): `2147498501` for Testnet 5 and `2147488882` for mainnet.

## Networks

| | Chain ID | ENS coin type | RPC |
|---|---|---|---|
| Humanode Testnet 5 | 14853 (`0x3A05`) | 2147498501 | https://explorer-rpc-http.testnet5.stages.humanode.io |
| Humanode mainnet | 5234 (`0x1472`) | 2147488882 | https://explorer-rpc-http.mainnet.stages.humanode.io |

Source: https://gitbook.humanode.io/docs/chains.md. The same page lists Testnet 4 with chain ID 5234, which looks like a docs error. No EVM block explorer is listed (only Subscan on the Substrate side); transactions can be checked in the wallet or at https://evm-playground.testnet5.stages.humanode.io.

**Testnet gas.** Humanode's docs point to the Telegram faucet bot https://t.me/HumanodeTestnet5FaucetBot (`/gettokens`), which gives testnet HMND. A 2023 Humanode blog post says this must be swapped to the EVM-side token (eHMND); the swap page is https://gitbook.humanode.io/docs/evm/hmnd-ehmnd-swap.md. Faucet limits are not documented, and I did not confirm the swap requirement still applies.

## Test results

Run against `leon.hmnd-demo.eth` on Sepolia:

| Check | Result |
|---|---|
| Resolve coin 60 | Returns the owner's address |
| Resolve default EVM (`2^31`) | Returns the owner's address |
| Resolver wiring | Lookups were empty until the parent's resolver was switched to the Hybrid Resolver; afterwards they resolved. The first resolver address in use was the wrong one. |
| Add a Base address via the SDK, then resolve | Found under the ENSIP-11 coin type (`2147492101`), not under the raw chain ID (`8453`). Namespace converts chain IDs to ENSIP-11 on lookup, so standard clients such as viem find chain records. |
| Write a Humanode record (`2147498501`) via the REST API | Rejected with 400: `addresses.2.coin is not a valid coin`. Namespace validates against a fixed chain list that doesn't include Humanode. |
| Humanode-specific record in step 3 | Shows "not set" for the Humanode coin type, as a result |

## Where it stands

- **Working:** claim, resolution through the offchain resolver, and sending to the resolved address, using the Ethereum and default EVM records.
- **Missing:** a Humanode-specific record. It matters only in the cases where one address per chain is required, such as a user who wants a different Humanode address, or a smart-contract wallet whose address isn't the same across chains. The remaining step is adding Humanode (chain IDs 5234 and 14853) to Namespace's supported chains, which would also give the SDK a `ChainName` entry.
- **Not covered:** reverse resolution (address to name), which Namespace's docs say offchain subnames don't support, and proof-of-personhood gating. Humanode's docs list a bioauth status precompile at `0x…0800`, but I haven't confirmed it on the testnet.
- **Trust model:** Namespace's gateway and API key control the names. They aren't onchain assets.

## Not verified end to end

- Which testnet token symbol the wallet shows (HMND or eHMND); set by `HUMANODE_SYMBOL`.
- The one-name-per-address check in the claim route, which uses `getFilteredSubnames({ owner })`, was read from the SDK types but not exercised against the live API.
- The full signed-claim flow in a browser wallet on Humanode; the resolution and Namespace tests above were run by script.

## Layout

Everything is TypeScript (`strict`), type-checked with `npm run typecheck`.

- `app/page.tsx`: the four-step UI.
- `app/api/claim/route.ts`: verifies the signature, issues the subname.
- `app/api/resolve/route.ts`: resolves against Sepolia and returns the debug info.
- `app/api/config/route.ts`, `lib/config.ts`: chain settings.
- `lib/message.ts`, `lib/types.ts`, `lib/errors.ts`: the signed message format (shared by the page and the claim route), the request and response types, and error text.
- `global.d.ts`: types for the browser wallet (`window.ethereum`).
- `scripts/debug-resolve.mts` (`npm run debug:resolve`): traces one CCIP-Read lookup by hand.
- `scripts/test-coins.mts` (`npm run test:coins`): the Base and REST coin-type tests.
- `.env.example`: the server settings (Namespace API key, parent name, RPCs).

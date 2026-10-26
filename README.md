# Humanode ENS demo (offchain subnames via Namespace)

Next.js app: connect a wallet on Humanode, sign (no gas) to claim `label.<parent>.eth`, resolve it through Sepolia ENS, and send funds on Humanode to the resolved address.

## Networks

| | Chain ID | ENS coin type (`2^31 + chainId`) | RPC |
|---|---|---|---|
| Humanode Testnet 5 | 14853 (`0x3A05`) | 2147498501 | https://explorer-rpc-http.testnet5.stages.humanode.io |
| Humanode mainnet | 5234 (`0x1472`) | 2147488882 | https://explorer-rpc-http.mainnet.stages.humanode.io |

Source: https://gitbook.humanode.io/docs/chains.md. The same page lists Testnet 4 with chain ID 5234, which looks like a docs error; use Testnet 5. No EVM block explorer is listed (only Subscan, which is Substrate-side), so check transactions from the wallet or the EVM Playground at https://evm-playground.testnet5.stages.humanode.io.

## Getting testnet gas

Only step 4 (the send) costs gas. Claiming is a signature, so it needs none.

1. Open the faucet bot https://t.me/HumanodeTestnet5FaucetBot and send `/gettokens`, then follow the prompts.
2. Humanode's docs (https://gitbook.humanode.io/docs/tools-and-services/testnet-faucets.md) say the faucet gives testnet HMND tokens. A 2023 Humanode blog post says these must be swapped to the EVM-side token (eHMND); the swap page is https://gitbook.humanode.io/docs/evm/hmnd-ehmnd-swap.md. I didn't read that page or confirm it still applies.
3. Faucet limits and cooldowns are not documented.

## Setup

1. On Sepolia ENS, register your parent name. In the Namespace App (https://app.namespace.ninja/offchain) open it, go to Resolution, click **Update resolver** and **Configure** (one Sepolia transaction). Status should read **Configured**.
2. Create an API key (Offchain, API Keys), scoped to that parent name.
3. `cp .env.example .env.local` and fill in `NAMESPACE_API_KEY` and `PARENT_NAME`.
4. `npm install && npm run dev`, then open http://localhost:3000 with a browser wallet installed.

## Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel (framework: Next.js, no build settings to change).
2. Add the variables from `.env.example` under Settings > Environment Variables. `NAMESPACE_API_KEY` is only read in API routes, so it never reaches the browser.
3. Deploy. The API key can create names under your parent, so the claim route allows one name per address, but anyone can still use fresh addresses. Keep the deployment link private, or scope the key to the parent name and revoke it after the demo.

## What gets written for each claim

- Coin 60 (Ethereum) and the Default EVM record, both set to the user's address. A wallet that only asks for coin 60 still sends to a working address, because an EOA has the same address on every EVM chain.
- Optional, experimental: the Humanode-specific record under coin type `2^31 + chainId`. The SDK's `ChainName` enum has no Humanode entry, so this goes through the REST API, which takes a raw `coin` number. Set `NAMESPACE_REST_URL` to enable it. The request body follows the published OpenAPI spec but is untested here, and it's unconfirmed that the production REST server serves Sepolia names.

## Things to verify (not tested end to end)

- **Coin type convention (found by inspecting the installed SDK).** `ChainName.Default` is `2147483648` (`2^31`, the ENSIP-19 default), but EVM chains in the enum are stored under the *raw chain ID*, not the ENSIP-11 value: Base = `8453` (ENSIP-11 would be `2147492101`), Arbitrum = `42161`, Celo = `42220`, and so on. A client that follows ENSIP-11 (viem `toCoinType`) asks for the larger number, so it may not find those records unless the gateway maps between them. Test this first: claim a name, set a Base address, and resolve it with viem for both `8453` and `2147492101`. Step 3 here shows all four lookups (ENSIP-11, coin 60, default, raw chain ID) for the same reason. The answer decides which number to register for Humanode.
- Whether the REST route accepts the raw Humanode coin type, and which base URL serves Sepolia. If it doesn't, this is the concrete feature request for the Namespace team.
- Whether the testnet native token shown in the wallet is HMND or eHMND (`HUMANODE_SYMBOL`).
- The one-name-per-address check uses `getFilteredSubnames({ owner })` and its `totalItems`; I read the type but haven't called it against the live API.

## Files

- `app/page.js`: the four-step UI (client component, talks to the wallet directly).
- `app/api/claim/route.js`: verifies the signature, calls `createSubname`.
- `app/api/resolve/route.js`: viem against Sepolia, returns the four lookups.
- `app/api/config/route.js`: public chain config for the UI.
- `lib/config.js`: env parsing, coin type math, the signed message format.

# Humanode ENS demo

## Rules

- `app.config.ts` is the only place for the parent name allowlist, brand copy and feature toggles. Don't hardcode them in components.
- `PARENT_NAME` must be in `registry.allowedParents`; `server/config.ts` throws otherwise. Keep it fail-closed.
- Layers: `server/` (never reaches the browser, imports `server-only`), `lib/` (pure, shared by both sides), `context/` + `screens/` + `app/page.tsx` (client). Client code must not import `server/` or `@thenamespace/offchain-manager`.
- `NAMESPACE_API_KEY` is server-only. Never log it, signatures or cookies.
- API routes wrap their body in `handleApi` and throw `apiError(msg, status)`; don't hand-roll `try/catch` + `Response.json({ error })`.
- The signed claim message lives in `lib/message.ts`; the page and `app/api/claim` must keep using it.
- Wallet access goes through `useWallet()` (viem wallet client on the chain from `lib/chain.ts`), not raw `window.ethereum.request`.

## Verification

```bash
npm run lint && npm run typecheck && npm test && npm run build && npm run check:secrets
```

`check:secrets` needs a completed build. Live Namespace writes (claiming a real name) need explicit approval.

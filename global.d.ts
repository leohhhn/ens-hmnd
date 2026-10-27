// Minimal EIP-1193 provider injected by browser wallets.
interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
}

interface Window {
  ethereum?: EthereumProvider
}

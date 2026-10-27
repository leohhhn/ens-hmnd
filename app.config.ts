/*
 * The one file to edit to point this demo at a different parent or brand.
 *
 * Static and non-secret: imported by both server and client code. Secrets and
 * per-deploy values live in the environment (see .env.example).
 */
export interface AppConfig {
  registry: {
    /** The server refuses to run unless PARENT_NAME is in this list. `null` accepts any name (local dev only). */
    allowedParents: readonly string[] | null
    /** Shown as a "test registry" badge when the active parent is something else. */
    productionParent: string
  }
  brand: { name: string; tagline: string }
  features: {
    /** One name per address, so a public demo can't exhaust the parent's 2,000-subname cap. */
    oneNamePerWallet: boolean
  }
}

export const appConfig: AppConfig = {
  registry: {
    allowedParents: ['hmnd-demo.eth'],
    productionParent: 'hmnd-demo.eth',
  },
  brand: {
    name: 'Humanode ENS Demo',
    tagline: 'Claim a gasless offchain subname, then resolve it and send funds on Humanode.',
  },
  features: {
    oneNamePerWallet: true,
  },
}

export const { brand, features, registry } = appConfig

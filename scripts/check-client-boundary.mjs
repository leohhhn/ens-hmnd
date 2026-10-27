// Fails if server-only code or secrets leak into client code or the built bundle.
// Run after `next build`.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const root = process.cwd()
const staticRoot = join(root, '.next', 'static')
const clientRoots = ['context', 'screens', 'lib'].map((d) => join(root, d))
const clientFiles = [join(root, 'app', 'page.tsx')]

function filesUnder(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) filesUnder(path, out)
    else out.push(path)
  }
  return out
}

if (!existsSync(staticRoot)) throw new Error('Missing .next/static. Run `npm run build` first.')

const forbiddenInBundle = ['NAMESPACE_API_KEY', '@thenamespace/offchain-manager']
const forbiddenInClientSource = [...forbiddenInBundle, "from '../server/", "from '../../server/"]
const apiKey = process.env.NAMESPACE_API_KEY?.trim()
const failures = []

for (const file of filesUnder(staticRoot)) {
  if (!['.js', '.map', '.json', '.css'].includes(extname(file))) continue
  const src = readFileSync(file, 'utf8')
  for (const v of forbiddenInBundle) if (src.includes(v)) failures.push(`${relative(root, file)} contains ${v}`)
  if (apiKey && src.includes(apiKey)) failures.push(`${relative(root, file)} contains the configured API key`)
}

for (const file of [...clientRoots.flatMap((d) => filesUnder(d)), ...clientFiles]) {
  if (!['.ts', '.tsx'].includes(extname(file))) continue
  const src = readFileSync(file, 'utf8')
  for (const v of forbiddenInClientSource) if (src.includes(v)) failures.push(`${relative(root, file)} references ${v}`)
}

if (failures.length) throw new Error(`Client boundary scan failed:\n${failures.join('\n')}`)
console.log('Client boundary scan passed.')

import { getConfig, toPublicConfig } from '../../../lib/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json(toPublicConfig(getConfig()))
}

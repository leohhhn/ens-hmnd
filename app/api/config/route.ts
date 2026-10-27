import { getConfig, toPublicConfig } from '../../../server/config'
import { handleApi } from '../../../server/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  return handleApi(async () => Response.json(toPublicConfig(getConfig())))
}

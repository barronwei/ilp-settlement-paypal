import { Context } from 'koa'
import { Redis } from 'ioredis'
import { normalizeAsset } from '../utils/normalizeAsset'

export async function create (ctxt: Context) {
  const accJSON = await ctxt.redis.get(
    `${ctxt.prefix}:accounts:${ctxt.params.id}`
  )
  const account = JSON.parse(accJSON)
  const body = ctxt.request.body
  const amnt = normalizeAsset(body.scale, ctxt.assetScale, BigInt(body.amnt))

  await ctxt.settleAccount(account, amnt.toString())
  ctxt.status = 200
}

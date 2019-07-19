import { Context } from 'koa'
import { normalizeAsset } from '../utils/normalizeAsset'

export async function create (ctxt: Context) {
  const { assetScale, params, prefix, redis, request } = ctxt
  const accJSON = await redis.get(`${prefix}:accounts:${params.id}`)
  const account = JSON.parse(accJSON)

  const body = request.body
  const amnt = normalizeAsset(body.scale, assetScale, BigInt(body.amnt))
  await ctxt.settleAccount(account, amnt.toString())

  ctxt.status = 200
}

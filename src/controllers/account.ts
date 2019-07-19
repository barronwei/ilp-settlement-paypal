import { Context } from 'koa'
import { Account } from '../models/account'

export async function create (ctxt: Context) {
  const { prefix, redis, request } = ctxt
  const { id, email } = request.body
  const account: Account = {
    id,
    email
  }
  const existingAccount = await redis.get(`${prefix}:accounts:${account.id}`)
  if (!existingAccount) {
    await redis.set(
      `${prefix}:accounts:${account.id}`,
      JSON.stringify(account)
    )
    ctxt.status = 200
  } else {
    ctxt.status = 404
  }
}

export async function search (ctxt: Context) {
  const { params, prefix, redis } = ctxt
  const account = await redis.get(`${prefix}:accounts:${params.id}`)
  if (account) {
    ctxt.body = JSON.parse(account)
    ctxt.status = 200
  } else {
    ctxt.status = 404
  }
}

export async function remove (ctxt: Context) {
  const { params, prefix, redis } = ctxt
  await redis.del(`${prefix}:accounts:${params.id}`)
  ctxt.status = 200
}

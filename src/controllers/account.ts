import { Context } from 'koa'
import { Account } from '../models/account'

export async function create (ctxt: Context) {
  const body = ctxt.request.body
  const account: Account = {
    id: body.id
  }
  const existingAccount = await ctxt.redis.get(
    `${ctxt.prefix}:accounts:${account.id}`
  )
  if (!existingAccount) {
    await ctxt.redis.set(
      `${ctxt.prefix}:accounts:${account.id}`,
      JSON.stringify(account)
    )
    ctxt.status = 200
  } else {
    ctxt.status = 404
  }
}

export async function search (ctxt: Context) {
  const account = await ctxt.redis.get(
    `${ctxt.prefix}:accounts:${ctxt.params.id}`
  )
  if (account) {
    ctxt.body = JSON.parse(account)
    ctxt.status = 200
  } else {
    ctxt.status = 404
  }
}

export async function remove (ctxt: Context) {
  await ctxt.redis.del(`${ctxt.prefix}:accounts:${ctxt.params.id}`)
  ctxt.status = 200
}

import * as getRawBody from 'raw-body'
import { Context } from 'koa'

export interface Message {
  type: string
  data: any
}

export async function create (ctx: Context) {
  const buffer = await getRawBody(ctx.req)
  const message: Message = JSON.parse(buffer.toString())
  const reply = await handleMessage(message, ctx)

  ctx.body = reply
  ctx.status = 200
}

async function handleMessage (message: Message, ctx: Context) {
  const { type } = message
  switch (type) {
    case 'paymentDetails':
      return Buffer.from(ctx.ppEmail)
    default:
      throw new Error(`This message type ${type} is unknown.`)
  }
}

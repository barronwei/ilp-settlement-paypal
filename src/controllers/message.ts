import * as getRawBody from 'raw-body'
import { Context } from 'koa'

export interface Message {
  type: string
  data: any
}

export interface PaymentDetailsMessage {
  ppEmail: string
}

export async function create (ctx: Context) {
  const buffer = await getRawBody(ctx.req)
  const message: Message = JSON.parse(buffer.toString())
  const reply = await handleMessage(message, ctx)

  ctx.body = reply
  ctx.status = 200
}

async function handleMessage (message: Message, ctx: Context) {
  switch (message.type) {
    case 'paymentDetails':
      const paymentDetails: PaymentDetailsMessage = {
        ppEmail: ctx.ppEmail
      }
      return Buffer.from(JSON.stringify(paymentDetails))
    default:
      throw new Error(`This message type ${message.type} is unknown.`)
  }
}

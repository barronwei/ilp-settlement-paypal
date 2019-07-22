import * as PayPal from 'paypal-rest-sdk'
import * as getRawBody from 'raw-body'
import { Context } from 'koa'
import { randomBytes } from 'crypto'

export interface Message {
  type: string
  total: string
  currency: string
  data: any
}

export interface PaymentDetailsMessage {
  ppEmail: string
  destinationTag: number
}

export async function create (ctx: Context) {
  const buffer = await getRawBody(ctx.req)
  const message: Message = JSON.parse(buffer.toString())
  const reply = await handleMessage(message, ctx)

  ctx.body = reply
  ctx.status = 200
}

async function handleMessage (message: Message, ctx: Context) {
  const { type, total, currency } = message
  const { params, prefix, redis, ppEmail, host, port } = ctx
  const accountId: string = params.id
  switch (type) {
    case 'paymentDetails':
      const tag = await redis.get(
        `${prefix}:accountId:${accountId}:destinationTag`
      )
      const destinationTag: number = tag || randomBytes(4).readUInt32BE(0)
      if (!tag) {
        await redis.set(
          `${prefix}:destinationTag:${destinationTag}:accountId`,
          accountId
        )
        await redis.set(
          `${prefix}:accountId:${accountId}:destinationTag`,
          destinationTag
        )
      }
      const paymentDetails: PaymentDetailsMessage = {
        ppEmail,
        destinationTag
      }
      const paymentRequest = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        redirect_urls: {
          return_url: `http://${host}:${port}/accept`,
          cancel_url: `http://${host}:${port}/reject`
        },
        transactions: [
          {
            amount: {
              total,
              currency
            },
            description: `Payment from ${accountId} under ${destinationTag}!`
          }
        ]
      }
      PayPal.payment.create(paymentRequest, (err, pay) => {
        if (err) {
          console.error(`Failed to initiate PayPal payment:`, err)
        } else {
          console.log(`Created PayPal payment for approval:`, pay)
        }
      })
      return Buffer.from(JSON.stringify(paymentDetails))
    default:
      throw new Error('This message type is unknown.')
  }
}

import * as PayPal from 'paypal-rest-sdk'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as bodyParser from 'koa-bodyparser'
import * as ioredis from 'ioredis'
import axios from 'axios'
import { Server } from 'net'
import { Account } from './models/account'
import { v4 as uuidv4 } from 'uuid'

import {
  create as createAccount,
  search as searchAccount,
  remove as removeAccount
} from './controllers/account'
import { create as createMessage } from './controllers/message'
import { create as createSettlement } from './controllers/settlement'

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = '3000'

const DEFAULT_REDIS_PORT = '6379'

// PayPal SDK mode
const DEFAULT_MODE = 'sandbox'
const DEFAULT_PREFIX = 'paypal'

const DEFAULT_CURRENCY = 'USD'
const DEFAULT_MIN_CENTS = 1000000

export interface PayPalEngineConfig {
  host?: string
  port?: string
  mode?: string

  connectorUrl: string
  redisPort?: string
  redis: ioredis.Redis

  ppEmail: string
  clientId: string
  secret: string

  assetScale: number
  prefix?: string

  minCents?: number
  currency?: string
}

export class PayPalSettlementEngine {
  app: Koa
  host: string
  port: string
  mode: string

  server: Server
  router: Router

  connectorUrl: string
  redisPort: string
  redis: ioredis.Redis

  ppEmail: string
  clientId: string
  secret: string

  assetScale: number
  prefix: string

  minCents: number
  currency: string

  constructor (config: PayPalEngineConfig) {
    this.app = new Koa()
    this.app.use(async (ctx, next) => {
      if (ctx.path.includes('messages')) ctx.disableBodyParser = true
      await next()
    })
    this.app.use(bodyParser())

    this.host = config.host || DEFAULT_HOST
    this.port = config.port || DEFAULT_PORT
    this.mode = config.mode || DEFAULT_MODE

    this.connectorUrl = config.connectorUrl
    this.redisPort = config.redisPort || DEFAULT_REDIS_PORT
    this.redis = config.redis || new ioredis(this.redisPort)

    this.ppEmail = config.ppEmail
    this.clientId = config.clientId
    this.secret = config.secret

    this.assetScale = config.assetScale
    this.prefix = config.prefix || DEFAULT_PREFIX

    this.minCents = config.minCents || DEFAULT_MIN_CENTS
    this.currency = config.currency || DEFAULT_CURRENCY

    this.app.context.redis = this.redis
    this.app.context.ppEmail = this.ppEmail
    this.app.context.prefix = this.prefix

    // Routes

    this.router = new Router()
    this.setupRoutes()
    this.app.use(this.router.routes())
  }

  public async start () {
    console.log('Starting to listen on', this.port)
    this.server = this.app.listen(Number(this.port), this.host)

    // PayPal
    console.log(`Starting PayPal in ${this.mode} mode!`)
    PayPal.configure({
      mode: this.mode,
      client_id: this.clientId,
      client_secret: this.secret
    })

    // Webhooks
    await this.subscribeToTransactions()
  }

  public async close () {
    console.log('Shutting down')
    this.server.close()
  }

  private async subscribeToTransactions () {
    const webhooks = {
      url: `http://${this.host}:${this.port}/${this.clientId}/webhooks`,
      event_types: [
        {
          name: 'PAYMENT.PAYOUTSBATCH.SUCCESS'
        }
      ]
    }
    PayPal.notification.webhook.create(webhooks, (err, res) => {
      if (res) {
        console.log(`Initiated webhooks to listening at ${webhooks.url}:`, res)
      } else {
        console.error(`Failed to initialize webhooks at ${webhooks.url}:`, err)
      }
    })
  }

  async findAccountMiddleware (ctx: Koa.Context, next: () => Promise<any>) {
    const { params, prefix, redis } = ctx
    const account = await redis.get(`${prefix}:accounts:${params.id}`)
    account ? (ctx.account = JSON.parse(account)) : ctx.throw(404)
    await next()
  }

  private setupRoutes () {
    // Accounts
    this.router.post('/accounts', ctx => createAccount(ctx))
    this.router.get('/accounts/:id', ctx => searchAccount(ctx))
    this.router.delete('/accounts/:id', ctx => removeAccount(ctx))

    // Messages
    this.router.post(
      '/accounts/:id/messages',
      this.findAccountMiddleware,
      createMessage
    )

    // Settlement
    this.router.post(
      '/accounts/:id/settlement',
      this.findAccountMiddleware,
      createSettlement
    )

    // Webhooks
    this.router.post(
      '/accounts/:id/webhooks',
      this.findAccountMiddleware,
      this.handleTransaction
    )
  }

  async getPaymentDetails (accountId: string) {
    const url = `${this.connectorUrl}\\accounts\\${accountId}\\messages`
    const message = {
      type: 'paymentDetails'
    }
    const details = await axios.post(
      url,
      Buffer.from(JSON.stringify(message)),
      {
        timeout: 10000,
        headers: {
          'Content-type': 'application/octet-stream',
          'Idempotency-Key': uuidv4()
        }
      }
    )
    return details.data
  }

  async settleAccount (account: Account, cents: string) {
    const { id, ppEmail } = account
    console.log(`Attempting to send ${cents} cents to account: ${id}`)
    try {
      const details = await this.getPaymentDetails(id).catch(err => {
        console.error('Error getting payment details from counterparty', err)
        throw err
      })
      const { ppEmail, destinationTag } = details
      const payment = {
        sender_batch_header: {
          sender_batch_id: uuidv4(),
          email_subject: `ILP Settlement from ${this.ppEmail}`,
          email_message: `Payout of ${cents} cents under ${destinationTag}!`
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: cents,
              currency: this.currency
            },
            note: `Settlement from ${
              this.ppEmail
            } to ${ppEmail} (${destinationTag})`,
            receiver: ppEmail
          }
        ]
      }
      PayPal.payout.create(payment, (err: any, pay: any) => {
        if (pay) {
          console.log('Created PayPal payment for approval:', pay)
        } else {
          console.error('Failed to initiate PayPal payment:', err)
        }
      })
    } catch (err) {
      console.error(`Settlement to ${ppEmail} for ${cents} cents failed:`, err)
    }
  }
}

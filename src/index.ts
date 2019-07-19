import * as PayPal from 'paypal-rest-sdk'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as bodyParser from 'koa-bodyparser'
import axios from 'axios'
import { Redis } from 'ioredis'
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

// PayPal SDK mode
const DEFAULT_MODE = 'sandbox'

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 3000
const DEFAULT_PREFIX = 'pp'
const DEFAULT_CURRENCY = 'USD'
const DEFAULT_MIN_CENTS = 1000000

export interface PayPalEngineConfig {
  host?: string
  port?: number

  connectorUrl: string
  redis: Redis

  email: string
  client: string
  secret: string

  assetScale: number
  prefix?: string

  minCents?: number
  currency?: string
}

export class PayPalSettlementEngine {
  app: Koa
  host: string
  port: number

  server: Server
  router: Router

  redis: Redis
  connectorUrl: string

  email: string
  client: string
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

    this.connectorUrl = config.connectorUrl
    this.redis = config.redis

    this.email = config.email
    this.client = config.client
    this.secret = config.secret

    this.assetScale = config.assetScale
    this.prefix = config.prefix || DEFAULT_PREFIX

    this.minCents = config.minCents || DEFAULT_MIN_CENTS
    this.currency = config.currency || DEFAULT_CURRENCY

    this.app.context.host = this.host
    this.app.context.port = this.port
    this.app.context.redis = this.redis
    this.app.context.email = this.email
    this.app.context.prefix = this.prefix

    // Routes

    this.router = new Router()
    this.setupRoutes()
    this.app.use(this.router.routes())

    // PayPal

    PayPal.configure({
      mode: DEFAULT_MODE,
      client_id: this.client,
      client_secret: this.secret
    })
  }

  public async start () {
    console.log('Starting to listen on', this.port)
    this.server = this.app.listen(this.port, this.host)
  }

  public async close () {
    console.log('Shutting down')
    this.server.close()
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
  }
}

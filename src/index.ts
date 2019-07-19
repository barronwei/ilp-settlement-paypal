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
const CURRENT_MODE = 'sandbox'

const DEFAULT_PORT = 3000
const DEFAULT_PREFIX = 'pp'
const DEFAULT_MIN_DROPS = 10000

export interface PayPalEngineConfig {
  connectorUrl: string
  port?: number

  address: string
  secret: string

  assetScale: number
  prefix?: string

  redis: Redis

  ppClient: PayPal.Payment
  minDrops?: number
}

export class PayPalSettlementEngine {
  app: Koa
  connectorUrl: string
  port: number

  address: string
  secret: string

  assetScale: number
  prefix: string

  redis: Redis

  ppClient: PayPal.Payment
  minDrops: number

  router: Router
  server: Server

  constructor (config: PayPalEngineConfig) {
    this.app = new Koa()
    this.app.use(async (ctxt, next) => {
      if (ctxt.path.includes('messages')) ctxt.disableBodyParser = true
      await next()
    })
    this.app.use(bodyParser())

    this.port = config.port || DEFAULT_PORT
    this.connectorUrl = config.connectorUrl

    this.address = config.address
    this.secret = config.secret

    this.redis = config.redis

    this.assetScale = config.assetScale
    this.prefix = config.prefix || DEFAULT_PREFIX

    this.ppClient = config.ppClient
    this.minDrops = config.minDrops || DEFAULT_MIN_DROPS

    this.app.context.redis = this.redis
    this.app.context.prefix = this.prefix
    this.app.context.address = this.address

    // Routes

    this.router = new Router()
    this.setupRoutes()
    this.app.use(this.router.routes())

    // PayPal

    PayPal.configure({
      mode: CURRENT_MODE,
      client_id: this.address,
      client_secret: this.secret
    })
  }

  public async start () {
    console.log('Starting to listen on', this.port)
    this.server = this.app.listen(this.port)
  }

  public async close () {
    console.log('Shutting down')
    this.server.close()
  }

  async findAccountMiddleware (ctxt: Koa.Context, next: () => Promise<any>) {
    const account = await ctxt.redis.get(
      `${ctxt.prefix}:accounts:${ctxt.params.id}`
    )
    account ? (ctxt.account = JSON.parse(account)) : ctxt.throw(404)
    await next()
  }

  private setupRoutes () {
    // Accounts
    this.router.post('/accounts', ctxt => createAccount(ctxt))
    this.router.get('/accounts/:id', ctxt => queryAccount(ctxt))
    this.router.delete('/accounts/:id', ctxt => removeAccount(ctxt))

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

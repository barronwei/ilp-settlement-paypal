import * as PayPal from 'paypal-rest-sdk'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as bodyParser from 'koa-bodyparser'
import { Redis } from 'ioredis'
import { Server } from 'net'
import { Account } from './models/account'

const DEFAULT_PORT = 3000
const DEFAULT_PREFIX = ''
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
  ppUri: string
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

    this.router = new Router()
  }

  public async start () {
    console.log('Starting to listen on', this.port)
    this.server = this.app.listen(this.port)
  }

  public async close () {
    console.log('Shutting down')
    this.server.close()
  }
}

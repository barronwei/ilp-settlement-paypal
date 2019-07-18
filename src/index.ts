import Debug from 'debug'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import { Redis } from 'ioredis'
import { Server } from 'net'

import { Account } from './models/account'

export interface EngineConfig {
  address: string
  assetScale: string
  redis: Redis
  secret: string

  port?: number
}

export class SettlementEngine {
  app: Koa
  port: number
  redis: Redis
  router: Router
  server: Server

  constructor (config: EngineConfig) {
    this.app = new Koa()

    this.redis = config.redis
  }

  public async start () {
    console.log('Starting to listen on', this.port)
    this.server = this.app.listen(this.port)
  }

  public async close () {
    console.log('Shutting down')
  }
}

import { PayPalEngineConfig, PayPalSettlementEngine } from '.'
import * as Redis from 'ioredis'

const CONNECTOR_URL = process.env.CONNECTOR_URL || 'http://localhost:7771'
const ENGINE_PORT = process.env.ENGINE_PORT || 3000

const LEDGER_EMAIL = process.env.LEDGER_EMAIL || ''
const LEDGER_CLIENT_ID = process.env.LEDGER_EMAIL || ''
const LEDGER_SECRET = process.env.LEDGER_SECRET || ''
const LEDGER_SCALE = 2

const REDIS_PORT = process.env.REDIS_PORT || 6379

const config: PayPalEngineConfig = {
  connectorUrl: CONNECTOR_URL,
  port: +ENGINE_PORT,

  ppEmail: LEDGER_EMAIL,
  clientId: LEDGER_CLIENT_ID,
  secret: LEDGER_SECRET,

  assetScale: LEDGER_SCALE,
  prefix: 'pp',

  redis: new Redis(+REDIS_PORT)
}

const engine = new PayPalSettlementEngine(config)

engine.start().catch(error => console.log(error))

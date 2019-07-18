import 'mocha'
import * as Chai from 'chai'
import * as Sinon from 'sinon'
import { normalizeAsset } from '../src/utils/normalizeAsset'

const assert = Object.assign(Chai.assert, Sinon.assert)

describe('Normalize Asset', function () {
  it('converts from low scale to higher scale', async () => {
    assert.strictEqual(normalizeAsset(2, 6, 100n), 1000000n)
  })

  it('converts from high scale to lower scale', async () => {
    assert.strictEqual(normalizeAsset(6, 2, 1000000n), 100n)
  })
})

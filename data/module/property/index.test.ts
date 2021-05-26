import { assertEquals, assertObjectMatch } from '../../../deps.ts'
import {
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  upsertProperty,
  getPropertyOwner,
  getPropertyAreas,
} from './index.ts'
import {
  createUser,
} from '../user/index.ts'
import db from '../../connection.ts'
import '../../init-db.ts'

const user = await createUser({
  first: 'firstname',
  last: 'lastname',
  email: 'test@example.com',
  phone: '1234567890',
  handle: 'test-user-handle',
})

const property = {
  propertyType: 'sfh',
  address: '123 abc st',
  address2: '',
  city: 'SLC',
  state: 'UT',
  country: 'USA',
  primaryResidence: true,
  userId: user.id,
}

Deno.test('create property', async () => {
  const property1 = await createProperty(property)
  assertObjectMatch(property1, property)
})

Deno.test('update property', async () => {
  const property1 = await createProperty(property)
  const property2 = await updateProperty({...property1, primaryResidence: false })
  assertObjectMatch(property2, {...property1, primaryResidence: false })
})

Deno.test('delete property', async () => {
  const property1 = await createProperty(property)
  await deleteProperty({ id: +property1.id! })
  const foundProperty = await getProperty({ id: +property1.id! })
  assertEquals(foundProperty, undefined)
})

Deno.test('upsert property', async () => {
  const property1 = await upsertProperty(property)
  assertObjectMatch(property1, property)
  const property2 = await upsertProperty({...property1, primaryResidence: false })
  assertObjectMatch(property2, {...property, primaryResidence: false })
})

Deno.test('get property owner', async () => {
  const property1 = await upsertProperty(property)
  const owner = await getPropertyOwner({ id: +property1.id! })
  assertObjectMatch(owner, user)
})

import {
  assertEquals,
  assertObjectMatch,
  assertThrowsAsync,
  Model,
} from '../../../deps.ts'
import {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  upsertUser,
  getUserProperties,
  cleanUserTable,
} from './index.ts'
import {
  createProperty,
} from '../../module/property/index.ts'
import db from '../../connection.ts'
import '../../init-db.ts'

const user = {
  first: 'firstname',
  last: 'lastname',
  email: 'test@example.com',
  phone: '1234567890',
  handle: 'test-user-handle',
}

Deno.test('create user', async () => {
  await cleanUserTable()
  const user1 = await createUser(user)
  assertObjectMatch(user1, user)
})

Deno.test('dont create duplicate user', async () => {
  await cleanUserTable()
  const user1 = await createUser(user)
  assertObjectMatch(user1, user)
  await assertThrowsAsync(
    async () => await createUser(user)
  )
})

Deno.test('update user', async () => {
  await cleanUserTable()
  const user1 = await createUser(user)
  const user2 = await updateUser({...user1, first: 'differentname' })
  assertObjectMatch(user2, {...user1, first: 'differentname' })
})

Deno.test('delete user', async () => {
  await cleanUserTable()
  const user1 = await createUser(user)
  await deleteUser({ id: +user1.id! })
  const foundUser = await getUser({ id: +user1.id! })
  assertEquals(foundUser, undefined)
})

Deno.test('upsert user', async () => {
  await cleanUserTable()
  const user1 = await upsertUser(user)
  assertObjectMatch(user1, user)
  const user2 = await upsertUser({...user1, first: 'differentName'})
  assertObjectMatch(user2, {...user, first: 'differentName'})
})

Deno.test('get user properties', async () => {
  await cleanUserTable()
  const user1 = await upsertUser(user)

  const property = await createProperty({
    propertyType: 'sfh',
    address: '123 abc st',
    address2: '',
    city: 'SLC',
    state: 'UT',
    country: 'USA',
    primaryResidence: true,
    userId: +user1.id!,
  })

  const userProperties: any = await getUserProperties({ id: +user1.id! })

  assertEquals(userProperties.length, 1)
  assertObjectMatch(property, userProperties[0])
})


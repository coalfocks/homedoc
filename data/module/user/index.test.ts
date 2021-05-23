import { assertEquals, assertObjectMatch } from '../../../deps.ts'
import {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  upsertUser,
} from './index.ts'
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
  const user1 = await createUser(user)
  assertObjectMatch(user1, user)
})

Deno.test('update user', async () => {
  const user1 = await createUser(user)
  const user2 = await updateUser({...user1, first: 'differentname' })
  assertObjectMatch(user2, {...user1, first: 'differentname' })
})

Deno.test('delete user', async () => {
  const user1 = await createUser(user)
  await deleteUser({ id: +user1.id! })
  const foundUser = await getUser({ id: +user1.id! })
  assertEquals(foundUser, undefined)
})

Deno.test('upsert user', async () => {
  const user1 = await upsertUser(user)
  assertObjectMatch(user1, user)
  const user2 = await upsertUser({...user1, first: 'differentName'})
  assertObjectMatch(user2, {...user, first: 'differentName'})
})


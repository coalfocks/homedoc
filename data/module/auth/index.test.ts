import {
  assertEquals,
  assertObjectMatch,
  assertThrowsAsync,
} from 'asserts'
import {
  getAuth,
  createAuth,
  updateAuth,
  deleteAuth,
  upsertAuth,
  getAuthProperties,
  cleanAuthTable,
} from './index.ts'
import {
  createUser,
  getUserPassword,
} from '../../module/user/index.ts'
import db from '../../connection.ts'
import '../../init-db.ts'

const auth = {
  password: 'test-password',   
}

const user = {
  first: 'firstname',
  last: 'lastname',
  email: 'test@example.com',
  phone: '1234567890',
  handle: 'test-user-handle',
}

Deno.test('create auth', async () => {
  await cleanAuthTable()
  const user1 = await createUser(user)
  const auth1 = await createAuth({ userId: user1.id, ...auth })
  console.log(auth1)
  assertObjectMatch(auth1, auth)
})

//Deno.test('update auth', async () => {
//  await cleanAuthTable()
//  const auth1 = await createAuth(auth)
//  const auth2 = await updateAuth({...Auth1, first: 'differentname' })
//  assertObjectMatch(auth2, {...Auth1, first: 'differentname' })
//})
//
//Deno.test('delete auth', async () => {
//  await cleanAuthTable()
//  const auth1 = await createAuth(auth)
//  await deleteAuth({ id: +Auth1.id! })
//  const foundAuth = await getAuth({ id: +Auth1.id! })
//  assertEquals(foundAuth, undefined)
//})
//
//Deno.test('upsert auth', async () => {
//  await cleanAuthTable()
//  const auth1 = await upsertAuth(auth)
//  assertObjectMatch(auth1, auth)
//  const auth2 = await upsertAuth({...Auth1, first: 'differentName'})
//  assertObjectMatch(auth2, {...Auth, first: 'differentName'})
//})
//
//Deno.test('get auth properties', async () => {
//  await cleanAuthTable()
//  const auth1 = await upsertAuth(auth)
//
//  const property = await createProperty({
//    propertyType: 'sfh',
//    address: '123 abc st',
//    address2: '',
//    city: 'SLC',
//    state: 'UT',
//    country: 'USA',
//    primaryResidence: true,
//    authId: +Auth1.id!,
//  })
//
//  const authProperties: any = await getAuthProperties({ id: +Auth1.id! })
//
//  assertEquals(authProperties.length, 1)
//  assertObjectMatch(property, authProperties[0])
//})


//TODO: test getting auth password


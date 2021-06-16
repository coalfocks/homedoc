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
  createProperty,
} from '../../module/property/index.ts'
import db from '../../connection.ts'
import '../../init-db.ts'

const Auth = {
  
}

Deno.test('create Auth', async () => {
  await cleanAuthTable()
  const Auth1 = await createAuth(Auth)
  assertObjectMatch(Auth1, Auth)
})

Deno.test('dont create duplicate Auth', async () => {
  await cleanAuthTable()
  const Auth1 = await createAuth(Auth)
  assertObjectMatch(Auth1, Auth)
  await assertThrowsAsync(
    async () => await createAuth(Auth)
  )
})

Deno.test('update Auth', async () => {
  await cleanAuthTable()
  const Auth1 = await createAuth(Auth)
  const Auth2 = await updateAuth({...Auth1, first: 'differentname' })
  assertObjectMatch(Auth2, {...Auth1, first: 'differentname' })
})

Deno.test('delete Auth', async () => {
  await cleanAuthTable()
  const Auth1 = await createAuth(Auth)
  await deleteAuth({ id: +Auth1.id! })
  const foundAuth = await getAuth({ id: +Auth1.id! })
  assertEquals(foundAuth, undefined)
})

Deno.test('upsert Auth', async () => {
  await cleanAuthTable()
  const Auth1 = await upsertAuth(Auth)
  assertObjectMatch(Auth1, Auth)
  const Auth2 = await upsertAuth({...Auth1, first: 'differentName'})
  assertObjectMatch(Auth2, {...Auth, first: 'differentName'})
})

Deno.test('get Auth properties', async () => {
  await cleanAuthTable()
  const Auth1 = await upsertAuth(Auth)

  const property = await createProperty({
    propertyType: 'sfh',
    address: '123 abc st',
    address2: '',
    city: 'SLC',
    state: 'UT',
    country: 'USA',
    primaryResidence: true,
    AuthId: +Auth1.id!,
  })

  const AuthProperties: any = await getAuthProperties({ id: +Auth1.id! })

  assertEquals(AuthProperties.length, 1)
  assertObjectMatch(property, AuthProperties[0])
})


//TODO: test getting Auth password


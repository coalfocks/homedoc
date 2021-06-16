import { Relationships } from 'https://deno.land/x/denodb/mod.ts'
import {
  hash,
  compare,
} from 'bcrypt'
import {
  User,
  Auth,
} from '../../models/index.ts'
import db from '../../connection.ts'

type AuthType = {
  password: string,
  userId: number,
}

const init = async () => {
  const models = [ Auth ]
  const database = db()
  await database.link(models)
}

init()

const getAuth = async (query: AuthType) => {
  return await Auth.where(query).first()
}

const createAuth = async (newAuth: AuthType) => {
  const { userId, password } = newAuth
  const hash = await hash(password)
  return await Auth.create({ userId, password: hash })
}

const updateAuth = async (newAuth: AuthType) => {
  const { userId, password } = newAuth
  const hash = await hash(password)
  const await Auth.where({ userId }).update({ userId, password: hash })
  return await getAuth({ userId })
}

const upsertAuth = async (newAuth: AuthType) => {
  const id = await Auth.select('userId').where({ userId: newAuth.userId }).first()
  if (!id) return await createAuth(newAuth)
  else return await updateAuth(newAuth)
}

const deleteAuth = async (query: AuthType) => {
  return await Auth.where(query).delete()
}

const authenticate = async (attemptedAuth: AuthType) => {
  const { handle, password } = attemptedAuth
  const { password: hash } = getAuth({ userId })
  const authenticated = await compare(password, hash)
  if (!authenticated) throw new Error('Invalid Authentication')
}

const cleanAuthTable = async () => {
  return await Auth.delete()
}

export {
  getAuth,
  createAuth,
  updateAuth,
  upsertAuth,
  deleteAuth,
  getAuthProperties,
  cleanAuthTable,
}

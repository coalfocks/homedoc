import { Relationships } from 'https://deno.land/x/denodb/mod.ts'
import {
  User,
  Property,
  Auth,
} from '../../models/index.ts'
import db from '../../connection.ts'

type UserType = {
  id?: number
  first?: string
  last?: string
  email?: string
  phone?: string
  handle?: string
}

const init = async () => {
  const models = [ User ]
  const database = db()
  Relationships.belongsTo(Property, User)
  // TODO: maybe don't need to link?
  Relationships.belongsTo(Auth, User)
  await database.link(models)
}

init()

const getUser = async (query: UserType) => {
  return await User.where(query).first()
}

const createUser = async (newUser: UserType) => {
  return await User.create(newUser)
}

const updateUser = async (newUser: UserType) => {
  const updated = await User.where({ id: newUser.id! }).update(newUser)
  return await getUser({ id: newUser.id! })
}

const upsertUser = async (newUser: UserType) => {
  const id = await User.select('id').where({ id: newUser.id! }).first()
  if (!id) return await createUser(newUser)
  else return await updateUser(newUser)
}

const deleteUser = async (query: UserType) => {
  return await User.where(query).delete()
}

const getUserProperties = async (query: UserType) => {
  return await User.where(query).properties()
}

const getUserPassword = async (query: UserType) => {
  return await User.where(query).password()
}

const cleanUserTable = async () => {
  return await User.delete()
}

export {
  getUser,
  createUser,
  updateUser,
  upsertUser,
  deleteUser,
  getUserProperties,
  cleanUserTable,
}

import {
  User,
} from '../../models/index.ts'

type UserType = {
  id?: number
  first?: string
  last?: string
  email?: string
  phone?: string
  handle?: string
}

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
  const id = User.select('id').where({ id: newUser.id! })
  if (!id) return await createUser(newUser)
  else return await updateUser(newUser)
}

const deleteUser = async (query: UserType) => {
  return await User.where(query).delete()
}

export {
  getUser,
  createUser,
  updateUser,
  upsertUser,
  deleteUser,
}

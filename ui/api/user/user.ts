//import type { APIRequest } from "aleph/types"
//import { createUser } from '../../../data/module/user/index.ts'
const createUser = user => {}

//export default async function handler(req: APIRequest) {
export default async function handler(req) {
  let status = 500
  let res
  const body = await req.readBody('json')

  const getUser = id => 'getting user by id: ' + id
  const postUser = async (user) => await createUser(user)

  switch(req.method) {
    case 'GET':
      break
    case 'POST':
      status = 201
      user = body.user
      res = await postUser(user)
      break
    case 'PUT':
      break
    case 'DELETE':
      break
  }

  req.status(status).json(res)
}

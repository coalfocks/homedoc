import { Relationships } from 'https://deno.land/x/denodb/mod.ts'
import db from './connection.ts'
import {
  User,
  Property,
  Area,
  Note,
  Auth,
} from './models/index.ts'

const models = [ User, Property, Area, Note, Auth ]
const database = db()

Relationships.belongsTo(Property, User)
Relationships.belongsTo(Auth, User)
Relationships.belongsTo(Area, Property)
Relationships.belongsTo(Note, Area)

await database.link(models)
console.log('syncing...')
await database.sync({drop: true})
console.log('synced!')

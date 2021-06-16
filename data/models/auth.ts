import { Model, DataTypes } from 'https://deno.land/x/denodb/mod.ts'
import User from './user.ts'

class Auth extends Model {

  static table = 'auth'
  static timestamps = true

  static fields = {
    passHash: {
      type: DataTypes.BINARY,
      length: 120
    },
  }
}

export default Auth

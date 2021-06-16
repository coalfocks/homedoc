import { Model, DataTypes } from 'https://deno.land/x/denodb/mod.ts'
import Property from './property.ts'
import Auth from './auth.ts'

class User extends Model {

  static table = 'user'
  static timestamps = true

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first: DataTypes.string(120),
    last: DataTypes.string(120),
    email: {
      type: DataTypes.STRING,
      length: 120,
      unique: true,
    },
    phone: DataTypes.string(20),
    handle: {
      type: DataTypes.STRING,
      length: 120,
      unique: true,
    },
  }

  static properties() {
    return this.hasMany(Property)
  }

  static password() {
    return this.hasOne(Auth)
  }
}

export default User

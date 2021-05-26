import { Model, DataTypes } from '../../deps.ts'
import Property from './property.ts'

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
}

export default User

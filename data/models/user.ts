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
    email: DataTypes.string(120),
    phone: DataTypes.string(20),
    handle: DataTypes.string(120),
  }

  static properties() {
    return this.hasMany(Property)
  }
}

export default User

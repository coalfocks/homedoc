import { Model, DataTypes } from '../../deps.ts'
import User from './user.ts'
import Area from './area.ts'

class Property extends Model {

  static table = 'property'
  static timestamps = true

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    propertyType: DataTypes.enum(['sfh', 'condo', 'apt', 'mfh', 'land', 'commercial']),
    address: DataTypes.string(120),
    address2: DataTypes.string(120),
    city: DataTypes.string(120),
    state: DataTypes.string(120),
    country: DataTypes.string(120),
    primaryResidence: DataTypes.BOOLEAN,
  }

  static owner() {
    return this.hasOne(User)
  }

  static areas() {
    return this.hasMany(Area)
  }
}

export default Property

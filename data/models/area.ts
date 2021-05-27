import { Model, DataTypes } from 'https://deno.land/x/denodb/mod.ts'
import Property from './property.ts'
import Note from './note.ts'

class Area extends Model {

  static table = 'area'
  static timestamps = true

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.string(120),
  }

  static property() {
    return this.hasOne(Property)
  }

  static notes() {
    return this.hasMany(Note)
  }
}

export default Area

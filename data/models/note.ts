import { Model, DataTypes } from 'https://deno.land/x/denodb/mod.ts'
import Area from './area.ts'

class Note extends Model {

  static table = 'note'
  static timestamps = true

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Title: DataTypes.string(120),
    Description: DataTypes.string(950),
  }

  static area() {
    return this.hasOne(Area)
  }

}

export default Note

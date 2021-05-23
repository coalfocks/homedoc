import {
  Area,
} from '../../models'

const getArea = query => {
  return Area.where(query).get()
}

const createArea = newArea => {
  return Area.create(newArea)
}

const updateArea = newArea => {
  return Area.where({ id: newArea.id }).update(newArea)
}

const upsertArea = newArea => {
  const id = Area.select('id').where({ id: newArea.id })
  if (!id) return Area.create(newArea)
  else return Area.where({ id: newArea.id }).update(newArea)
}

export {
  getArea,
  createArea,
  updateArea,
  upsertArea,
}

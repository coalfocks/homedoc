import {
  Property,
} from '../../models/index.ts'

type PropertyType = {
  id?: number
  propertyType?: string
  address?: string
  address2?: string
  city?: string
  state?: string
  country?: string
  primaryResidence?: boolean
  userId?: any
}

const getProperty = async (query: PropertyType) => {
  return await Property.where(query).first()
}

const createProperty = async (newProperty: PropertyType) => {
  return await Property.create(newProperty)
}

const updateProperty = async (newProperty: PropertyType) => {
  const updated = await Property.where({ id: newProperty.id! }).update(newProperty)
  return await getProperty({ id: newProperty.id! })
}

const upsertProperty = async (newProperty: PropertyType) => {
  const id = Property.select('id').where({ id: newProperty.id! })
  if (!id) return await createProperty(newProperty)
  else return await updateProperty(newProperty)
}

const deleteProperty = async (query: PropertyType) => {
  return await Property.where(query).delete()
}

const getPropertyOwner = async (query: PropertyType) => {
  return await Property.where(query).owner()
}

const getPropertyAreas = async (query: PropertyType) => {
  return await Property.where(query).areas()
}

// note methods

export {
  getProperty,
  createProperty,
  updateProperty,
  upsertProperty,
  deleteProperty,
  getPropertyOwner,
  getPropertyAreas,
}

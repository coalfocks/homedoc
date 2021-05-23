import {
  Note,
} from '../../models'

const getNote = query => {
  return Note.where(query).get()
}

const createNote = newNote => {
  return Note.create(newNote)
}

const updateNote = newNote => {
  return Note.where({ id: newNote.id }).update(newNote)
}

const upsertNote = newNote => {
  const id = Note.select('id').where({ id: newNote.id })
  if (!id) return Note.create(newNote)
  else return Note.where({ id: newNote.id }).update(newNote)
}

export {
  getNote,
  createNote,
  updateNote,
  upsertNote,
}

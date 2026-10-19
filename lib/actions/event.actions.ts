'use server'

import { revalidatePath } from 'next/cache'
import { connectToDatabase } from '@/lib/database'
import Event from '@/lib/database/models/event.model'
import User from '@/lib/database/models/user.model'
import Category from '@/lib/database/models/category.model'
import { requireCurrentDatabaseUserId } from '@/lib/auth'
import { eventMutationSchema, objectIdSchema } from '@/lib/validator'
import { handleError } from '@/lib/utils'
import {
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
} from '@/types'

const getCategoryByName = async (name: string) => {
  return Category.findOne({ name: { $regex: name, $options: 'i' } })
}

const populateEvent = (query: any) => {
  return query
    .populate({ path: 'organizer', model: User, select: '_id firstName lastName' })
    .populate({ path: 'category', model: Category, select: '_id name' })
}

const revalidateEvent = (eventId: string) => {
  revalidatePath('/')
  revalidatePath('/profile')
  revalidatePath(`/events/${eventId}`)
}

// CREATE: ownership always comes from the verified session.
export async function createEvent({ event }: CreateEventParams) {
  const organizer = await requireCurrentDatabaseUserId()
  const { categoryId, ...fields } = eventMutationSchema.parse(event)
  await connectToDatabase()

  const newEvent = await Event.create({
    ...fields,
    price: fields.isFree ? '0' : fields.price,
    category: categoryId,
    organizer,
  })
  revalidateEvent(newEvent._id.toString())
  return JSON.parse(JSON.stringify(newEvent))
}

export async function getEventById(eventId: string) {
  try {
    objectIdSchema.parse(eventId)
    await connectToDatabase()
    const event = await populateEvent(Event.findById(eventId))
    if (!event) throw new Error('Event not found')
    return JSON.parse(JSON.stringify(event))
  } catch (error) {
    handleError(error)
  }
}

// UPDATE: match ownership in the write itself to avoid a check/write race.
export async function updateEvent({ event }: UpdateEventParams) {
  const organizer = await requireCurrentDatabaseUserId()
  const eventId = objectIdSchema.parse(event._id)
  const { categoryId, ...fields } = eventMutationSchema.parse(event)
  await connectToDatabase()

  const updatedEvent = await Event.findOneAndUpdate(
    { _id: eventId, organizer },
    { $set: {
      ...fields,
      price: fields.isFree ? '0' : fields.price,
      category: categoryId,
    } },
    { new: true, runValidators: true }
  )
  if (!updatedEvent) throw new Error('Unauthorized or event not found')

  revalidateEvent(eventId)
  return JSON.parse(JSON.stringify(updatedEvent))
}

export async function deleteEvent({ eventId }: DeleteEventParams) {
  const organizer = await requireCurrentDatabaseUserId()
  objectIdSchema.parse(eventId)
  await connectToDatabase()

  const deletedEvent = await Event.findOneAndDelete({ _id: eventId, organizer })
  if (!deletedEvent) throw new Error('Unauthorized or event not found')
  revalidateEvent(eventId)
}

// GET ALL EVENTS
export async function getAllEvents({ query, limit = 6, page, category }: GetAllEventsParams) {
  try {
    await connectToDatabase()

    const titleCondition = query ? { title: { $regex: query, $options: 'i' } } : {}
    const categoryCondition = category ? await getCategoryByName(category) : null
    const conditions = {
      $and: [titleCondition, categoryCondition ? { category: categoryCondition._id } : {}],
    }

    const skipAmount = (Number(page) - 1) * limit
    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)

    const events = await populateEvent(eventsQuery)
    const eventsCount = await Event.countDocuments(conditions)

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: Math.ceil(eventsCount / limit),
    }
  } catch (error) {
    handleError(error)
  }
}

// GET EVENTS BY ORGANIZER
export async function getEventsByUser({ userId, limit = 6, page }: GetEventsByUserParams) {
  try {
    await connectToDatabase()

    const conditions = { organizer: userId }
    const skipAmount = (page - 1) * limit

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)

    const events = await populateEvent(eventsQuery)
    const eventsCount = await Event.countDocuments(conditions)

    return { data: JSON.parse(JSON.stringify(events)), totalPages: Math.ceil(eventsCount / limit) }
  } catch (error) {
    handleError(error)
  }
}

// GET RELATED EVENTS: EVENTS WITH SAME CATEGORY
export async function getRelatedEventsByCategory({
  categoryId,
  eventId,
  limit = 3,
  page = 1,
}: GetRelatedEventsByCategoryParams) {
  try {
    await connectToDatabase()

    const skipAmount = (Number(page) - 1) * limit
    const conditions = { $and: [{ category: categoryId }, { _id: { $ne: eventId } }] }

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)

    const events = await populateEvent(eventsQuery)
    const eventsCount = await Event.countDocuments(conditions)

    return { data: JSON.parse(JSON.stringify(events)), totalPages: Math.ceil(eventsCount / limit) }
  } catch (error) {
    handleError(error)
  }
}

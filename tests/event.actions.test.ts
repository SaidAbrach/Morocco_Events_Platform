import { beforeEach, describe, expect, it, vi } from 'vitest'
import { eventId, ownerId, otherId, validEvent } from './fixtures'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(), connect: vi.fn(), revalidate: vi.fn(),
  create: vi.fn(), update: vi.fn(), remove: vi.fn(),
}))
vi.mock('@/lib/auth', () => ({ requireCurrentDatabaseUserId: mocks.requireUser }))
vi.mock('@/lib/database', () => ({ connectToDatabase: mocks.connect }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }))
vi.mock('@/lib/database/models/event.model', () => ({
  default: { create: mocks.create, findOneAndUpdate: mocks.update, findOneAndDelete: mocks.remove },
}))
vi.mock('@/lib/database/models/user.model', () => ({ default: {} }))
vi.mock('@/lib/database/models/category.model', () => ({ default: {} }))

import { createEvent, updateEvent, deleteEvent } from '@/lib/actions/event.actions'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.requireUser.mockResolvedValue(ownerId)
  mocks.create.mockResolvedValue({ _id: eventId })
  mocks.update.mockResolvedValue({ _id: eventId })
  mocks.remove.mockResolvedValue({ _id: eventId })
})

describe('event mutations', () => {
  it('derives the organizer from the session and ignores forged ownership fields', async () => {
    await createEvent({
      userId: otherId,
      event: { ...validEvent, organizer: otherId, createdAt: new Date() },
      path: '/untrusted-cache-path',
    } as any)
    const { categoryId, ...fields } = validEvent
    expect(mocks.create).toHaveBeenCalledWith({ ...fields, category: categoryId, organizer: ownerId })
    expect(mocks.create.mock.calls[0][0]).not.toHaveProperty('createdAt')
    expect(mocks.revalidate).not.toHaveBeenCalledWith('/untrusted-cache-path')
  })

  it('normalizes the stored price for free events', async () => {
    await createEvent({ event: { ...validEvent, isFree: true, price: '' }, path: '/' })
    expect(mocks.create.mock.calls[0][0].price).toBe('0')
  })

  it('rejects signed-out creation, update and deletion before database writes', async () => {
    mocks.requireUser.mockRejectedValue(new Error('Sign in required'))
    await expect(createEvent({ event: validEvent, path: '/' })).rejects.toThrow('Sign in')
    await expect(updateEvent({ event: { ...validEvent, _id: eventId }, path: '/' })).rejects.toThrow('Sign in')
    await expect(deleteEvent({ eventId, path: '/' })).rejects.toThrow('Sign in')
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.remove).not.toHaveBeenCalled()
  })

  it('updates only the session owner\'s event in a single database operation', async () => {
    await updateEvent({
      userId: otherId,
      event: { ...validEvent, _id: eventId, organizer: otherId },
      path: '/',
    } as any)
    const [filter, change, options] = mocks.update.mock.calls[0]
    expect(filter).toEqual({ _id: eventId, organizer: ownerId })
    expect(change.$set).not.toHaveProperty('organizer')
    expect(change.$set).not.toHaveProperty('_id')
    expect(options).toEqual({ new: true, runValidators: true })
  })

  it('rejects an update when no owned event matches', async () => {
    mocks.update.mockResolvedValue(null)
    await expect(updateEvent({ event: { ...validEvent, _id: eventId }, path: '/' }))
      .rejects.toThrow('Unauthorized or event not found')
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })

  it('deletes only an event matching both ID and the signed-in owner', async () => {
    await deleteEvent({ eventId, path: '/' })
    expect(mocks.remove).toHaveBeenCalledWith({ _id: eventId, organizer: ownerId })
  })

  it('rejects deletion when no owned event matches', async () => {
    mocks.remove.mockResolvedValue(null)
    await expect(deleteEvent({ eventId, path: '/' })).rejects.toThrow('Unauthorized or event not found')
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })

  it('rejects malformed IDs and event data before mutations', async () => {
    await expect(deleteEvent({ eventId: 'invalid', path: '/' })).rejects.toThrow()
    await expect(createEvent({ event: { ...validEvent, price: '-10' }, path: '/' })).rejects.toThrow()
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.remove).not.toHaveBeenCalled()
  })
})

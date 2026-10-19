import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ownerId } from './fixtures'

const mocks = vi.hoisted(() => ({ auth: vi.fn(), connect: vi.fn(), findOne: vi.fn(), select: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }))
vi.mock('@/lib/database', () => ({ connectToDatabase: mocks.connect }))
vi.mock('@/lib/database/models/user.model', () => ({ default: { findOne: mocks.findOne } }))
import { getCurrentDatabaseUserId, requireCurrentDatabaseUserId } from '@/lib/auth'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.findOne.mockReturnValue({ select: mocks.select })
})

describe('verified session ownership', () => {
  it('returns no user for an anonymous session without querying the database', async () => {
    mocks.auth.mockResolvedValue({ userId: null })
    expect(await getCurrentDatabaseUserId()).toBeNull()
    expect(mocks.findOne).not.toHaveBeenCalled()
  })

  it('looks up the database user using the verified Clerk ID', async () => {
    mocks.auth.mockResolvedValue({ userId: 'clerk-owner', sessionClaims: { userId: 'forged-claim' } })
    mocks.select.mockResolvedValue({ _id: ownerId })
    expect(await requireCurrentDatabaseUserId()).toBe(ownerId)
    expect(mocks.findOne).toHaveBeenCalledWith({ clerkId: 'clerk-owner' })
    expect(mocks.select).toHaveBeenCalledWith('_id')
  })

  it('rejects a session whose user has not been synchronized to the database', async () => {
    mocks.auth.mockResolvedValue({ userId: 'clerk-pending' })
    mocks.select.mockResolvedValue(null)
    await expect(requireCurrentDatabaseUserId()).rejects.toThrow('synchronized account')
  })
})

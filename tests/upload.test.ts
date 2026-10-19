import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  middleware: undefined as undefined | (() => Promise<unknown>),
}))
vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }))
vi.mock('uploadthing/next', () => ({
  createUploadthing: () => () => ({
    middleware: (callback: () => Promise<unknown>) => {
      mocks.middleware = callback
      return { onUploadComplete: () => ({}) }
    },
  }),
}))
vi.mock('uploadthing/server', () => ({ UploadThingError: Error }))
import { ourFileRouter } from '@/app/api/uploadthing/core'

beforeEach(() => { mocks.auth.mockReset() })

it('rejects unsigned uploads', async () => {
  expect(ourFileRouter.imageUploader).toBeDefined()
  mocks.auth.mockResolvedValue({ userId: null })
  await expect(mocks.middleware!()).rejects.toThrow('Unauthorized')
})

it('tags uploads with the verified Clerk identity', async () => {
  mocks.auth.mockResolvedValue({ userId: 'clerk-owner' })
  await expect(mocks.middleware!()).resolves.toEqual({ userId: 'clerk-owner' })
})

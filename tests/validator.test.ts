import { describe, expect, it } from 'vitest'
import { eventFormSchema, eventMutationSchema } from '@/lib/validator'
import { validEvent } from './fixtures'

describe('event input validation', () => {
  it('accepts valid event data and strips ownership and operator fields', () => {
    const parsed = eventMutationSchema.parse({
      ...validEvent, organizer: 'forged', createdAt: new Date(), $set: { organizer: 'forged' },
    })
    expect(parsed).toEqual(validEvent)
  })

  it.each([
    { endDateTime: new Date('2029-01-01') },
    { endDateTime: validEvent.startDateTime },
    { startDateTime: new Date('invalid') },
    { categoryId: '' },
    { price: '-1' },
    { price: '1.001' },
    { price: '' },
    { imageUrl: '' },
    { imageUrl: 'javascript:alert(1)' },
    { url: 'javascript:alert(1)' },
    { url: 'invalid' },
  ])('rejects invalid mutation fields: %o', changes => {
    expect(eventMutationSchema.safeParse({ ...validEvent, ...changes }).success).toBe(false)
  })

  it('allows a free event with an empty price', () => {
    expect(eventMutationSchema.safeParse({ ...validEvent, isFree: true, price: '' }).success).toBe(true)
  })

  it('allows a local preview in the form, while the server requires a completed URL', () => {
    const input = { ...validEvent, imageUrl: 'blob:preview' }
    expect(eventFormSchema.safeParse(input).success).toBe(true)
    expect(eventMutationSchema.safeParse(input).success).toBe(false)
  })
})

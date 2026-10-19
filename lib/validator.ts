import * as z from 'zod'

const httpUrl = z.string().url().refine(
  value => {
    try { return ['http:', 'https:'].includes(new URL(value).protocol) }
    catch { return false }
  },
  'Use an HTTP or HTTPS URL'
)

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Select a valid record')

const eventFields = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().min(3, 'Description must be at least 3 characters').max(400),
  location: z.string().trim().min(3, 'Location must be at least 3 characters').max(400),
  // The form may hold a local image preview before UploadThing finishes.
  imageUrl: z.string(),
  startDateTime: z.date(),
  endDateTime: z.date(),
  categoryId: objectIdSchema,
  price: z.string().trim(),
  isFree: z.boolean(),
  url: httpUrl,
})

const validateScheduleAndPrice = (
  event: z.infer<typeof eventFields>,
  context: z.RefinementCtx
) => {
  if (event.endDateTime <= event.startDateTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDateTime'],
      message: 'End time must be after start time',
    })
  }
  if (!event.isFree && (!/^\d+(\.\d{1,2})?$/.test(event.price) || Number(event.price) <= 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price'],
      message: 'Enter a positive price with up to two decimal places',
    })
  }
}

export const eventFormSchema = eventFields.superRefine(validateScheduleAndPrice)

// The server requires the completed upload URL and strips fields outside the
// declared schema, including organizer, createdAt and MongoDB operators.
export const eventMutationSchema = eventFields.extend({
  imageUrl: httpUrl,
}).superRefine(validateScheduleAndPrice)

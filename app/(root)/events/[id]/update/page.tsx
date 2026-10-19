import EventForm from '@/components/shared/EventForm'
import { getEventById } from '@/lib/actions/event.actions'
import { requireCurrentDatabaseUserId } from '@/lib/auth'
import { notFound } from 'next/navigation'

type UpdateEventProps = { params: Promise<{ id: string }> }

export default async function UpdateEvent({ params }: UpdateEventProps) {
  const userId = await requireCurrentDatabaseUserId()
  const { id } = await params
  const event = await getEventById(id)
  if (!event || event.organizer._id.toString() !== userId) notFound()

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-10 md:py-14">
        <h3 className="wrapper h3-bold text-center">Update Event</h3>
      </section>
      <div className="wrapper my-10 md:my-16">
        <EventForm type="Update" event={event} eventId={event._id} />
      </div>
    </>
  )
}

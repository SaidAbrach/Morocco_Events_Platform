import EventForm from '@/components/shared/EventForm'
import { requireCurrentDatabaseUserId } from '@/lib/auth'

export default async function CreateEvent() {
  await requireCurrentDatabaseUserId()
  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center">Create Event</h3>
      </section>
      <div className="wrapper my-8">
        <EventForm type="Create" />
      </div>
    </>
  )
}

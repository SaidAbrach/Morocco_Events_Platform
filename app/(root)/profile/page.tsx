import Collection from '@/components/shared/Collection'
import { getEventsByUser } from '@/lib/actions/event.actions'
import { requireCurrentDatabaseUserId } from '@/lib/auth'

export default async function Profile() {
  const userId = await requireCurrentDatabaseUserId()
  const events = await getEventsByUser({ userId, page: 1, limit: 6 })

  return (
    <section className="wrapper my-10 flex flex-col gap-8">
      <div>
        <h1 className="h2-bold">My events</h1>
        <p className="p-regular-16 mt-3 text-grey-600">
          Your six most recent events. Use the edit and delete controls to manage your listings.
        </p>
      </div>
      <Collection
        data={events?.data ?? []}
        emptyTitle="No events yet"
        emptyStateSubtext="Create your first event to see it here."
        limit={6}
        page={1}
        totalPages={events?.totalPages ?? 0}
      />
    </section>
  )
}

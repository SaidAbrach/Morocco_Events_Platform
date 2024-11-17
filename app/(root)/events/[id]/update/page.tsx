import EventForm from "@/components/shared/EventForm";
import { getEventById } from "@/lib/actions/event.actions";
import { auth } from "@clerk/nextjs/server";

type UpdateEventProps = {
  params: {
    id: string;
  };
};

const UpdateEvent = async ({ params: { id } }: UpdateEventProps) => {
  const { sessionClaims } = await auth();

  const userId = sessionClaims?.userId as string;
  const event = await getEventById(id);

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-10 md:py-14">
        <h3 className="wrapper h3-bold text-center">
          Update Event
        </h3>
      </section>

      <div className="wrapper my-10 md:my-16">
        <EventForm type="Update" event={event} eventId={event._id} userId={userId} />
      </div>
    </>
  );
};

export default UpdateEvent;

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { clerkClient, WebhookEvent } from '@clerk/clerk-sdk-node';
import { createUser, deleteUser, updateUser } from '@/lib/actions/user.actions';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id') || '';
  const svixTimestamp = headerPayload.get('svix-timestamp') || '';
  const svixSignature = headerPayload.get('svix-signature') || '';

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Do something with the payload
  const {id} = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

    const user = {
      clerkId: id,
      email: email_addresses[0].email_address,
      username: username || 'unknown',
      firstName: first_name ?? '',
      lastName: last_name ?? '',
      photo: image_url,
    };

    const newUser = await createUser(user);
    if (newUser) {
      // Update Clerk user's metadata
      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: {
          userId: newUser._id,
        },
      });
    }
    return NextResponse.json({ message: 'OK', user: newUser });
  }

  if (eventType === 'user.updated') {
    const { id, image_url, first_name, last_name, username } = evt.data;

    const user = {
      firstName: first_name ?? '',
      lastName: last_name ?? '',
      username: username || 'unknown',
      photo: image_url,
    };

    const updatedUser = await updateUser(id, user);

    return NextResponse.json({ message: 'OK', user: updatedUser });
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    if (id) {
      const deletedUser = await deleteUser(id);
      return NextResponse.json({ message: 'OK', user: deletedUser });
    }
  }

  return new Response('', { status: 200 });
}

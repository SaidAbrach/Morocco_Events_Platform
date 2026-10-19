import 'server-only'

import { auth } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/database'
import User from '@/lib/database/models/user.model'

// Resolve ownership from the verified Clerk session, never from form data or
// a client-supplied database user ID.
export async function getCurrentDatabaseUserId(): Promise<string | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  await connectToDatabase()
  const user = await User.findOne({ clerkId }).select('_id')
  return user ? user._id.toString() : null
}

export async function requireCurrentDatabaseUserId(): Promise<string> {
  const userId = await getCurrentDatabaseUserId()
  if (!userId) throw new Error('Sign in with a synchronized account to continue')
  return userId
}

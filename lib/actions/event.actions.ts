"use server"

import { CreateEventParams } from "@/types"
import { connectToDatabase } from "../database"
import { handleError } from "../utils"
import User from "../database/models/user.model"
import Event from "../database/models/event.model"

export async function createEvent({ userId, event, path }: CreateEventParams) {
    try {
      await connectToDatabase()
  
      const organizer = await User.findById(userId)

      if (!organizer) {
        throw new Error('Organizer not found')
      }

      console.log({
        categoryId: event.categoryId,
        organizerId: userId,
      })
      const newEvent = await Event.create({ 
        ...event,
        category: event.categoryId,
        organizer: userId
    });

      return JSON.parse(JSON.stringify(newEvent))
    } catch (error) {
        console.log(error);
        handleError(error);
    }
  }
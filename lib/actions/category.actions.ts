"use server"

import { requireCurrentDatabaseUserId } from "@/lib/auth"
import { z } from "zod"
import { CreateCategoryParams } from "@/types"
import { connectToDatabase } from "../database"
import { handleError } from "../utils"
import Category from "../database/models/category.model"

export const createCategory = async ({ categoryName } :CreateCategoryParams) => {
    try {
        await requireCurrentDatabaseUserId();
        const name = z.string().trim().min(3).max(80).parse(categoryName);
        await connectToDatabase();

        const newCategory = await Category.create({ name });

        return JSON.parse(JSON.stringify(newCategory));
    }catch (error){
        handleError(error)

    }
}
export const getAllCategories = async () => {
    try {
        await connectToDatabase();

        const categories = await Category.find();

        return JSON.parse(JSON.stringify(categories));
    }catch (error){
        handleError(error)

    }
}

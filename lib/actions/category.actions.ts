"use server"

import { CreateCategoryParams } from "@/types"
import { connectToDatabse } from "../database"
import { handleError } from "../utils"
import Category from "../database/models/category.model"

export const createCategory = async ({ categoryName } :CreateCategoryParams) => {
    try {
        await connectToDatabse();

        const newCategory = await Category.create({ name: categoryName });

        return JSON.parse(JSON.stringify(newCategory));
    }catch (error){
        handleError(error)

    }
}
export const getAllCategories = async () => {
    try {
        await connectToDatabse();

        const categories = await Category.find();

        return JSON.parse(JSON.stringify(categories));
    }catch (error){
        handleError(error)

    }
}
import { z } from "zod";

// Schema for individual ingredient within a meal
const MealIngredientSchema = z.object({
  productId: z.number().int().positive("El producto es obligatorio"),
  quantity: z.number().int().min(1, "La cantidad debe ser al menos 1"),
});

// Schema for creating a new meal
export const MealSchema = z.object({
  name: z.string().min(2, "El nombre de la comida debe tener al menos 2 caracteres"),
  ingredients: z.array(MealIngredientSchema).min(1, "La comida debe tener al menos un ingrediente"),
});

export type MealInput = z.infer<typeof MealSchema>;
export type MealIngredientInput = z.infer<typeof MealIngredientSchema>;

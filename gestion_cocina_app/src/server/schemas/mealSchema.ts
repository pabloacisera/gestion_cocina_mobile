import { z } from "zod";

const MealIngredientSchema = z.object({
  productId: z.number().int().positive("El producto es obligatorio"),
  quantity:  z.number().positive("La cantidad debe ser mayor a 0"),
});

export const MealSchema = z.object({
  name:        z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  ingredients: z.array(MealIngredientSchema).min(1, "La comida debe tener al menos un ingrediente"),
});

export type MealInput        = z.infer<typeof MealSchema>;
export type MealIngredientInput = z.infer<typeof MealIngredientSchema>;
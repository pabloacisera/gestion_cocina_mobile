import { z } from "zod";

export const MeasureUnitEnum = z.enum(["KG", "G", "L", "ML", "UNIT", "OTHER"]);

export const ProductSchema = z.object({
  providerId: z.number().int().positive("El proveedor es obligatorio"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional().or(z.literal("")),
  measureUnit: MeasureUnitEnum.default("KG"),
  quantity: z.number().int().min(0, "La cantidad no puede ser negativa"),
  minStock: z.number().int().min(0).optional().default(0),
  // unitPrice fue eliminado — vive en PurchaseItem
});

export type ProductInput = z.infer<typeof ProductSchema>;

export const MEASURE_UNIT_LABELS: Record<string, string> = {
  KG: "Kilogramos (kg)",
  G: "Gramos (g)",
  L: "Litros (L)",
  ML: "Mililitros (ml)",
  UNIT: "Unidad",
  OTHER: "Otro",
};

import { z } from "zod";

export const ProviderSchema = z.object({
  name: z.string()
    .min(3, "El nombre de la empresa o proveedor debe tener al menos tres caracteres")
    .max(50, "El nombre de la empresa o proveedor es demasiado largo"),
  cuit: z.string()
    .regex(/^\d{2}-\d{8}-\d{1}$/, "Formato de CUIT inválido (ej: 20-12345678-9)")
    .optional()
    .or(z.literal("")),
  address: z.string().optional().or(z.literal(""))
});

export type ProviderInput = z.infer<typeof ProviderSchema>;

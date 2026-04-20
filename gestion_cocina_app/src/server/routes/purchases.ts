import { Router } from "express";
import { prisma } from "../prisma";
import { z } from "zod";
import { MeasureUnitEnum } from "../schemas/productSchema";

const router = Router();

const PurchaseItemSchema = z.object({
  productId:        z.number().int().optional(),
  isNew:            z.boolean().optional(),
  name:             z.string().optional(),
  measureUnit:      MeasureUnitEnum.optional(),
  description:      z.string().optional(),
  minStock:         z.number().min(0).optional(),
  purchaseUnit:    z.string().optional(),
  conversionFactor: z.number().positive().optional(),
  purchaseQty:      z.number().positive(),
  unitPrice:       z.number().nonnegative(),
});

const PurchaseSchema = z.object({
  providerId: z.number().int().positive(),
  items: z.array(PurchaseItemSchema).min(1),
  notes: z.string().optional(),
});

interface PurchaseItemInput {
  productId?: number;
  isNew?: boolean;
  name?: string;
  measureUnit?: any;
  description?: string;
  minStock?: number;
  purchaseUnit?: string;
  conversionFactor?: number;
  purchaseQty: number;
  unitPrice: number;
}

interface PurchaseData {
  providerId: number;
  items: PurchaseItemInput[];
  notes?: string;
}

router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        skip,
        take: limit,
        include: {
          provider: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.purchase.count()
    ]);

    res.json({ 
      success: true, 
      data: purchases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const validated = PurchaseSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: validated.error.flatten(),
      });
    }

    const { providerId, items, notes } = validated.data as PurchaseData;

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: "Proveedor no encontrado",
      });
    }

    const existingProductIds = items
      .filter((item) => !item.isNew && item.productId)
      .map((item) => item.productId as number);

    if (existingProductIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: existingProductIds } },
        select: { id: true, name: true, conversionFactor: true, purchaseUnit: true },
      });

      if (products.length !== existingProductIds.length) {
        return res.status(404).json({
          success: false,
          error: "Uno o más productos no encontrados",
        });
      }
    }

    const totalAmount = items.reduce((sum, item) => {
      return sum + item.purchaseQty * item.unitPrice;
    }, 0);

    const purchase = await prisma.$transaction(async (tx) => {
      const createdPurchase = await tx.purchase.create({
        data: {
          providerId,
          totalAmount,
          notes: notes || null,
        },
      });

      for (const item of items) {
        let finalProductId: number;
        let stockQty: number;
        let purchaseUnitToSave: string | null = null;
        let conversionFactorToSave: number = 1;

        if (item.isNew) {
          purchaseUnitToSave = item.purchaseUnit || null;
          conversionFactorToSave = item.conversionFactor ?? 1;
          stockQty = item.purchaseQty * conversionFactorToSave;

          const newProduct = await tx.product.create({
            data: {
              providerId,
              name: item.name!,
              measureUnit: item.measureUnit || "KG",
              description: item.description || null,
              minStock: item.minStock || 0,
              purchaseUnit: purchaseUnitToSave,
              conversionFactor: conversionFactorToSave,
              quantity: 0,
            },
          });
          finalProductId = newProduct.id;
        } else {
          const product = await tx.product.findUnique({
            where: { id: item.productId! },
            select: { conversionFactor: true, purchaseUnit: true },
          });
          conversionFactorToSave = product?.conversionFactor ?? 1;
          purchaseUnitToSave = product?.purchaseUnit ?? null;
          stockQty = item.purchaseQty * conversionFactorToSave;
          finalProductId = item.productId!;
        }

        const purchaseUnitDisplay = purchaseUnitToSave || (item.isNew ? (item.measureUnit || 'KG') : (item.isNew ? item.measureUnit : ''));

        await tx.purchaseItem.create({
          data: {
            purchaseId: createdPurchase.id,
            productId: finalProductId,
            purchaseQty: item.purchaseQty,
            stockQty: stockQty,
            unitPrice: item.unitPrice,
            subtotal: item.purchaseQty * item.unitPrice,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: finalProductId,
            quantity: stockQty,
            type: "IN",
            reason: `Compra #${createdPurchase.id} - ${item.purchaseQty} ${purchaseUnitDisplay} → ${stockQty.toFixed(2)} en stock`,
          },
        });

        await tx.product.update({
          where: { id: finalProductId },
          data: {
            quantity: {
              increment: stockQty,
            },
          },
        });
      }

      return await tx.purchase.findUnique({
        where: { id: createdPurchase.id },
        include: {
          provider: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    res.json({ success: true, data: purchase });
  } catch (error: any) {
    console.error("Error creating purchase:", error);
    next(error);
  }
});

export default router;
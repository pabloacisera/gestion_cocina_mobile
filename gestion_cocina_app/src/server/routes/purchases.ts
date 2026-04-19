import { Router } from "express";
import { prisma } from "../prisma";
import { z } from "zod";
import { MeasureUnitEnum } from "../schemas/productSchema";

const router = Router();

const PurchaseItemSchema = z.object({
  productId: z.number().int().optional(),
  isNew: z.boolean().optional(),
  name: z.string().optional(),
  measureUnit: MeasureUnitEnum.optional(),
  description: z.string().optional(),
  minStock: z.number().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
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
  quantity: number;
  unitPrice: number;
}

interface PurchaseData {
  providerId: number;
  items: PurchaseItemInput[];
  notes?: string;
}

// GET /api/purchases
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

// POST /api/purchases
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

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: "Proveedor no encontrado",
      });
    }

    // Verify all existing products exist
    const existingProductIds = items
      .filter((item) => !item.isNew && item.productId)
      .map((item) => item.productId as number);

    if (existingProductIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: existingProductIds } },
        select: { id: true, name: true },
      });

      if (products.length !== existingProductIds.length) {
        return res.status(404).json({
          success: false,
          error: "Uno o más productos no encontrados",
        });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Use transaction to create purchase, items, and stock movements
    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Create the purchase
      const createdPurchase = await tx.purchase.create({
        data: {
          providerId,
          totalAmount,
          notes: notes || null,
        },
      });

      for (const item of items) {
        let finalProductId: number;

        if (item.isNew) {
          // Create new product
          const newProduct = await tx.product.create({
            data: {
              providerId,
              name: item.name!,
              measureUnit: item.measureUnit || "KG",
              description: item.description || null,
              minStock: item.minStock || 0,
              quantity: 0, // Will be updated by stock movement or increment below
            },
          });
          finalProductId = newProduct.id;
        } else {
          finalProductId = item.productId!;
        }

        // 2. Create purchase item
        await tx.purchaseItem.create({
          data: {
            purchaseId: createdPurchase.id,
            productId: finalProductId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          },
        });

        // 3. Create stock movement (IN)
        await tx.stockMovement.create({
          data: {
            productId: finalProductId,
            quantity: item.quantity,
            type: "IN",
            reason: `Compra #${createdPurchase.id} - Proveedor: ${provider.name}`,
          },
        });

        // 4. Increment product quantity
        await tx.product.update({
          where: { id: finalProductId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }

      // Return purchase with all related data
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

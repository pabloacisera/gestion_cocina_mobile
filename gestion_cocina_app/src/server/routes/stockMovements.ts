import { Router } from "express";
import { prisma } from "../prisma";
import { z } from "zod";

const router = Router();

const StockMovementSchema = z.object({
  productId: z.number().int().positive(),
  quantity:  z.number().positive(),
  type:      z.enum(["IN", "OUT"]),
  reason:    z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const { from, to, providerId, productName } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    let where: any = {};
    
    // Filtro de fechas
    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from as string);
      }
      if (to) {
        const endDate = new Date(to as string);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    // Filtros de Producto y Proveedor
    if (providerId || productName) {
      where.product = {};
      if (providerId) {
        where.product.providerId = parseInt(providerId as string);
      }
      if (productName) {
        where.product.name = {
          contains: productName as string,
          // Prisma mode: 'insensitive' no es soportado directamente en sqlite de la misma forma,
          // pero para strings simples funciona bien.
        };
      }
    }

    const [stockMovements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            include: {
              provider: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.stockMovement.count({ where })
    ]);

    res.json({ 
      success: true, 
      data: stockMovements,
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
    const validated = StockMovementSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: validated.error.flatten()
      });
    }

    const { productId, quantity, type, reason } = validated.data;

    const stockMovement = await prisma.stockMovement.create({
      data: {
        productId,
        quantity,
        type,
        reason: reason || null,
      },
    });

    if (type === "IN") {
      await prisma.product.update({
        where: { id: productId },
        data: {
          quantity: { increment: quantity },
        },
      });
    } else if (type === "OUT") {
      await prisma.product.update({
        where: { id: productId },
        data: {
          quantity: { decrement: quantity },
        },
      });
    }

    res.json({ success: true, data: stockMovement });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    next(error);
  }
});

export default router;
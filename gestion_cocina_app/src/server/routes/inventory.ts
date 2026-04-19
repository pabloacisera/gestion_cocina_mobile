import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

// GET /api/inventory/alerts
router.get("/alerts", async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: { provider: true },
    });

    const lowStockProducts = products
      .filter(p => p.minStock !== null && p.quantity <= p.minStock)
      .sort((a, b) => (a.quantity - (a.minStock || 0)) - (b.quantity - (b.minStock || 0)));

    res.json({ 
      success: true, 
      data: lowStockProducts, 
      count: lowStockProducts.length 
    });
  } catch (error) {
    next(error);
  }
});

export default router;

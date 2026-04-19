import { Router } from "express";
import { prisma } from "../prisma";
import { ProductSchema, ProductInput } from "../schemas/productSchema";

const router = Router();

// GET /api/products
router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const providerId = req.query.providerId ? parseInt(req.query.providerId as string) : undefined;

    const where = providerId ? { providerId } : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { provider: true },
        orderBy: { name: 'asc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({ 
      success: true, 
      data: products,
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

// GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: { provider: true },
    });
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// POST /api/products
router.post("/", async (req, res, next) => {
  try {
    const validated = ProductSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        errors: validated.error.flatten() 
      });
    }
    
    const product = await prisma.product.create({
      data: validated.data,
    });
    res.json({ success: true, data: product });
  } catch (error: any) {
    // P2002 is for unique constraint violation. If providerId + name needs to be unique, this would apply.
    // For now, assuming no explicit unique constraint on product name besides provider.
    next(error);
  }
});

// PUT /api/products/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = ProductSchema.partial().safeParse(req.body); // Use partial for updates
    if (!validated.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        errors: validated.error.flatten() 
      });
    }

    // Construct data object carefully, only including fields that are present in validated.data
    const dataToUpdate: any = {};
    if (validated.data.providerId !== undefined) dataToUpdate.providerId = validated.data.providerId;
    if (validated.data.name !== undefined) dataToUpdate.name = validated.data.name;
    if (validated.data.description !== undefined) dataToUpdate.description = validated.data.description || null;
    if (validated.data.quantity !== undefined) dataToUpdate.quantity = validated.data.quantity;
    if (validated.data.measureUnit !== undefined) dataToUpdate.measureUnit = validated.data.measureUnit;
    if (validated.data.minStock !== undefined) dataToUpdate.minStock = validated.data.minStock;

    // Check if there's anything to update
    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ success: false, error: "No update fields provided" });
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id, 10) },
      data: dataToUpdate,
    });
    res.json({ success: true, data: product });
  } catch (error: any) {
    if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: "Product not found" });
    }
    next(error);
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id: parseInt(id, 10) },
    });
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: "Product not found" });
    }
    next(error);
  }
});

export default router;

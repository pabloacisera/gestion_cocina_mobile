import { Router } from "express";
import { prisma } from "../prisma";
import { ProviderSchema } from "../schemas/providerSchema";

const router = Router();

// GET /api/providers
router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.provider.count()
    ]);

    res.json({ 
      success: true, 
      data: providers,
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

// GET /api/providers/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const provider = await prisma.provider.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!provider) {
      return res.status(404).json({ success: false, error: "Provider not found" });
    }
    res.json({ success: true, data: provider });
  } catch (error) {
    next(error);
  }
});

// POST /api/providers
router.post("/", async (req, res, next) => {
  try {
    const validated = ProviderSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        errors: validated.error.flatten() 
      });
    }
    const { name, cuit, address } = validated.data;
    const provider = await prisma.provider.create({
      data: {
        name,
        cuit: cuit || null,
        address: address || null
      },
    });
    res.json({ success: true, data: provider });
  } catch (error: any) {
    if (error.code === 'P2002') {
       return res.status(400).json({ success: false, error: "Ya existe un proveedor con ese nombre" });
    }
    next(error);
  }
});

// PUT /api/providers/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = ProviderSchema.partial().safeParse(req.body); // Use partial for updates
    if (!validated.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        errors: validated.error.flatten() 
      });
    }
    
    // Construct data object carefully, only including fields that are present in validated.data
    const dataToUpdate: any = {};
    if (validated.data.name !== undefined) dataToUpdate.name = validated.data.name;
    if (validated.data.cuit !== undefined) dataToUpdate.cuit = validated.data.cuit || null;
    if (validated.data.address !== undefined) dataToUpdate.address = validated.data.address || null;

    // Check if there's anything to update
    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ success: false, error: "No update fields provided" });
    }

    const provider = await prisma.provider.update({
      where: { id: parseInt(id, 10) },
      data: dataToUpdate,
    });
    res.json({ success: true, data: provider });
  } catch (error: any) {
    if (error.code === 'P2002') {
       return res.status(400).json({ success: false, error: "Ya existe un proveedor con ese nombre" });
    }
    if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: "Provider not found" });
    }
    next(error);
  }
});

// DELETE /api/providers/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const providerId = parseInt(id, 10);

    const productCount = await prisma.product.count({ where: { providerId } });
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        error: `No se puede eliminar el proveedor porque tiene ${productCount} producto(s) asociado(s). Reasigna o elimina esos productos primero.`
      });
    }

    await prisma.provider.delete({
      where: { id: providerId },
    });
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: "Provider not found" });
    }
    next(error);
  }
});

export default router;

import { Router } from "express";
import { prisma } from "../prisma";
import { MealSchema, MealInput, MealIngredientInput } from "../schemas/mealSchema";

const router = Router();

// GET /api/meals
router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [meals, total] = await Promise.all([
      prisma.meal.findMany({
        skip,
        take: limit,
        include: {
          ingredients: {
            include: { product: true },
          },
        },
        orderBy: {
          servedAt: 'desc',
        }
      }),
      prisma.meal.count()
    ]);

    res.json({ 
      success: true, 
      data: meals,
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

// POST /api/meals
router.post("/", async (req, res, next) => {
  try {
    const validated = MealSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        errors: validated.error.flatten() 
      });
    }

    const { name, ingredients } = validated.data;

    // Step 1: Check if enough stock for all ingredients before starting transaction
    const productIds = ingredients.map(ing => ing.productId);
    const currentProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, quantity: true, name: true } // Select only needed fields
    });

    const productMap = new Map<number, { quantity: number, name: string }>();
    currentProducts.forEach(p => productMap.set(p.id, { quantity: p.quantity, name: p.name }));

    for (const ingredient of ingredients) {
      const productInfo = productMap.get(ingredient.productId);
      if (!productInfo) {
        return res.status(400).json({ success: false, error: `Product with ID ${ingredient.productId} not found.` });
      }
      if (productInfo.quantity < ingredient.quantity) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient stock for product "${productInfo.name}". Available: ${productInfo.quantity}, Required: ${ingredient.quantity}` 
        });
      }
    }

    // Step 2: Perform transaction if stock is sufficient
    const meal = await prisma.$transaction(async (tx) => {
      // 2.1 Create Meal
      const createdMeal = await tx.meal.create({
        data: {
          name,
          // servedAt will be set by default
        },
      });

      // 2.2 Create MealIngredients and StockMovements, and decrement Product quantity
      const stockMovements = [];
      const mealIngredients = [];

      for (const ingredient of ingredients) {
        mealIngredients.push(tx.mealIngredient.create({
          data: {
            mealId: createdMeal.id,
            productId: ingredient.productId,
            quantity: ingredient.quantity,
          },
        }));

        stockMovements.push(tx.stockMovement.create({
          data: {
            productId: ingredient.productId,
            quantity: ingredient.quantity,
            type: "OUT", // "OUT" for meal consumption
            reason: `Consumo en comida: ${createdMeal.name}`,
          },
        }));
        
        // Decrement product quantity in the same transaction
        // We've already checked sufficiency, so direct decrement is safe.
        await tx.product.update({
          where: { id: ingredient.productId },
          data: {
            quantity: {
              decrement: ingredient.quantity,
            },
          },
        });
      }

      // Execute all ingredient creations and stock movements in parallel
      await Promise.all([...mealIngredients, ...stockMovements]);

      return createdMeal;
    });

    res.json({ success: true, data: meal });

  } catch (error: any) {
    // Prisma.$transaction automatically rolls back on error
    next(error);
  }
});

// DELETE /api/meals/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const mealId = parseInt(id, 10);

    // Verificar que la comida existe
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: { ingredients: true }
    });

    if (!meal) {
      return res.status(404).json({ success: false, error: "Comida no encontrada" });
    }

    // Eliminar la comida (los ingredientes se eliminan en cascade si está configurado, sino manual)
    await prisma.mealIngredient.deleteMany({
      where: { mealId }
    });

    await prisma.meal.delete({
      where: { id: mealId }
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: "Comida no encontrada" });
    }
    next(error);
  }
});

export default router;

import express from "express";
import ViteExpress from "vite-express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";

// Import routers
import providersRouter from "./routes/providers";
import productsRouter from "./routes/products";
import mealsRouter from "./routes/meals";
import inventoryRouter from "./routes/inventory";
import stockMovementsRouter from "./routes/stockMovements";
import authRouter from "./routes/auth"; // Auth router is now implemented and needs to be imported
import purchasesRouter from "./routes/purchases";

ViteExpress.config({
  mode: "production",
  inlineViteConfig: {
    root: ".",
    base: "/",
    build: { outDir: "dist" },
  },
});

const app = express();

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      },
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: 'draft-7', // draft-6: `RateLimit-...` headers; draft-7: combined `RateLimit-...`
  legacyHeaders: false, // Disable the `X-RateLimit-...` headers.
});
app.use(limiter);

// Routes
app.use("/api/providers", providersRouter);
app.use("/api/products", productsRouter);
app.use("/api/meals", mealsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/stock-movements", stockMovementsRouter);
app.use("/api/auth", authRouter); // Mount the auth router
app.use("/api/purchases", purchasesRouter);

// Test endpoint
app.get("/hello", (_, res) => {
  res.send("Hello Vite + React + TypeScript!");
});

// Global error handler
// It must be defined after all other app.use() and routes calls
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack); // Log the error stack trace for debugging
  res.status(500).json({ 
    success: false, 
    error: err.message || "Internal server error" 
  });
});

// Start the server
ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);

import express from "express";
import cors from "cors";

import productRoutes from "./routes/product.routes.js";

import { notFound } from "./middlewares/not-found.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "E-commerce API is running",
  });
});

app.use("/api/products", productRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
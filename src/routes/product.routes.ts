import { Router } from "express";

import {
  getProducts,
  createProduct,
  getProductBySlug,
  SearchPagegetProductsss
} from "../controllers/product.controller.js";

const router = Router();

router.get("/search",SearchPagegetProductsss)

router.get("/", getProducts);

router.get("/:slug", getProductBySlug);

router.post("/", createProduct);

export default router;
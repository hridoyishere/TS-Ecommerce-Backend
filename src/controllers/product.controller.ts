import type { Request, Response, NextFunction } from "express";

import * as productService from "../services/product.service.js";

import type { CreateProductInput } from "../types/product.js";

// GET /api/products?page=1
export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = Number(req.query.page ?? 1);

    if (!Number.isSafeInteger(page) || page < 1) {
      res.status(400).json({
        success: false,
        message: "Page must be a positive integer",
      });
      return;
    }

    const result = await productService.getAllProducts(page, 4);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products/:slug
export async function getProductBySlug(
  req: Request<{ slug: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug } = req.params;

    const product = await productService.getProductBySlug(slug);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/products
export async function createProduct(
  req: Request<object, unknown, CreateProductInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await productService.createProduct(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
}






export async function SearchPagegetProductsss(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = Number(req.query.page ?? 1);
    const search = String(req.query.search ?? "").trim();
    const category = String(req.query.category ?? "").trim();
    const sort = String(req.query.sort ?? "new");

    if (!Number.isSafeInteger(page) || page < 1) {
      res.status(400).json({
        success: false,
        message: "Page must be a positive integer",
      });
      return;
    }

    const allowedSorts = [
      "new",
      "popular",
      "price-low",
      "price-high",
    ];

    if (!allowedSorts.includes(sort)) {
      res.status(400).json({
        success: false,
        message: "Invalid sorting option",
      });
      return;
    }

    const result = await productService.SearchPagegetAllProducts({
      page,
      limit: 4,
      search,
      category,
      sort,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

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

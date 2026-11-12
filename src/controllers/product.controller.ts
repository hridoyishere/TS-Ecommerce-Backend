import type {
  Request,
  Response,
  NextFunction,
} from "express";

import * as productService from "../services/product.service.js";

import type {
  CreateProductInput,
  UpdateProductInput,
} from "../types/product.js";

function validateProduct(
  data: unknown,
  isUpdate = false
): string | null {
  if (
    typeof data !== "object" ||
    data === null ||
    Array.isArray(data)
  ) {
    return "Invalid request body";
  }

  const body = data as Record<string, unknown>;

  if (!isUpdate) {
    for (const field of ["name", "category", "price"]) {
      if (!Object.hasOwn(body, field)) {
        return `${field} is required`;
      }
    }
  }

  if (
    Object.hasOwn(body, "name") &&
    (typeof body.name !== "string" || !body.name.trim())
  ) {
    return "Name must be a non-empty string";
  }

  if (
    Object.hasOwn(body, "category") &&
    (typeof body.category !== "string" || !body.category.trim())
  ) {
    return "Category must be a non-empty string";
  }

  if (
    Object.hasOwn(body, "price") &&
    (typeof body.price !== "number" ||
      !Number.isFinite(body.price) ||
      body.price < 0)
  ) {
    return "Price must be a non-negative number";
  }

  if (
    Object.hasOwn(body, "rating") &&
    (typeof body.rating !== "number" ||
      !Number.isFinite(body.rating) ||
      body.rating < 0 ||
      body.rating > 5)
  ) {
    return "Rating must be between 0 and 5";
  }

  if (
    Object.hasOwn(body, "reviews") &&
    (typeof body.reviews !== "number" ||
      !Number.isInteger(body.reviews) ||
      body.reviews < 0)
  ) {
    return "Reviews must be a non-negative integer";
  }

  if (
    Object.hasOwn(body, "description") &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    return "Description must be a string or null";
  }

  if (
    Object.hasOwn(body, "images") &&
    (!Array.isArray(body.images) ||
      !body.images.every(
        (item) => typeof item === "string" && item.trim()
      ))
  ) {
    return "Images must be an array of non-empty strings";
  }

  if (
    Object.hasOwn(body, "highlights") &&
    (!Array.isArray(body.highlights) ||
      !body.highlights.every(
        (item) => typeof item === "string" && item.trim()
      ))
  ) {
    return "Highlights must be an array of non-empty strings";
  }

  if (Object.hasOwn(body, "specs")) {
    if (
      typeof body.specs !== "object" ||
      body.specs === null ||
      Array.isArray(body.specs) ||
      !Object.values(body.specs).every(
        (value) => typeof value === "string"
      )
    ) {
      return "Specs must be an object containing string values";
    }
  }

  return null;
}

function isValidId(value: string): number | null {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

// GET /api/products
export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const products = await productService.getAllProducts();

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products/:id
export async function getProduct(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = isValidId(req.params.id);

    if (id === null) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const product = await productService.getProductById(id);

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
  next: NextFunction
): Promise<void> {
  try {
    const errorMessage = validateProduct(req.body);

    if (errorMessage) {
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
      return;
    }

    const data: CreateProductInput = {
      ...req.body,
      name: req.body.name.trim(),
      category: req.body.category.trim(),
      rating: req.body.rating ?? 0,
      reviews: req.body.reviews ?? 0,
      images: req.body.images ?? [],
      highlights: req.body.highlights ?? [],
      specs: req.body.specs ?? {},
    };

    const product = await productService.createProduct(data);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/products/:id
export async function updateProduct(
  req: Request<{ id: string }, unknown, UpdateProductInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = isValidId(req.params.id);

    if (id === null) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    if (Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
      return;
    }

    const errorMessage = validateProduct(req.body, true);

    if (errorMessage) {
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
      return;
    }

    const data: UpdateProductInput = { ...req.body };

    if (data.name !== undefined) {
      data.name = data.name.trim();
    }

    if (data.category !== undefined) {
      data.category = data.category.trim();
    }

    const product = await productService.updateProduct(id, data);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/products/:id
export async function deleteProduct(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = isValidId(req.params.id);

    if (id === null) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const deleted = await productService.deleteProduct(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
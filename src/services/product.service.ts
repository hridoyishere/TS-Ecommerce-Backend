
import db from "../config/database.js";

import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "../types/product.js";

// Convert PostgreSQL NUMERIC values into JavaScript numbers
function mapProduct(row: Product): Product {
  return {
    ...row,
    price: Number(row.price),
    rating: Number(row.rating),
    reviews: Number(row.reviews),
    images: row.images ?? [],
    details: row.details ?? [],
  };
}

// GET ALL PRODUCTS
export async function getAllProducts(
  page: number,
  limit: number = 4
) {
  const offset = (page - 1) * limit;

  const [productsResult, countResult] = await Promise.all([
    db.query(
      `SELECT * FROM products
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),

    db.query(
      `SELECT COUNT(*) FROM products`
    ),
  ]);

  const totalProducts = Number(countResult.rows[0].count);

  return {
    products: productsResult.rows.map(mapProduct),
    pagination: {
      currentPage: page,
      limit,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      hasNextPage: page < Math.ceil(totalProducts / limit),
      hasPreviousPage: page > 1,
    },
  };
}



// CREATE PRODUCT
export async function createProduct(
  data: CreateProductInput
): Promise<Product> {
  const result = await db.query(
    `INSERT INTO products (
      slug,
      name,
      category,
      price,
      rating,
      reviews,
      badge,
      image,
      images,
      description,
      details
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      data.slug,
      data.name,
      data.category,
      data.price,
      data.rating ?? 0,
      data.reviews ?? 0,
      data.badge ?? null,
      data.image,
      data.images ?? [],
      data.description ?? null,
      data.details ?? [],
    ]
  );

  return mapProduct(result.rows[0]);
}
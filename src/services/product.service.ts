
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
  limit: number = 2
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

// GET SINGLE PRODUCT BY SLUG
export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
  const result = await db.query(
    `SELECT * FROM products WHERE slug = $1 LIMIT 1`,
    [slug]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapProduct(result.rows[0]);
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



interface GetProductsOptions {
  page: number;
  limit: number;
  search: string;
  category: string;
  sort: string;
}

export async function SearchPagegetAllProducts({
  page,
  limit,
  search,
  category,
  sort,
}: GetProductsOptions) {
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  // Search by product name, category or description
  if (search) {
    values.push(`%${search}%`);
    const index = values.length;

    conditions.push(`
      (
        name ILIKE $${index}
        OR category ILIKE $${index}
        OR description ILIKE $${index}
      )
    `);
  }

  // Filter by category
  if (category) {
    values.push(category);
    conditions.push(`category ILIKE $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // Safe sorting options
  const sortOptions: Record<string, string> = {
    new: "created_at DESC",
    popular: "reviews DESC",
    "price-low": "price ASC",
    "price-high": "price DESC",
  };

  const orderBy = sortOptions[sort] ?? sortOptions.new;

  // Fetch products and total count
  const [productsResult, countResult] = await Promise.all([
    db.query(
      `
        SELECT *
        FROM products
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      `,
      [...values, limit, offset],
    ),

    db.query(
      `
        SELECT COUNT(*)
        FROM products
        ${whereClause}
      `,
      values,
    ),
  ]);

  const totalProducts = Number(countResult.rows[0].count);
  const totalPages = Math.ceil(totalProducts / limit);

  return {
    products: productsResult.rows.map(mapProduct),

    pagination: {
      currentPage: page,
      limit,
      totalProducts,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

// GET PRODUCT CATEGORIES WITH COUNTS
export async function getProductCategories() {
  const result = await db.query(`
    SELECT category AS name, COUNT(*) AS count
    FROM products
    GROUP BY category
    ORDER BY category ASC
  `);

  return result.rows.map((row) => ({
    name: row.name,
    count: Number(row.count),
  }));
}

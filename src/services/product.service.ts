import db from "../config/database.js";

import type { PoolClient } from "pg";
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "../types/product.js";

const productSelect = `
  SELECT
    p.*,

    COALESCE(
      (
        SELECT json_agg(pi.image_url ORDER BY pi.id)
        FROM product_images pi
        WHERE pi.product_id = p.id
      ),
      '[]'::json
    ) AS images,

    COALESCE(
      (
        SELECT json_agg(ph.highlight ORDER BY ph.id)
        FROM product_highlights ph
        WHERE ph.product_id = p.id
      ),
      '[]'::json
    ) AS highlights,

    COALESCE(
      (
        SELECT json_object_agg(ps.spec_name, ps.spec_value)
        FROM product_specs ps
        WHERE ps.product_id = p.id
      ),
      '{}'::json
    ) AS specs

  FROM products p
`;

async function addProductDetails(
  client: PoolClient,
  productId: number,
  data: CreateProductInput
): Promise<void> {
  const {
    images = [],
    highlights = [],
    specs = {},
  } = data;

  for (const image of images) {
    await client.query(
      `INSERT INTO product_images (product_id, image_url)
       VALUES ($1, $2)`,
      [productId, image]
    );
  }

  for (const highlight of highlights) {
    await client.query(
      `INSERT INTO product_highlights (product_id, highlight)
       VALUES ($1, $2)`,
      [productId, highlight]
    );
  }

  for (const [name, value] of Object.entries(specs)) {
    await client.query(
      `INSERT INTO product_specs (product_id, spec_name, spec_value)
       VALUES ($1, $2, $3)`,
      [productId, name, value]
    );
  }
}

export async function getAllProducts(): Promise<Product[]> {
  const result = await db.query<Product>(
    `${productSelect} ORDER BY p.id DESC`
  );

  return result.rows;
}

export async function getProductById(
  id: number
): Promise<Product | null> {
  const result = await db.query<Product>(
    `${productSelect} WHERE p.id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function createProduct(
  data: CreateProductInput
): Promise<Product | null> {
  const client = await db.connect();

  let productId: number;

  try {
    await client.query("BEGIN");

    const result = await client.query<{ id: number }>(
      `INSERT INTO products
       (name, category, price, rating, reviews, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        data.name,
        data.category,
        data.price,
        data.rating ?? 0,
        data.reviews ?? 0,
        data.description ?? null,
      ]
    );

    productId = result.rows[0].id;

    await addProductDetails(client, productId, data);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getProductById(productId);
}

export async function updateProduct(
  id: number,
  data: UpdateProductInput
): Promise<Product | null> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const fields: Array<
      keyof Pick<
        UpdateProductInput,
        "name" | "category" | "price" |
        "rating" | "reviews" | "description"
      >
    > = [
      "name",
      "category",
      "price",
      "rating",
      "reviews",
      "description",
    ];

    const values: Array<string | number | null> = [];
    const updates: string[] = [];

    for (const field of fields) {
      if (Object.hasOwn(data, field)) {
        values.push(data[field] as string | number | null);
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length > 0) {
      values.push(id);

      const result = await client.query(
        `UPDATE products
         SET ${updates.join(", ")},
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $${values.length}
         RETURNING id`,
        values
      );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return null;
      }
    } else {
      const result = await client.query(
        "SELECT id FROM products WHERE id = $1",
        [id]
      );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return null;
      }
    }

    if (Object.hasOwn(data, "images")) {
      await client.query(
        "DELETE FROM product_images WHERE product_id = $1",
        [id]
      );

      for (const image of data.images ?? []) {
        await client.query(
          `INSERT INTO product_images (product_id, image_url)
           VALUES ($1, $2)`,
          [id, image]
        );
      }
    }

    if (Object.hasOwn(data, "highlights")) {
      await client.query(
        "DELETE FROM product_highlights WHERE product_id = $1",
        [id]
      );

      for (const highlight of data.highlights ?? []) {
        await client.query(
          `INSERT INTO product_highlights (product_id, highlight)
           VALUES ($1, $2)`,
          [id, highlight]
        );
      }
    }

    if (Object.hasOwn(data, "specs")) {
      await client.query(
        "DELETE FROM product_specs WHERE product_id = $1",
        [id]
      );

      for (const [name, value] of Object.entries(data.specs ?? {})) {
        await client.query(
          `INSERT INTO product_specs
           (product_id, spec_name, spec_value)
           VALUES ($1, $2, $3)`,
          [id, name, value]
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getProductById(id);
}

export async function deleteProduct(id: number): Promise<boolean> {
  const result = await db.query(
    "DELETE FROM products WHERE id = $1 RETURNING id",
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}
CREATE TABLE IF NOT EXISTS products (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    rating NUMERIC(2, 1) NOT NULL DEFAULT 0
        CHECK (rating >= 0 AND rating <= 5),
    reviews INTEGER NOT NULL DEFAULT 0
        CHECK (reviews >= 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id INTEGER NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_highlights (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id INTEGER NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    highlight TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_specs (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id INTEGER NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    spec_name VARCHAR(100) NOT NULL,
    spec_value VARCHAR(255) NOT NULL,
    UNIQUE (product_id, spec_name)
);

CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category);

CREATE INDEX IF NOT EXISTS idx_products_created_at
ON products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
ON product_images(product_id);

CREATE INDEX IF NOT EXISTS idx_product_highlights_product_id
ON product_highlights(product_id);

CREATE INDEX IF NOT EXISTS idx_product_specs_product_id
ON product_specs(product_id);
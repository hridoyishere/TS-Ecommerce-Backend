import type { QueryResultRow } from "pg";

export interface Product extends QueryResultRow {
  id: number;
  name: string;
  category: string;
  price: string;
  rating: string;
  reviews: number;
  description: string | null;

  images: string[];
  highlights: string[];
  specs: Record<string, string>;

  created_at: Date;
  updated_at: Date;
}

export interface CreateProductInput {
  name: string;
  category: string;
  price: number;

  rating?: number;
  reviews?: number;
  description?: string | null;

  images?: string[];
  highlights?: string[];
  specs?: Record<string, string>;
}

export type UpdateProductInput =
  Partial<CreateProductInput>;
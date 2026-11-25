
export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  badge: string | null;
  image: string;
  images: string[];
  description: string | null;
  details: string[];
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateProductInput {
  slug: string;
  name: string;
  category: string;
  price: number;
  rating?: number;
  reviews?: number;
  badge?: string | null;
  image: string;
  images?: string[];
  description?: string | null;
  details?: string[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

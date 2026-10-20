import { apiRequest } from "../../apiClient";

const PRODUCT_API_URL = import.meta.env.VITE_PRODUCT_API_URL ?? "http://localhost:8081";

export interface ProductCategoryAttribute {
  id: number;
  name: string;
  dataType: string;
  unit: string | null;
  required: boolean;
  comparable: boolean;
  displayOrder: number;
}

export interface ProductCategory {
  id: number;
  parentCategoryId: number | null;
  name: string;
  description: string;
  attributes: ProductCategoryAttribute[];
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  return apiRequest<ProductCategory[]>(PRODUCT_API_URL, "/categories");
}

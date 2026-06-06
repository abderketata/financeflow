export interface StrapiEntity<T> {
  id: number;
  attributes: T;
}

export interface StrapiCollectionResponse<T> {
  data: Array<StrapiEntity<T> | T>;
  meta?: Record<string, unknown>;
}

export interface StrapiPaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: StrapiPaginationMeta;
}

export interface StrapiSingleResponse<T> {
  data: StrapiEntity<T> | T | null;
  meta?: Record<string, unknown>;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email?: string;
  };
}


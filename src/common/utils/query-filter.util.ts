import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

/**
 * Generic filter options — reusable across all entities.
 */
export interface SearchOption {
  term: string;
  fields: string[];
}

export interface SortOption {
  field: string;
  order: 'ASC' | 'DESC';
  allowed: string[];
}

export interface PaginationOption {
  page: number;
  limit: number;
}

export interface FilterOptions {
  search?: SearchOption;
  filters?: Record<string, any>;
  sort?: SortOption;
  pagination?: PaginationOption;
}

/**
 * Applies search, filters, sorting, and pagination to any QueryBuilder.
 * Works for User, Product, Post — any entity.
 *
 * Usage:
 *   const qb = repo.createQueryBuilder('user');
 *   applyFilters(qb, 'user', { search: {...}, filters: {...}, ... });
 *   const [data, count] = await qb.getManyAndCount();
 */
export function applyFilters<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  options: FilterOptions,
): SelectQueryBuilder<T> {
  // Search: OR across multiple fields with LIKE
  if (options.search?.term) {
    const conditions = options.search.fields
      .map((field, i) => `${alias}.${field} LIKE :search_${i}`)
      .join(' OR ');
    const params: Record<string, string> = {};
    options.search.fields.forEach((_, i) => {
      params[`search_${i}`] = `%${options.search!.term}%`;
    });
    qb.andWhere(`(${conditions})`, params);
  }

  // Exact filters: only apply if value is defined
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null && value !== '') {
        qb.andWhere(`${alias}.${key} = :filter_${key}`, { [`filter_${key}`]: value });
      }
    }
  }

  // Sort: validate against allowed fields to prevent injection
  if (options.sort) {
    const safeField = options.sort.allowed.includes(options.sort.field)
      ? options.sort.field
      : options.sort.allowed[0];
    const safeOrder = options.sort.order === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(`${alias}.${safeField}`, safeOrder);
  }

  // Pagination
  if (options.pagination) {
    const { page, limit } = options.pagination;
    qb.skip((page - 1) * limit).take(limit);
  }

  return qb;
}

/**
 * Helper to build paginated response object.
 */
export function paginatedResponse<T>(
  data: T[],
  count: number,
  page: number,
  limit: number,
) {
  return {
    data,
    meta: {
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

// src/shared/services/repositories/baseRepository.ts
import type { 
  PaginatedResponse, 
  PaginationParams, 
  FilterParams,
  SortParams,
  RequestConfig
} from '../../types/api.types';
import { ApiClient } from '../api/apiClient';

// ========================
// QUERY BUILDER TYPES
// ========================
export interface QueryBuilder {
  filter(params: FilterParams): QueryBuilder;
  sort(params: SortParams): QueryBuilder;
  paginate(params: PaginationParams): QueryBuilder;
  include(...relations: string[]): QueryBuilder;
  build(): string;
}

export interface RepositoryConfig {
  endpoint: string;
  idField?: string;
}

// ========================
// QUERY BUILDER IMPLEMENTATION
// ========================
export class ApiQueryBuilder implements QueryBuilder {
  private queryParams: URLSearchParams;

  constructor() {
    this.queryParams = new URLSearchParams();
  }

  filter(params: FilterParams): QueryBuilder {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(val => this.queryParams.append(`${key}[]`, String(val)));
        } else {
          this.queryParams.set(key, String(value));
        }
      }
    });
    return this;
  }

  sort(params: SortParams): QueryBuilder {
    if (params.field) {
      const sortValue = params.order === 'desc' ? `-${params.field}` : params.field;
      this.queryParams.set('ordering', sortValue);
    }
    return this;
  }

  paginate(params: PaginationParams): QueryBuilder {
    if (params.page) {
      this.queryParams.set('page', String(params.page));
    }
    if (params.pageSize) {
      this.queryParams.set('page_size', String(params.pageSize));
    }
    if (params.offset) {
      this.queryParams.set('offset', String(params.offset));
    }
    if (params.limit) {
      this.queryParams.set('limit', String(params.limit));
    }
    return this;
  }

  include(...relations: string[]): QueryBuilder {
    if (relations.length > 0) {
      this.queryParams.set('expand', relations.join(','));
    }
    return this;
  }

  build(): string {
    const query = this.queryParams.toString();
    return query ? `?${query}` : '';
  }
}

// ========================
// BASE REPOSITORY INTERFACE
// ========================
export interface IBaseRepository<TEntity, TCreateDto = Partial<TEntity>, TUpdateDto = Partial<TEntity>> {
  // CRUD Operations
  findAll(params?: {
    filter?: FilterParams;
    sort?: SortParams;
    pagination?: PaginationParams;
    include?: string[];
  }): Promise<PaginatedResponse<TEntity>>;
  
  findById(id: string | number, include?: string[]): Promise<TEntity>;
  
  create(data: TCreateDto): Promise<TEntity>;
  
  update(id: string | number, data: TUpdateDto): Promise<TEntity>;
  
  delete(id: string | number): Promise<void>;
  
  // Bulk Operations
  bulkCreate(data: TCreateDto[]): Promise<TEntity[]>;
  
  bulkUpdate(updates: Array<{ id: string | number; data: TUpdateDto }>): Promise<TEntity[]>;
  
  bulkDelete(ids: Array<string | number>): Promise<void>;
  
  // Search and Filter
  search(query: string, params?: {
    fields?: string[];
    filter?: FilterParams;
    pagination?: PaginationParams;
  }): Promise<PaginatedResponse<TEntity>>;
  
  count(filter?: FilterParams): Promise<number>;
  
  exists(id: string | number): Promise<boolean>;
}

// ========================
// BASE REPOSITORY IMPLEMENTATION
// ========================
export class BaseRepository<TEntity, TCreateDto = Partial<TEntity>, TUpdateDto = Partial<TEntity>> 
  implements IBaseRepository<TEntity, TCreateDto, TUpdateDto> {
  
  protected apiClient: ApiClient;
  protected config: RepositoryConfig;

  constructor(apiClient: ApiClient, config: RepositoryConfig) {
    this.apiClient = apiClient;
    this.config = config;
  }

  // ========================
  // CRUD OPERATIONS
  // ========================
  async findAll(params?: {
    filter?: FilterParams;
    sort?: SortParams;
    pagination?: PaginationParams;
    include?: string[];
  }): Promise<PaginatedResponse<TEntity>> {
    const queryBuilder = new ApiQueryBuilder();
    
    if (params?.filter) {
      queryBuilder.filter(params.filter);
    }
    
    if (params?.sort) {
      queryBuilder.sort(params.sort);
    }
    
    if (params?.pagination) {
      queryBuilder.paginate(params.pagination);
    }
    
    if (params?.include) {
      queryBuilder.include(...params.include);
    }

    const queryString = queryBuilder.build();
    const url = `${this.config.endpoint}${queryString}`;
    
    return this.apiClient.get<PaginatedResponse<TEntity>>(url);
  }

  async findById(id: string | number, include?: string[]): Promise<TEntity> {
    const queryBuilder = new ApiQueryBuilder();
    
    if (include && include.length > 0) {
      queryBuilder.include(...include);
    }

    const queryString = queryBuilder.build();
    const url = `${this.config.endpoint}${id}/${queryString}`;
    
    return this.apiClient.get<TEntity>(url);
  }

  async create(data: TCreateDto): Promise<TEntity> {
    return this.apiClient.post<TEntity>(this.config.endpoint, data);
  }

  async update(id: string | number, data: TUpdateDto): Promise<TEntity> {
    const url = `${this.config.endpoint}${id}/`;
    return this.apiClient.patch<TEntity>(url, data);
  }

  async delete(id: string | number): Promise<void> {
    const url = `${this.config.endpoint}${id}/`;
    return this.apiClient.delete<void>(url);
  }

  // ========================
  // BULK OPERATIONS
  // ========================
  async bulkCreate(data: TCreateDto[]): Promise<TEntity[]> {
    const url = `${this.config.endpoint}bulk/`;
    return this.apiClient.post<TEntity[]>(url, { items: data });
  }

  async bulkUpdate(updates: Array<{ id: string | number; data: TUpdateDto }>): Promise<TEntity[]> {
    const url = `${this.config.endpoint}bulk/`;
    return this.apiClient.patch<TEntity[]>(url, { updates });
  }

  async bulkDelete(ids: Array<string | number>): Promise<void> {
    const url = `${this.config.endpoint}bulk/`;
    const config: RequestConfig = {
      data: { ids }
    };
    return this.apiClient.delete<void>(url, config);
  }

  // ========================
  // SEARCH AND FILTER
  // ========================
  async search(query: string, params?: {
    fields?: string[];
    filter?: FilterParams;
    pagination?: PaginationParams;
  }): Promise<PaginatedResponse<TEntity>> {
    const queryBuilder = new ApiQueryBuilder();
    
    // Add search query
    queryBuilder.filter({ search: query });
    
    // Add search fields if specified
    if (params?.fields && params.fields.length > 0) {
      queryBuilder.filter({ search_fields: params.fields.join(',') });
    }
    
    if (params?.filter) {
      queryBuilder.filter(params.filter);
    }
    
    if (params?.pagination) {
      queryBuilder.paginate(params.pagination);
    }

    const queryString = queryBuilder.build();
    const url = `${this.config.endpoint}search/${queryString}`;
    
    return this.apiClient.get<PaginatedResponse<TEntity>>(url);
  }

  async count(filter?: FilterParams): Promise<number> {
    const queryBuilder = new ApiQueryBuilder();
    
    if (filter) {
      queryBuilder.filter(filter);
    }

    const queryString = queryBuilder.build();
    const url = `${this.config.endpoint}count/${queryString}`;
    
    const response = await this.apiClient.get<{ count: number }>(url);
    return response.count;
  }

  async exists(id: string | number): Promise<boolean> {
    try {
      await this.findById(id);
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  // ========================
  // UTILITY METHODS
  // ========================
  protected buildEndpointUrl(path: string = ''): string {
    return `${this.config.endpoint}${path}`;
  }

  protected getIdField(): string {
    return this.config.idField || 'id';
  }

  protected extractId(entity: any): string | number {
    const idField = this.getIdField();
    return entity[idField];
  }

  // ========================
  // VALIDATION HELPERS
  // ========================
  protected validateId(id: string | number): void {
    if (!id) {
      throw new Error('ID is required');
    }
  }

  protected validateData(data: any): void {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Data is required');
    }
  }

  protected validateIds(ids: Array<string | number>): void {
    if (!ids || ids.length === 0) {
      throw new Error('At least one ID is required');
    }
  }
}

// ========================
// REPOSITORY FACTORY
// ========================
export class RepositoryFactory {
  private static repositories: Map<string, any> = new Map();

  static create<TEntity, TCreateDto = Partial<TEntity>, TUpdateDto = Partial<TEntity>>(
    apiClient: ApiClient,
    config: RepositoryConfig
  ): BaseRepository<TEntity, TCreateDto, TUpdateDto> {
    const key = config.endpoint;
    
    if (!this.repositories.has(key)) {
      const repository = new BaseRepository<TEntity, TCreateDto, TUpdateDto>(apiClient, config);
      this.repositories.set(key, repository);
    }
    
    return this.repositories.get(key) as BaseRepository<TEntity, TCreateDto, TUpdateDto>;
  }

  static clear(): void {
    this.repositories.clear();
  }
}